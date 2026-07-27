import type { PricingProduct } from './product'

export interface StoreProductPricing {
  productKey: string
  salePrice: number
}

export type PricePosition = 'cheaper' | 'aligned' | 'more-expensive'

export interface ProductPricingSummary {
  productKey: string
  purchasePrice: number
  marketPrice: number
  salePrice: number
  unitMargin: number
  marginRate: number
  markupRate: number
  priceIndex: number
  pricePosition: PricePosition
  isLossLeader: boolean
}

export interface StorePricingSnapshot {
  storePriceIndex: number
  averageStorePrice: number
  averageMarketPrice: number
  marketGapRate: number
  pricePosition: PricePosition
}

export class StorePricingManager {
  private prices = new Map<string, number>()

  constructor(products: PricingProduct[] = []) { this.reset(products) }

  reset(products: PricingProduct[]) {
    this.prices = new Map(products.map(product => [product.key, roundPrice(product.salePrice)]))
  }

  getSalePrice(product: PricingProduct | string, products?: PricingProduct[]) {
    if (typeof product !== 'string') return this.prices.get(product.key) ?? product.salePrice
    const definition = products?.find(item => item.key === product)
    return this.prices.get(product) ?? definition?.salePrice ?? 0
  }

  setSalePrice(productKey: string, salePrice: number) {
    const normalized = roundPrice(salePrice)
    if (!Number.isFinite(normalized) || normalized < 0.01) return false
    this.prices.set(productKey, normalized)
    return true
  }

  applyMarkup(products: PricingProduct[], markupRate: number, productKeys?: string[]) {
    const allowed = productKeys ? new Set(productKeys) : null
    const normalizedRate = Math.max(-.99, Number(markupRate) || 0)
    for (const product of products) {
      if (allowed && !allowed.has(product.key)) continue
      this.setSalePrice(product.key, product.purchasePrice * (1 + normalizedRate))
    }
  }

  getSummary(product: PricingProduct): ProductPricingSummary {
    const salePrice = this.getSalePrice(product)
    const marketPrice = Math.max(.01, product.marketPrice ?? product.salePrice)
    const unitMargin = salePrice - product.purchasePrice
    const priceIndex = salePrice / marketPrice * 100
    return {
      productKey: product.key,
      purchasePrice: product.purchasePrice,
      marketPrice,
      salePrice,
      unitMargin,
      marginRate: salePrice > 0 ? unitMargin / salePrice : 0,
      markupRate: product.purchasePrice > 0 ? unitMargin / product.purchasePrice : 0,
      priceIndex: roundIndex(priceIndex),
      pricePosition: getPricePosition(priceIndex),
      isLossLeader: unitMargin < 0,
    }
  }

  getSnapshot(products: PricingProduct[]): StorePricingSnapshot {
    if (!products.length) {
      return { storePriceIndex: 100, averageStorePrice: 0, averageMarketPrice: 0, marketGapRate: 0, pricePosition: 'aligned' }
    }

    const totals = products.reduce((result, product) => {
      result.store += this.getSalePrice(product)
      result.market += Math.max(.01, product.marketPrice ?? product.salePrice)
      return result
    }, { store: 0, market: 0 })
    const averageStorePrice = totals.store / products.length
    const averageMarketPrice = totals.market / products.length
    const storePriceIndex = averageMarketPrice > 0 ? averageStorePrice / averageMarketPrice * 100 : 100

    return {
      storePriceIndex: roundIndex(storePriceIndex),
      averageStorePrice: roundPrice(averageStorePrice),
      averageMarketPrice: roundPrice(averageMarketPrice),
      marketGapRate: roundRate(storePriceIndex / 100 - 1),
      pricePosition: getPricePosition(storePriceIndex),
    }
  }

  exportState(): StoreProductPricing[] {
    return [...this.prices.entries()].map(([productKey, salePrice]) => ({ productKey, salePrice }))
  }

  importState(state: StoreProductPricing[] | undefined, products: PricingProduct[]) {
    this.reset(products)
    for (const line of state ?? []) {
      if (products.some(product => product.key === line.productKey)) this.setSalePrice(line.productKey, line.salePrice)
    }
  }
}

function getPricePosition(priceIndex: number): PricePosition {
  if (priceIndex < 97) return 'cheaper'
  if (priceIndex > 103) return 'more-expensive'
  return 'aligned'
}

function roundPrice(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function roundIndex(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 10) / 10
}

function roundRate(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 1000) / 1000
}
