import type { PaymentMethod } from '@market-tycoon/catalog'
import type { CustomerProfile, CustomerSatisfactionBreakdown } from '@market-tycoon/customers'

export type CustomerVisitOutcome = 'completed' | 'abandoned'
export type CustomerAbandonReason = 'empty-basket' | 'no-compatible-checkout' | 'checkout-blocked' | 'impatient' | 'exit-blocked' | 'store-unavailable' | 'unknown'
export type CustomerVisitSatisfaction = CustomerSatisfactionBreakdown & { overall: number }

export interface CustomerVisitStarted { day: number; customerId: string; profile: CustomerProfile; startedAt?: number }
export interface CustomerVisitCompleted { articleCount: number; saleTotal: number; paymentMethod: PaymentMethod; queueTimeMs: number; satisfaction: CustomerVisitSatisfaction; completedAt?: number }
export interface CustomerVisitAbandoned { reason: CustomerAbandonReason; articleCount: number; potentialSaleTotal: number; queueTimeMs: number; satisfaction: CustomerVisitSatisfaction; completedAt?: number }

export interface CustomerVisitRecord {
  id: string
  day: number
  customerId: string
  profileKey: string
  budget: number
  priceSensitivity: number
  availableTimeMs: number
  requirement: number
  loyalty: number
  startedAt: number
  completedAt: number
  durationMs: number
  outcome: CustomerVisitOutcome
  abandonReason?: CustomerAbandonReason
  articleCount: number
  saleTotal: number
  potentialSaleTotal: number
  paymentMethod?: PaymentMethod
  queueTimeMs: number
  satisfaction: CustomerVisitSatisfaction
}

export interface CustomerVisitSummary {
  visits: number
  completedVisits: number
  abandonedVisits: number
  conversionRate: number
  revenue: number
  potentialLostRevenue: number
  averageBasketValue: number
  averageArticleCount: number
  averageVisitDurationMs: number
  averageQueueTimeMs: number
  averageSatisfaction: CustomerVisitSatisfaction
}

export interface CustomerProfileVisitAnalytics extends CustomerVisitSummary { profileKey: string }
export interface CustomerVisitAnalyticsState { visits: CustomerVisitRecord[] }
interface ActiveVisit { day: number; customerId: string; profile: CustomerProfile; startedAt: number }
const MAX_VISITS = 2_000

export class CustomerVisitAnalyticsManager {
  private readonly activeVisits = new Map<string, ActiveVisit>()
  private visits: CustomerVisitRecord[] = []

  start(input: CustomerVisitStarted) {
    const active: ActiveVisit = { day: input.day, customerId: input.customerId, profile: cloneProfile(input.profile), startedAt: input.startedAt ?? Date.now() }
    this.activeVisits.set(input.customerId, active)
    return { ...active, profile: cloneProfile(active.profile) }
  }

  complete(customerId: string, input: CustomerVisitCompleted) {
    return this.finish(customerId, { ...input, outcome: 'completed', potentialSaleTotal: input.saleTotal })
  }

  abandon(customerId: string, input: CustomerVisitAbandoned) {
    return this.finish(customerId, { ...input, outcome: 'abandoned', saleTotal: 0 })
  }

  getSummary(day?: number) { return summarizeVisits(this.filter(day)) }

  getProfileAnalytics(day?: number): CustomerProfileVisitAnalytics[] {
    const groups = new Map<string, CustomerVisitRecord[]>()
    for (const visit of this.filter(day)) groups.set(visit.profileKey, [...(groups.get(visit.profileKey) ?? []), visit])
    return [...groups.entries()].map(([profileKey, visits]) => ({ profileKey, ...summarizeVisits(visits) })).sort((a, b) => b.visits - a.visits)
  }

  getCustomerHistory(customerId: string) { return this.visits.filter(item => item.customerId === customerId).map(cloneVisit) }
  getRecent(limit = 30) { return this.visits.slice(-Math.max(0, limit)).reverse().map(cloneVisit) }
  exportState(): CustomerVisitAnalyticsState { return { visits: this.visits.map(cloneVisit) } }
  importState(state?: CustomerVisitAnalyticsState) { this.activeVisits.clear(); this.visits = (state?.visits ?? []).slice(-MAX_VISITS).map(cloneVisit) }
  clear() { this.activeVisits.clear(); this.visits = [] }

  private finish(customerId: string, result: {
    outcome: CustomerVisitOutcome
    reason?: CustomerAbandonReason
    articleCount: number
    saleTotal: number
    potentialSaleTotal: number
    paymentMethod?: PaymentMethod
    queueTimeMs: number
    satisfaction: CustomerVisitSatisfaction
    completedAt?: number
  }) {
    const active = this.activeVisits.get(customerId)
    if (!active) return null
    this.activeVisits.delete(customerId)
    const completedAt = result.completedAt ?? Date.now()
    const record: CustomerVisitRecord = {
      id: crypto.randomUUID(), day: active.day, customerId, profileKey: active.profile.profileKey,
      budget: active.profile.budget, priceSensitivity: active.profile.priceSensitivity,
      availableTimeMs: active.profile.availableTimeMs, requirement: active.profile.requirement,
      loyalty: active.profile.loyalty, startedAt: active.startedAt, completedAt,
      durationMs: Math.max(0, completedAt - active.startedAt), outcome: result.outcome,
      abandonReason: result.reason, articleCount: Math.max(0, result.articleCount),
      saleTotal: Math.max(0, result.saleTotal), potentialSaleTotal: Math.max(0, result.potentialSaleTotal),
      paymentMethod: result.paymentMethod, queueTimeMs: Math.max(0, result.queueTimeMs),
      satisfaction: { ...result.satisfaction },
    }
    this.visits.push(record)
    if (this.visits.length > MAX_VISITS) this.visits.splice(0, this.visits.length - MAX_VISITS)
    return cloneVisit(record)
  }

  private filter(day?: number) { return day === undefined ? this.visits : this.visits.filter(item => item.day === day) }
}

function summarizeVisits(visits: CustomerVisitRecord[]): CustomerVisitSummary {
  const completed = visits.filter(item => item.outcome === 'completed')
  return {
    visits: visits.length, completedVisits: completed.length, abandonedVisits: visits.length - completed.length,
    conversionRate: visits.length ? completed.length / visits.length : 0,
    revenue: sum(completed, item => item.saleTotal),
    potentialLostRevenue: sum(visits, item => Math.max(0, item.potentialSaleTotal - item.saleTotal)),
    averageBasketValue: average(completed, item => item.saleTotal),
    averageArticleCount: average(completed, item => item.articleCount),
    averageVisitDurationMs: average(visits, item => item.durationMs),
    averageQueueTimeMs: average(visits, item => item.queueTimeMs),
    averageSatisfaction: {
      overall: average(visits, item => item.satisfaction.overall), price: average(visits, item => item.satisfaction.price),
      queue: average(visits, item => item.satisfaction.queue), availability: average(visits, item => item.satisfaction.availability),
      checkout: average(visits, item => item.satisfaction.checkout),
    },
  }
}

function cloneProfile(profile: CustomerProfile): CustomerProfile { return { ...profile, preferredCategories: [...profile.preferredCategories] } }
function cloneVisit(visit: CustomerVisitRecord): CustomerVisitRecord { return { ...visit, satisfaction: { ...visit.satisfaction } } }
function sum<T>(items: T[], selector: (item: T) => number) { return items.reduce((total, item) => total + selector(item), 0) }
function average<T>(items: T[], selector: (item: T) => number) { return items.length ? sum(items, selector) / items.length : 0 }
