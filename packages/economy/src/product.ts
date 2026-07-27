import type { ProductDefinition } from '@market-tycoon/catalog'

export type DemandProduct = Pick<ProductDefinition, 'key' | 'purchasePrice' | 'salePrice' | 'marketPrice' | 'priceSensitivity'>

export type PricingProduct = Pick<ProductDefinition, 'key' | 'purchasePrice' | 'salePrice' | 'marketPrice'>
