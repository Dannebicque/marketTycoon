import type Phaser from 'phaser'
import { getProductDefinition, type ProductCategory } from '@market-tycoon/catalog'
import { CUSTOMER_PROFILE_CATALOG, type CustomerProfile, type CustomerProfileKey } from '@market-tycoon/customers'
import {
  InfluenceEngine,
  advertisingManager,
  promotionManager,
  storeReputationManager,
  type StoreReputationState,
  type TrafficForecast,
} from '@market-tycoon/economy'
import { gameEvents, type StoreDayClosedEvent } from '@market-tycoon/events'
import { CustomerVisitRegistry, StoreSimulation, type ShoppingPlanItem } from '@market-tycoon/simulation-engine'
import { StoreScene } from '../phaser/StoreScene'
import { getSimulationContext } from './SimulationContext'

export const STORE_REPUTATION_STORAGE_KEY = 'market-tycoon.store-reputation.v1'

interface InfluenceRuntimeSnapshot {
  day: number
  forecast: TrafficForecast
  actualVisitors: number
  previousDayVisitors: number
  previousDayServed: number
  previousDayLost: number
  previousDaySatisfaction: number
}

const engine = new InfluenceEngine()
let installed = false
let activeScene: StoreScene | null = null
let runtime: InfluenceRuntimeSnapshot = createRuntime(1)
let pendingCustomerProfile: CustomerProfile | null = null

export function installInfluence() {
  if (installed) return
  installed = true
  restoreInfluence()
  installCustomerProfileSelection()
  installDemandAwareShoppingPlans()

  const originalCreate = StoreScene.prototype.create
  StoreScene.prototype.create = function createWithInfluence() {
    originalCreate.call(this)
    activeScene = this
    refreshForecast(this.day)
    configureSpawnTimer(this)
  }

  const originalToggleAutoSpawn = StoreScene.prototype.toggleAutoSpawn
  StoreScene.prototype.toggleAutoSpawn = function toggleInfluencedAutoSpawn() {
    const scene = this as StoreScene & { spawnTimer?: Phaser.Time.TimerEvent; setStatus?: (message: string, color?: string) => void }
    if (scene.currentMinutes >= 20 * 60) return originalToggleAutoSpawn.call(this)
    scene.autoSpawn = !scene.autoSpawn
    configureSpawnTimer(scene)
    scene.setStatus?.(`Arrivées automatiques ${scene.autoSpawn ? 'activées' : 'désactivées'} · prévision ${runtime.forecast.expectedVisitors} visiteurs.`, scene.autoSpawn ? '#86efac' : '#cbd5e1')
  }

  const originalSpawnCustomer = StoreScene.prototype.spawnCustomer
  StoreScene.prototype.spawnCustomer = async function spawnInfluencedCustomer() {
    if (this.currentMinutes < 20 * 60) runtime.actualVisitors += 1
    return originalSpawnCustomer.call(this)
  }

  const originalStartNextDay = StoreScene.prototype.startNextDay
  StoreScene.prototype.startNextDay = function startInfluencedDay() {
    const previousDay = this.day
    originalStartNextDay.call(this)
    if (this.day === previousDay) return
    activeScene = this
    runtime.actualVisitors = 0
    refreshForecast(this.day)
    configureSpawnTimer(this)
    persistInfluence()
    window.dispatchEvent(new CustomEvent('market-tycoon:influence-updated', { detail: getInfluenceSnapshot() }))
  }

  gameEvents.on('store:day-closed', processClosedDay)
  window.addEventListener('beforeunload', persistInfluence)
  window.addEventListener('market-tycoon:commercial-context-changed', () => {
    if (!activeScene) return
    refreshForecast(activeScene.day)
    configureSpawnTimer(activeScene)
    window.dispatchEvent(new CustomEvent('market-tycoon:influence-updated', { detail: getInfluenceSnapshot() }))
  })
}

export function getInfluenceSnapshot() {
  return {
    ...runtime,
    forecast: {
      ...runtime.forecast,
      factors: runtime.forecast.factors.map(item => ({ ...item })),
      profileWeights: { ...runtime.forecast.profileWeights },
    },
    reputation: storeReputationManager.getSnapshot(),
    context: getSimulationContext(runtime.day),
  }
}

export function persistInfluence() {
  localStorage.setItem(STORE_REPUTATION_STORAGE_KEY, JSON.stringify(storeReputationManager.exportState()))
}

export function restoreInfluence() {
  try {
    const stored = localStorage.getItem(STORE_REPUTATION_STORAGE_KEY)
    storeReputationManager.importState(stored ? JSON.parse(stored) as StoreReputationState : undefined)
  } catch {
    storeReputationManager.importState()
  }
}

function installCustomerProfileSelection() {
  const originalStart = CustomerVisitRegistry.prototype.start
  CustomerVisitRegistry.prototype.start = function startInfluencedVisit(customerId, options) {
    const profileKey = options.profileKey ?? chooseProfileKey(runtime.forecast.profileWeights)
    const customer = originalStart.call(this, customerId, { ...options, profileKey })
    pendingCustomerProfile = customer.profile
    return customer
  }
}

