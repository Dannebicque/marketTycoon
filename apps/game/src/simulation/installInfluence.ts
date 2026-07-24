import type Phaser from 'phaser'
import {
  InfluenceEngine,
  advertisingManager,
  promotionManager,
  storeReputationManager,
  type StoreReputationState,
  type TrafficForecast,
} from '@market-tycoon/economy'
import { gameEvents, type StoreDayClosedEvent } from '@market-tycoon/events'
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

export function installInfluence() {
  if (installed) return
  installed = true
  restoreInfluence()

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
