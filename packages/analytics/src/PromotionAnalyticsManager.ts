export interface PromotionDecisionObservation {
  day: number
  productKey: string
  promotionId?: string
  requestedQuantity: number
  acceptedQuantity: number
  createdAt: number
}

export interface PromotionSaleObservation {
  day: number
  productKey: string
  promotionId?: string
  quantity: number
  unitSalePrice: number
  unitCost: number
  createdAt: number
}

export interface PromotionAnalyticsState {
  decisions?: PromotionDecisionObservation[]
  sales?: PromotionSaleObservation[]
}

export interface PromotionPeriodMetrics {
  days: number
  requestedQuantity: number
  acceptedQuantity: number
  quantitySold: number
  revenue: number
  grossMargin: number
  conversionRate: number
  averageUnitPrice: number
}

export interface PromotionCampaignReport {
  promotionId: string
  before: PromotionPeriodMetrics
  during: PromotionPeriodMetrics
  after: PromotionPeriodMetrics
  campaignCost: number
  incrementalQuantity: number
  incrementalRevenue: number
  sacrificedMargin: number
  estimatedNetImpact: number
  roi: number
}

const MAX_OBSERVATIONS = 10_000

export class PromotionAnalyticsManager {
  private decisions: PromotionDecisionObservation[] = []
  private sales: PromotionSaleObservation[] = []

  recordDecision(input: Omit<PromotionDecisionObservation, 'createdAt'> & { createdAt?: number }) {
    this.decisions.push({ ...input, createdAt: input.createdAt ?? Date.now() })
    this.prune()
  }

  recordSale(input: Omit<PromotionSaleObservation, 'createdAt'> & { createdAt?: number }) {
    this.sales.push({ ...input, createdAt: input.createdAt ?? Date.now() })
    this.prune()
  }

  getCampaignReport(promotion: { id: string; productKey: string; startDay: number; endDay: number; campaignCost?: number }): PromotionCampaignReport {
    const duration = Math.max(1, promotion.endDay - promotion.startDay + 1)
    const before = this.metrics(promotion.productKey, promotion.startDay - duration, promotion.startDay - 1)
    const during = this.metrics(promotion.productKey, promotion.startDay, promotion.endDay, promotion.id)
    const after = this.metrics(promotion.productKey, promotion.endDay + 1, promotion.endDay + duration)
    const baselineQuantityPerDay = before.days ? before.quantitySold / before.days : 0
    const baselineRevenuePerDay = before.days ? before.revenue / before.days : 0
    const expectedQuantity = baselineQuantityPerDay * during.days
    const expectedRevenue = baselineRevenuePerDay * during.days
    const incrementalQuantity = during.quantitySold - expectedQuantity
    const incrementalRevenue = during.revenue - expectedRevenue
    const baselineMarginPerUnit = before.quantitySold ? before.grossMargin / before.quantitySold : 0
    const expectedMarginAtBaseline = during.quantitySold * baselineMarginPerUnit
    const sacrificedMargin = Math.max(0, expectedMarginAtBaseline - during.grossMargin)
    const campaignCost = Math.max(0, promotion.campaignCost ?? 0)
    const investment = sacrificedMargin + campaignCost
    const estimatedNetImpact = incrementalRevenue - investment
    return {
      promotionId: promotion.id,
      before,
      during,
      after,
      campaignCost,
      incrementalQuantity,
      incrementalRevenue,
      sacrificedMargin,
      estimatedNetImpact,
      roi: investment > 0 ? estimatedNetImpact / investment : estimatedNetImpact > 0 ? 1 : 0,
    }
  }

  exportState(): PromotionAnalyticsState {
    return { decisions: this.decisions.map(item => ({ ...item })), sales: this.sales.map(item => ({ ...item })) }
  }

  importState(state?: PromotionAnalyticsState) {
    this.decisions = (state?.decisions ?? []).slice(-MAX_OBSERVATIONS).map(item => ({ ...item }))
    this.sales = (state?.sales ?? []).slice(-MAX_OBSERVATIONS).map(item => ({ ...item }))
  }

  clear() { this.decisions = []; this.sales = [] }

  private metrics(productKey: string, startDay: number, endDay: number, promotionId?: string): PromotionPeriodMetrics {
    if (endDay < 1 || startDay > endDay) return emptyMetrics()
    const from = Math.max(1, startDay)
    const decisions = this.decisions.filter(item => item.productKey === productKey && item.day >= from && item.day <= endDay && (promotionId === undefined || item.promotionId === promotionId))
    const sales = this.sales.filter(item => item.productKey === productKey && item.day >= from && item.day <= endDay && (promotionId === undefined || item.promotionId === promotionId))
    const requestedQuantity = sum(decisions, item => item.requestedQuantity)
    const acceptedQuantity = sum(decisions, item => item.acceptedQuantity)
    const quantitySold = sum(sales, item => item.quantity)
    const revenue = sum(sales, item => item.quantity * item.unitSalePrice)
    const grossMargin = sum(sales, item => item.quantity * (item.unitSalePrice - item.unitCost))
    return {
      days: Math.max(0, endDay - from + 1),
      requestedQuantity,
      acceptedQuantity,
      quantitySold,
      revenue,
      grossMargin,
      conversionRate: requestedQuantity ? acceptedQuantity / requestedQuantity : 0,
      averageUnitPrice: quantitySold ? revenue / quantitySold : 0,
    }
  }

  private prune() {
    if (this.decisions.length > MAX_OBSERVATIONS) this.decisions.splice(0, this.decisions.length - MAX_OBSERVATIONS)
    if (this.sales.length > MAX_OBSERVATIONS) this.sales.splice(0, this.sales.length - MAX_OBSERVATIONS)
  }
}

export const promotionAnalytics = new PromotionAnalyticsManager()

function emptyMetrics(): PromotionPeriodMetrics {
  return { days: 0, requestedQuantity: 0, acceptedQuantity: 0, quantitySold: 0, revenue: 0, grossMargin: 0, conversionRate: 0, averageUnitPrice: 0 }
}
function sum<T>(items: T[], selector: (item: T) => number) { return items.reduce((total, item) => total + selector(item), 0) }
