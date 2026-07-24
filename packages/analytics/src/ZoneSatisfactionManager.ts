import type { ProductCategory } from '@market-tycoon/catalog'
import type { ProductCustomerAnalytics } from './CustomerAnalyticsManager'

export type CommercialZoneKey = 'fruit-and-vegetables' | 'fresh' | 'grocery' | 'drinks' | 'hygiene' | 'frozen'

export interface CommercialZoneDefinition {
  key: CommercialZoneKey
  name: string
  icon: string
  categories: ProductCategory[]
}

export interface ZoneSatisfactionBreakdown {
  price: number
  availability: number
  waiting: number
}

export interface ZoneSatisfactionSnapshot {
  key: CommercialZoneKey
  name: string
  icon: string
  score: number
  observations: number
  requestedQuantity: number
  acceptedQuantity: number
  breakdown: ZoneSatisfactionBreakdown
  strongestIssue?: keyof ZoneSatisfactionBreakdown
}

export const COMMERCIAL_ZONES: CommercialZoneDefinition[] = [
  { key: 'fruit-and-vegetables', name: 'Fruits et légumes', icon: '🍎', categories: ['fruit'] },
  { key: 'fresh', name: 'Frais', icon: '🥛', categories: ['fresh', 'bakery'] },
  { key: 'grocery', name: 'Épicerie', icon: '🥫', categories: ['grocery'] },
  { key: 'drinks', name: 'Boissons', icon: '🥤', categories: ['drink'] },
  { key: 'hygiene', name: 'Hygiène', icon: '🧼', categories: ['hygiene'] },
  { key: 'frozen', name: 'Surgelés', icon: '❄️', categories: ['frozen'] },
]

export class ZoneSatisfactionManager {
  getSnapshot(products: ProductCustomerAnalytics[], averageQueueTimeMs = 0): ZoneSatisfactionSnapshot[] {
    return COMMERCIAL_ZONES.map(zone => this.createZoneSnapshot(zone, products, averageQueueTimeMs))
  }

  private createZoneSnapshot(zone: CommercialZoneDefinition, products: ProductCustomerAnalytics[], averageQueueTimeMs: number): ZoneSatisfactionSnapshot {
    const lines = products.filter(product => zone.categories.includes(product.category))
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
      key: zone.key,
      name: zone.name,
      icon: zone.icon,
      score,
      observations,
      requestedQuantity,
      acceptedQuantity,
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
