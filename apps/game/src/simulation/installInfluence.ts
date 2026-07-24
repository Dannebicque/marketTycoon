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

interface SpawnControlledScene {
  autoSpawn: boolean
  currentMinutes: number
  time: Phaser.Time.Clock
  spawnTimer?: Phaser.Time.TimerEvent
  spawnCustomer: () => Promise<unknown>
  setStatus?: (message: string, color?: string) => void
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
    configureSpawnTimer(this as unknown as SpawnControlledScene)
  }

  const originalToggleAutoSpawn = StoreScene.prototype.toggleAutoSpawn
  StoreScene.prototype.toggleAutoSpawn = function toggleInfluencedAutoSpawn() {
    const scene = this as unknown as SpawnControlledScene
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
    configureSpawnTimer(this as unknown as SpawnControlledScene)
    persistInfluence()
    dispatchUpdate()
  }

  gameEvents.on('store:day-closed', processClosedDay)
  window.addEventListener('market-tycoon:influence-source-changed', refreshCurrentForecast)
  window.addEventListener('beforeunload', persistInfluence)
}

export function getInfluenceSnapshot() {
  refreshForecast(activeScene?.day ?? runtime.day)
  return {
    ...runtime,
    forecast: {
      ...runtime.forecast,
      factors: runtime.forecast.factors.map(item => ({ ...item })),
      profileWeights: { ...runtime.forecast.profileWeights },
    },
    reputation: storeReputationManager.getSnapshot(),
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
  dispatchUpdate()
}

function refreshCurrentForecast() {
  refreshForecast(activeScene?.day ?? runtime.day)
  if (activeScene) configureSpawnTimer(activeScene as unknown as SpawnControlledScene)
  dispatchUpdate()
}

function refreshForecast(day: number) {
  const reputation = storeReputationManager.getSnapshot()
  const promotions = getActivePromotions(day)
  const averagePromotionDiscount = promotions.length
    ? promotions.reduce((sum, item) => sum + promotionDiscount(item), 0) / promotions.length
    : 0

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
  })
}

function configureSpawnTimer(scene: SpawnControlledScene) {
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

function dispatchUpdate() {
  window.dispatchEvent(new CustomEvent('market-tycoon:influence-updated', { detail: getInfluenceSnapshot() }))
}

function createRuntime(day: number): InfluenceRuntimeSnapshot {
  const reputation = storeReputationManager.getSnapshot()
  return {
    day,
    forecast: engine.forecast({ day, baseVisitors: 24, baseBasket: 15, notoriety: reputation.notoriety, trust: reputation.trust, loyalty: reputation.loyalty }),
    actualVisitors: 0,
    previousDayVisitors: 0,
    previousDayServed: 0,
    previousDayLost: 0,
    previousDaySatisfaction: 0,
  }
}
