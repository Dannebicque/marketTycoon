import type { PaymentMethod, ProductDefinition } from '@market-tycoon/catalog'

export type CustomerJourneyState =
  | 'entering'
  | 'shopping'
  | 'queueing'
  | 'checkout'
  | 'leaving'
  | 'abandoned'
  | 'completed'

export interface CustomerProfile {
  id: string
  budget?: number
  priceSensitivity: number
  preferredPaymentMethod?: PaymentMethod
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
  state: CustomerJourneyState
  satisfaction: number
  basket: CustomerBasketSummary
}