function installDemandAwareShoppingPlans() {
  const originalCreateShoppingPlan = StoreSimulation.prototype.createShoppingPlan
  StoreSimulation.prototype.createShoppingPlan = function createInfluencedShoppingPlan(buildings) {
    const profile = pendingCustomerProfile
    pendingCustomerProfile = null
    if (!profile) return originalCreateShoppingPlan.call(this, buildings)

    const candidates = uniquePlanItems([
      ...originalCreateShoppingPlan.call(this, buildings),
      ...originalCreateShoppingPlan.call(this, buildings),
      ...originalCreateShoppingPlan.call(this, buildings),
    ])
    if (!candidates.length) return []

    const context = getSimulationContext(runtime.day)
    const categoryBoosts = getContextCategoryBoosts(context.weather.kind, context.calendar.periodLabel)
    const scored = candidates
      .map(item => ({ item, score: scorePlanItem(this, item, profile, categoryBoosts) + Math.random() * .3 }))
      .sort((a, b) => b.score - a.score)

    const demand = Math.max(.55, Math.min(2.2, runtime.forecast.demandMultiplier))
    const requirementLift = .75 + profile.requirement * .65
    const targetLines = Math.max(1, Math.min(5, Math.round((1.4 + Math.random() * 1.6) * demand * requirementLift)))
    const quantityMultiplier = Math.max(.7, Math.min(2.4, demand * (.85 + profile.requirement * .45)))

    return scored.slice(0, targetLines).map(({ item }) => ({
      ...item,
      requestedQuantity: Math.max(1, Math.min(6, Math.round(item.requestedQuantity * quantityMultiplier + (Math.random() < demand - 1 ? 1 : 0)))),
    }))
  }
}

function chooseProfileKey(weights: TrafficForecast['profileWeights']): CustomerProfileKey {
  const bucket = weightedChoice([
    ['budget', weights.budget],
    ['regular', weights.regular],
    ['convenience', weights.convenience],
  ] as const)
  if (bucket === 'budget') return Math.random() < .82 ? 'budget' : 'family'
  if (bucket === 'convenience') return Math.random() < .82 ? 'hurried' : 'premium'
  const loyalty = storeReputationManager.getSnapshot().loyalty
  const roll = Math.random()
  if (loyalty >= 55 && roll < .52) return 'regular'
  if (roll < .72) return 'family'
  return roll < .88 ? 'regular' : 'premium'
}

function weightedChoice<T extends string>(entries: readonly (readonly [T, number])[]) {
  const total = entries.reduce((sum, [, weight]) => sum + Math.max(0, weight), 0)
  let cursor = Math.random() * Math.max(total, .0001)
  for (const [key, weight] of entries) {
    cursor -= Math.max(0, weight)
    if (cursor <= 0) return key
  }
  return entries.at(-1)![0]
}

function scorePlanItem(simulation: StoreSimulation, item: ShoppingPlanItem, profile: CustomerProfile, categoryBoosts: Map<ProductCategory, number>) {
  const productKey = simulation.getCompartment(item.shelf.id, item.compartmentId)?.productKey
  const product = productKey ? getProductDefinition(productKey) : undefined
  if (!product) return 0
  const preferred = profile.preferredCategories.includes(product.category) ? 1.4 : 0
  const contextBoost = categoryBoosts.get(product.category) ?? 0
  const priceFit = profile.profileKey === 'budget' && product.salePrice <= profile.budget * .18 ? .35 : 0
  const convenienceFit = profile.profileKey === 'hurried' && ['drink', 'bakery', 'fresh'].includes(product.category) ? .45 : 0
  return 1 + preferred + contextBoost + priceFit + convenienceFit
}

function getContextCategoryBoosts(weatherKind: ReturnType<typeof getSimulationContext>['weather']['kind'], periodLabel?: string) {
  const boosts = new Map<ProductCategory, number>()
  const add = (category: ProductCategory, value: number) => boosts.set(category, (boosts.get(category) ?? 0) + value)
  if (weatherKind === 'heatwave' || weatherKind === 'sunny') { add('drink', 1.2); add('fresh', .65); add('fruit', .55); add('frozen', .4) }
  if (weatherKind === 'rain' || weatherKind === 'storm') { add('grocery', .75); add('bakery', .45); add('hygiene', .2) }
  if (weatherKind === 'snow' || weatherKind === 'cold') { add('grocery', 1); add('frozen', .45); add('bakery', .55) }
  if (periodLabel?.includes('Fêtes')) { add('drink', 1); add('fresh', .8); add('bakery', .75); add('grocery', .45) }
  if (periodLabel?.includes('Rentrée')) { add('grocery', .9); add('drink', .5); add('hygiene', .45) }
  if (periodLabel?.includes('Pâques')) { add('grocery', .8); add('bakery', .65) }
  return boosts
}

