export { CustomerAnalyticsManager, customerAnalytics } from './CustomerAnalyticsManager'
export type {
  AnalyticsProduct,
  CustomerAnalyticsState,
  CustomerAnalyticsSummary,
  CustomerPurchaseObservation,
  ProductCustomerAnalytics,
  PurchaseDecision,
  PurchaseDecisionResult,
} from './CustomerAnalyticsManager'
export { CustomerVisitAnalyticsManager, customerVisitAnalytics } from './CustomerVisitAnalyticsManager'
export type {
  CustomerAbandonReason,
  CustomerProfileVisitAnalytics,
  CustomerVisitAnalyticsState,
  CustomerVisitCompleted,
  CustomerVisitOutcome,
  CustomerVisitRecord,
  CustomerVisitSatisfaction,
  CustomerVisitStarted,
  CustomerVisitSummary,
} from './CustomerVisitAnalyticsManager'
export { ZoneSatisfactionManager } from './ZoneSatisfactionManager'
export type {
  CommercialSatisfactionSource,
  ZoneSatisfactionBreakdown,
  ZoneSatisfactionSnapshot,
} from './ZoneSatisfactionManager'
export { StorePerformanceAnalyticsManager, storePerformanceAnalytics } from './StorePerformanceAnalyticsManager'
export type {
  StorePerformanceAnalyticsState,
  StorePerformanceRecord,
  StorePerformanceSummary,
} from './StorePerformanceAnalyticsManager'
export { PromotionAnalyticsManager, promotionAnalytics } from './PromotionAnalyticsManager'
export type {
  PromotionAnalyticsState,
  PromotionCampaignReport,
  PromotionDecisionObservation,
  PromotionPeriodMetrics,
  PromotionSaleObservation,
} from './PromotionAnalyticsManager'
