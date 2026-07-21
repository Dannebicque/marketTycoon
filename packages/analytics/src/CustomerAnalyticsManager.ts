export type PurchaseDecision = 'accept' | 'reduce' | 'reject'

export interface PurchaseDecisionResult {
  decision: PurchaseDecision
  acceptedQuantity: number
  priceRatio: number
  acceptanceProbability: number
  satisfactionDelta: number
}

export interface AnalyticsProduct {
  key: string
  name: string
  salePrice: number
  marketPrice?: number
}

export interface CustomerPurchaseObservation {
  id: string
  day: number
  customerId: string
  productKey: string
  productName: string
  requestedQuantity: number
  acceptedQuantity: number
  decision: PurchaseDecision
  salePrice: number
  marketPrice: number
  priceRatio: number
  acceptanceProbability: number
  satisfactionDelta: number
  createdAt: number
}

export interface ProductCustomerAnalytics {
  productKey: string
  productName: string
  observations: number
  requestedQuantity: number
  acceptedQuantity: number
  rejectedQuantity: number
  acceptedDecisions: number
  reducedDecisions: number
  rejectedDecisions: number
  conversionRate: number
  quantityConversionRate: number
  estimatedLostRevenue: number
  averageSalePrice: number
  averageMarketPrice: number
  averagePriceRatio: number
  averageSatisfactionDelta: number
}

export interface CustomerAnalyticsSummary {
  observations: number
  requestedQuantity: number
  acceptedQuantity: number
  rejectedQuantity: number
  conversionRate: number
  estimatedLostRevenue: number
  averageSatisfactionDelta: number
}

export interface CustomerAnalyticsState {
  observations: CustomerPurchaseObservation[]
}

const MAX_OBSERVATIONS = 2_000

export class CustomerAnalyticsManager {
  private observations: CustomerPurchaseObservation[] = []

  record(day: number, customerId: string, product: AnalyticsProduct, requestedQuantity: number, result: PurchaseDecisionResult) {
    const acceptedQuantity = Math.min(requestedQuantity, result.acceptedQuantity)
    const marketPrice = Math.max(.01, product.marketPrice ?? product.salePrice)
    const observation: CustomerPurchaseObservation = {
      id: crypto.randomUUID(), day, customerId, productKey: product.key, productName: product.name,
      requestedQuantity, acceptedQuantity, decision: result.decision, salePrice: product.salePrice,
      marketPrice, priceRatio: result.priceRatio, acceptanceProbability: result.acceptanceProbability,
      satisfactionDelta: result.satisfactionDelta, createdAt: Date.now(),
    }
    this.observations.push(observation)
    if (this.observations.length > MAX_OBSERVATIONS) this.observations.splice(0, this.observations.length - MAX_OBSERVATIONS)
    return { ...observation }
  }

  getSummary(day?: number): CustomerAnalyticsSummary {
    const observations = this.filter(day)
    const requestedQuantity = sum(observations, item => item.requestedQuantity)
    const acceptedQuantity = sum(observations, item => item.acceptedQuantity)
    return {
      observations: observations.length,
      requestedQuantity,
      acceptedQuantity,
      rejectedQuantity: Math.max(0, requestedQuantity - acceptedQuantity),
      conversionRate: observations.length ? observations.filter(item => item.acceptedQuantity > 0).length / observations.length : 0,
      estimatedLostRevenue: sum(observations, item => (item.requestedQuantity - item.acceptedQuantity) * item.salePrice),
      averageSatisfactionDelta: average(observations, item => item.satisfactionDelta),
    }
  }

  getProductAnalytics(day?: number): ProductCustomerAnalytics[] {
    const groups = new Map<string, CustomerPurchaseObservation[]>()
    for (const observation of this.filter(day)) {
      const group = groups.get(observation.productKey) ?? []
      group.push(observation)
      groups.set(observation.productKey, group)
    }
    return [...groups.entries()].map(([productKey, observations]) => {
      const requestedQuantity = sum(observations, item => item.requestedQuantity)
      const acceptedQuantity = sum(observations, item => item.acceptedQuantity)
      return {
        productKey, productName: observations[0]?.productName ?? productKey, observations: observations.length,
        requestedQuantity, acceptedQuantity, rejectedQuantity: Math.max(0, requestedQuantity - acceptedQuantity),
        acceptedDecisions: observations.filter(item => item.decision === 'accept').length,
        reducedDecisions: observations.filter(item => item.decision === 'reduce').length,
        rejectedDecisions: observations.filter(item => item.decision === 'reject').length,
        conversionRate: observations.length ? observations.filter(item => item.acceptedQuantity > 0).length / observations.length : 0,
        quantityConversionRate: requestedQuantity ? acceptedQuantity / requestedQuantity : 0,
        estimatedLostRevenue: sum(observations, item => (item.requestedQuantity - item.acceptedQuantity) * item.salePrice),
        averageSalePrice: average(observations, item => item.salePrice),
        averageMarketPrice: average(observations, item => item.marketPrice),
        averagePriceRatio: average(observations, item => item.priceRatio),
        averageSatisfactionDelta: average(observations, item => item.satisfactionDelta),
      }
    }).sort((a, b) => b.estimatedLostRevenue - a.estimatedLostRevenue)
  }

  getRecent(limit = 30) { return this.observations.slice(-Math.max(0, limit)).reverse().map(item => ({ ...item })) }
  exportState(): CustomerAnalyticsState { return { observations: this.observations.map(item => ({ ...item })) } }
  importState(state?: CustomerAnalyticsState) { this.observations = (state?.observations ?? []).slice(-MAX_OBSERVATIONS).map(item => ({ ...item })) }
  clear() { this.observations = [] }
  private filter(day?: number) { return day === undefined ? this.observations : this.observations.filter(item => item.day === day) }
}

function sum<T>(items: T[], selector: (item: T) => number) { return items.reduce((total, item) => total + selector(item), 0) }
function average<T>(items: T[], selector: (item: T) => number) { return items.length ? sum(items, selector) / items.length : 0 }
