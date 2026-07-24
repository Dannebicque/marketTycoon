import {
  customerAnalytics,
  customerVisitAnalytics,
  storePerformanceAnalytics,
  type CustomerAnalyticsState,
  type CustomerVisitAnalyticsState,
  type StorePerformanceAnalyticsState,
} from '@market-tycoon/analytics'
import { gameEvents } from '@market-tycoon/events'

export const ANALYTICS_STORAGE_KEY = 'market-tycoon.analytics.v1'

interface PersistentAnalyticsState {
  version: 1
  savedAt: string
  customerPurchases: CustomerAnalyticsState
  customerVisits: CustomerVisitAnalyticsState
  storePerformance: StorePerformanceAnalyticsState
}

let installed = false
let saveTimer: number | undefined

export function installPersistentAnalytics() {
  if (installed) return
  installed = true
  restore()

  const persistAfterEvent = () => schedulePersist()
  gameEvents.on('product:purchase-decision', persistAfterEvent)
  gameEvents.on('customer:visit-completed', persistAfterEvent)
  gameEvents.on('customer:abandoned-visit', persistAfterEvent)
  gameEvents.on('store:day-closed', snapshot => {
    storePerformanceAnalytics.record(snapshot)
    schedulePersist(true)
  })

  window.addEventListener('beforeunload', persist)
}

export function clearPersistentAnalytics() {
  customerAnalytics.clear()
  customerVisitAnalytics.clear()
  storePerformanceAnalytics.clear()
  localStorage.removeItem(ANALYTICS_STORAGE_KEY)
}

export function persistAnalyticsNow() {
  persist()
}

function restore() {
  const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY)
  if (!raw) return
  try {
    const state = JSON.parse(raw) as Partial<PersistentAnalyticsState>
    if (state.version !== 1) return
    customerAnalytics.importState(state.customerPurchases)
    customerVisitAnalytics.importState(state.customerVisits)
    storePerformanceAnalytics.importState(state.storePerformance)
  } catch {
    localStorage.removeItem(ANALYTICS_STORAGE_KEY)
  }
}

function schedulePersist(immediate = false) {
  if (saveTimer !== undefined) window.clearTimeout(saveTimer)
  if (immediate) {
    persist()
    return
  }
  saveTimer = window.setTimeout(persist, 250)
}

function persist() {
  if (saveTimer !== undefined) window.clearTimeout(saveTimer)
  saveTimer = undefined
  const state: PersistentAnalyticsState = {
    version: 1,
    savedAt: new Date().toISOString(),
    customerPurchases: customerAnalytics.exportState(),
    customerVisits: customerVisitAnalytics.exportState(),
    storePerformance: storePerformanceAnalytics.exportState(),
  }
  localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(state))
}
