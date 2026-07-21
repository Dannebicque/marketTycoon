export interface DemandProduct {
  key: string
  purchasePrice: number
  salePrice: number
  marketPrice?: number
  priceSensitivity?: number
}

export interface PricingProduct {
  key: string
  purchasePrice: number
  salePrice: number
}