function uniquePlanItems(items: ShoppingPlanItem[]) {
  const seen = new Set<string>()
  return items.filter(item => {
    const key = `${item.shelf.id}:${item.compartmentId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function processClosedDay(snapshot: StoreDayClosedEvent) {
  const analytics = activeScene?.simulation.customerAnalytics.getSummary(snapshot.day)
  const requested = analytics?.requestedQuantity ?? 0
  const availabilityRate = requested > 0 ? (analytics?.acceptedQuantity ?? 0) / requested : 1
  const visitors = Math.max(runtime.actualVisitors, snapshot.servedCustomers + snapshot.lostCustomers)
  const activePromotions = getActivePromotions(snapshot.day)
  const advertisingLift = Math.max(0, advertisingManager.getTrafficMultiplier(snapshot.day) - 1)

  storeReputationManager.processDay({
    day: snapshot.day,
    visitors,
    servedCustomers: snapshot.servedCustomers,
    lostCustomers: snapshot.lostCustomers,
    conversionRate: visitors > 0 ? snapshot.servedCustomers / visitors : 0,
    satisfactionScore: snapshot.averageSatisfaction,
    availabilityRate,
    advertisingLift,
    activePromotions: activePromotions.length,
  })

  runtime.previousDayVisitors = visitors
  runtime.previousDayServed = snapshot.servedCustomers
  runtime.previousDayLost = snapshot.lostCustomers
  runtime.previousDaySatisfaction = snapshot.averageSatisfaction
  persistInfluence()
}

function refreshForecast(day: number) {
  const reputation = storeReputationManager.getSnapshot()
  const promotions = getActivePromotions(day)
  const context = getSimulationContext(day)
  const averagePromotionDiscount = promotions.length
    ? promotions.reduce((sum, item) => sum + promotionDiscount(item), 0) / promotions.length
    : 0
  const weekdayMultiplier = [1, .92, .94, .98, 1.08, 1.24, 1.15][(day - 1) % 7]
  const calendarMultiplier = weekdayMultiplier * context.calendar.periodMultiplier
  const calendarLabel = context.calendar.periodLabel
    ? `${capitalize(context.calendar.weekday)} · ${context.calendar.periodLabel}`
    : capitalize(context.calendar.weekday)

  runtime.day = day
  runtime.forecast = engine.forecast({
    day,
    baseVisitors: 24,
    baseBasket: 15,
    notoriety: reputation.notoriety,
    trust: reputation.trust,
    loyalty: reputation.loyalty,
    advertisingMultiplier: advertisingManager.getTrafficMultiplier(day),
    activePromotions: promotions.length,
    averagePromotionDiscount,
    satisfactionScore: reputation.trust,
    calendarMultiplier,
    calendarLabel,
    weatherMultiplier: context.weather.trafficMultiplier,
    weatherDemandMultiplier: context.weather.demandMultiplier,
    weatherLabel: `${context.weather.icon} ${context.weather.label}, ${context.weather.temperature} °C`,
  })
}

function configureSpawnTimer(scene: StoreScene & { spawnTimer?: Phaser.Time.TimerEvent }) {
  scene.spawnTimer?.destroy()
  scene.spawnTimer = undefined
  if (!scene.autoSpawn || scene.currentMinutes >= 20 * 60) return
  const remainingMinutes = Math.max(10, 20 * 60 - scene.currentMinutes)
  const remainingVisitors = Math.max(1, runtime.forecast.expectedVisitors - runtime.actualVisitors)
  const realDurationMs = remainingMinutes / 10 * 750
  const delay = Math.max(800, Math.min(8_000, Math.round(realDurationMs / remainingVisitors)))
  scene.spawnTimer = scene.time.addEvent({
    delay,
    loop: true,
    callback: () => {
      if (!scene.autoSpawn || runtime.actualVisitors >= runtime.forecast.expectedVisitors) return
      void scene.spawnCustomer()
    },
  })
}

function getActivePromotions(day: number) {
  return promotionManager.getPromotions().filter(item => promotionManager.getStatus(item, day) === 'active')
}

function promotionDiscount(promotion: ReturnType<typeof promotionManager.getPromotions>[number]) {
  if (promotion.type === 'percentage' || promotion.type === 'second-item-discount') return promotion.value / 100
  if (promotion.type === 'x-for-y') return 1 - (promotion.payQuantity ?? 2) / (promotion.buyQuantity ?? 3)
  return .12
}

function createRuntime(day: number): InfluenceRuntimeSnapshot {
  const reputation = storeReputationManager.getSnapshot()
  const context = getSimulationContext(day)
  return {
    day,
    forecast: engine.forecast({
      day,
      baseVisitors: 24,
      baseBasket: 15,
      notoriety: reputation.notoriety,
      trust: reputation.trust,
      loyalty: reputation.loyalty,
      calendarMultiplier: context.calendar.periodMultiplier,
      calendarLabel: capitalize(context.calendar.weekday),
      weatherMultiplier: context.weather.trafficMultiplier,
      weatherDemandMultiplier: context.weather.demandMultiplier,
      weatherLabel: `${context.weather.icon} ${context.weather.label}, ${context.weather.temperature} °C`,
    }),
    actualVisitors: 0,
    previousDayVisitors: 0,
    previousDayServed: 0,
    previousDayLost: 0,
    previousDaySatisfaction: 0,
  }
}

function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1) }
