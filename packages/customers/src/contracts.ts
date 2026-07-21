import type { PaymentMethod, ProductCategory, ProductDefinition } from '@market-tycoon/catalog'
import type { CustomerProfileKey } from './CustomerProfileCatalog'

export type CustomerJourneyState =
  | 'entering'
  | 'shopping'
  | 'queueing'
  | 'checkout'
  | 'leaving'
  | 'abandoned'
  | 'completed'

export type CustomerSatisfactionFactor = 'price' | 'queue' | 'availability' | 'checkout'

export interface CustomerSatisfactionBreakdown {
  price: number
  queue: number
  availability: number
  checkout: number
}

export interface CustomerProfile {
  id: string
  profileKey: CustomerProfileKey
  budget: number
  priceSensitivity: number
  availableTimeMs: number
  requirement: number
  loyalty: number
  preferredPaymentMethod?: PaymentMethod
  preferredCategories: ProductCategory[]
}

export interface CustomerBasketLine {
  shelfId: string
  compartmentId: string
  product: ProductDefinition
  quantity: number
  requestedQuantity?: number
  satisfactionDelta?: number
}

export interface CustomerBasketSummary {
  lines: CustomerBasketLine[]
  articleCount: number
  saleTotal: number
  purchaseTotal: number
}

export interface CustomerSnapshot {
  id: string
  profile: CustomerProfile
  state: CustomerJourneyState
  satisfaction: number
  satisfactionBreakdown: CustomerSatisfactionBreakdown
  basket: CustomerBasketSummary
}
