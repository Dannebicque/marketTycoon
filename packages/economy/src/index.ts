export { StorePricingManager } from './StorePricingManager'
export type { ProductPricingSummary, StoreProductPricing } from './StorePricingManager'
export { MarketDemandManager } from './MarketDemandManager'
export type {
  CustomerPriceContext,
  MarketDemandOptions,
  PurchaseDecision,
  PurchaseDecisionResult,
} from './MarketDemandManager'
export type { DemandProduct, PricingProduct } from './product'

// Temporary compatibility exports. These implementations will move next.
export { PurchaseOrderManager } from '../../../src/game/logistics/PurchaseOrderManager'
export { ReserveManager } from '../../../src/game/logistics/ReserveManager'
