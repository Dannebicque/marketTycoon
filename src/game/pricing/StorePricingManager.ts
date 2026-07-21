import type { ProductDefinition } from '../definitions'

export interface StoreProductPricing {
  productKey: string
  salePrice: number
}

export interface ProductPricingSummary {
  productKey: string
  purchasePrice: number
  salePrice: number
  unitMargin: number
  marginRate: number
  markupRate: number
  isLossLeader: boolean
}

export class StorePricingManager {
  private prices = new Map<string, number>()

  constructor(products: ProductDefinition[] = []) {
    this.reset(products)
  }

  reset(products: ProductDefinition[]) {
    this.prices = new Map(products.map(product => [product.key, roundPrice(product.salePrice)]))
  }

  getSalePrice(product: ProductDefinition | string, products?: ProductDefinition[]) {
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

  applyMarkup(products: ProductDefinition[], markupRate: number, productKeys?: string[]) {
    const allowed = productKeys ? new Set(productKeys) : null
    const normalizedRate = Math.max(-.99, Number(markupRate) || 0)
    for (const product of products) {
      if (allowed && !allowed.has(product.key)) continue
      this.setSalePrice(product.key, product.purchasePrice * (1 + normalizedRate))
    }
  }

  getSummary(product: ProductDefinition): ProductPricingSummary {
    const salePrice = product.salePrice
    const unitMargin = salePrice - product.purchasePrice
    return {
      productKey: product.key,
      purchasePrice: product.purchasePrice,
      salePrice,
      unitMargin,
      marginRate: salePrice > 0 ? unitMargin / salePrice : 0,
      markupRate: product.purchasePrice > 0 ? unitMargin / product.purchasePrice : 0,
      isLossLeader: unitMargin < 0,
    }
  }

  exportState(): StoreProductPricing[] {
    return [...this.prices.entries()].map(([productKey, salePrice]) => ({ productKey, salePrice }))
  }

  importState(state: StoreProductPricing[] | undefined, products: ProductDefinition[]) {
    this.reset(products)
    for (const line of state ?? []) {
      if (products.some(product => product.key === line.productKey)) this.setSalePrice(line.productKey, line.salePrice)
    }
  }
}

function roundPrice(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}
