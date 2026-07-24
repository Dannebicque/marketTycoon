import type { ProductCategory } from '@market-tycoon/catalog'
import type { ProductCustomerAnalytics } from './CustomerAnalyticsManager'

export interface CommercialSatisfactionSource {
  key: string
  name: string
  icon: string
  categories: ProductCategory[]
  zoneCount?: number
  cellCount?: number
}

export interface ZoneSatisfactionBreakdown {
  price: number
  availability: number
  waiting: number
}

export interface ZoneSatisfactionSnapshot {
  key: string
  name: string
  icon: string
  score: number
  observations: number
  requestedQuantity: number
  acceptedQuantity: number
  zoneCount: number
  cellCount: number
  breakdown: ZoneSatisfactionBreakdown
  strongestIssue?: keyof ZoneSatisfactionBreakdown
}

export class ZoneSatisfactionManager {
  getSnapshot(sources: readonly CommercialSatisfactionSource[], products: ProductCustomerAnalytics[], averageQueueTimeMs = 0): ZoneSatisfactionSnapshot[] {
    return sources.map(source => this.createSnapshot(source, products, averageQueueTimeMs))
  }

  private createSnapshot(source: CommercialSatisfactionSource, products: ProductCustomerAnalytics[], averageQueueTimeMs: number): ZoneSatisfactionSnapshot {
    const lines = products.filter(product => source.categories.includes(product.category))
    const observations = sum(lines, line => line.observations)
    const requestedQuantity = sum(lines, line => line.requestedQuantity)
    const acceptedQuantity = sum(lines, line => line.acceptedQuantity)

    const availability = requestedQuantity > 0 ? clampScore(acceptedQuantity / requestedQuantity * 100) : 100
    const weightedPriceRatio = requestedQuantity > 0
      ? sum(lines, line => line.averagePriceRatio * line.requestedQuantity) / requestedQuantity
      : 1
    const price = priceScore(weightedPriceRatio)
    const waiting = waitingScore(averageQueueTimeMs)
    const breakdown = { price, availability, waiting }
    const score = observations > 0
      ? clampScore(price * .4 + availability * .45 + waiting * .15)
      : 100

    const strongestIssue = observations > 0
      ? (Object.entries(breakdown).sort((a, b) => a[1] - b[1])[0]?.[0] as keyof ZoneSatisfactionBreakdown | undefined)
      : undefined

    return {
      key: source.key,
      name: source.name,
      icon: source.icon,
      score,
      observations,
      requestedQuantity,
      acceptedQuantity,
      zoneCount: source.zoneCount ?? 0,
      cellCount: source.cellCount ?? 0,
      breakdown,
      strongestIssue: strongestIssue && breakdown[strongestIssue] < 75 ? strongestIssue : undefined,
    }
  }
}

function priceScore(priceRatio: number) {
  const ratio = Number.isFinite(priceRatio) ? priceRatio : 1
  if (ratio <= 1) return clampScore(100 + (1 - ratio) * 25)
  return clampScore(100 - (ratio - 1) * 150)
}

function waitingScore(queueTimeMs: number) {
  const seconds = Math.max(0, queueTimeMs) / 1_000
  if (seconds <= 12) return 100
  return clampScore(100 - (seconds - 12) * 1.8)
}

function clampScore(value: number) { return Math.max(0, Math.min(100, Math.round(Number(value) || 0))) }
function sum<T>(items: T[], selector: (item: T) => number) { return items.reduce((total, item) => total + selector(item), 0) }
