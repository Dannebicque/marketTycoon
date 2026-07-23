import type { PricingProduct } from './product'

export type PromotionType = 'percentage' | 'fixed-price'
export type PromotionStatus = 'scheduled' | 'active' | 'finished' | 'cancelled'

export interface ProductPromotion {
  id: string
  productKey: string
  type: PromotionType
  value: number
  startDay: number
  endDay: number
  createdAt: number
  cancelledAt?: number
}

export interface ProductPromotionInput {
  productKey: string
  type: PromotionType
  value: number
  startDay: number
  endDay: number
}

export interface PromotionPriceSummary {
  regularPrice: number
  effectivePrice: number
  discountAmount: number
  discountRate: number
  promotion?: ProductPromotion
}

export interface PromotionState {
  nextPromotion?: number
  promotions?: ProductPromotion[]
}

export class PromotionManager {
  private promotions: ProductPromotion[] = []
  private nextPromotion = 1

  schedule(input: ProductPromotionInput) {
    const startDay = Math.max(1, Math.floor(input.startDay))
    const endDay = Math.max(startDay, Math.floor(input.endDay))
    const value = normalizeValue(input.type, input.value)
    if (!input.productKey || value === null) return null

    const promotion: ProductPromotion = {
      id: `PROMO-${this.nextPromotion++}`,
      productKey: input.productKey,
      type: input.type,
      value,
      startDay,
      endDay,
      createdAt: Date.now(),
    }
    this.promotions.push(promotion)
    return { ...promotion }
  }

  cancel(promotionId: string) {
    const promotion = this.promotions.find(item => item.id === promotionId)
    if (!promotion || promotion.cancelledAt) return false
    promotion.cancelledAt = Date.now()
    return true
  }

  getPromotions() {
    return this.promotions.map(item => ({ ...item }))
  }

  getStatus(promotion: ProductPromotion, day: number): PromotionStatus {
    if (promotion.cancelledAt) return 'cancelled'
    if (day < promotion.startDay) return 'scheduled'
    if (day > promotion.endDay) return 'finished'
    return 'active'
  }

  getActivePromotion(productKey: string, day: number) {
    return this.promotions
      .filter(item => item.productKey === productKey && this.getStatus(item, day) === 'active')
      .sort((a, b) => b.createdAt - a.createdAt)[0]
  }

  getPrice(product: PricingProduct, day: number): PromotionPriceSummary {
    const regularPrice = roundPrice(product.salePrice)
    const promotion = this.getActivePromotion(product.key, day)
    if (!promotion) return { regularPrice, effectivePrice: regularPrice, discountAmount: 0, discountRate: 0 }

    const effectivePrice = promotion.type === 'percentage'
      ? roundPrice(regularPrice * (1 - promotion.value / 100))
      : roundPrice(Math.min(regularPrice, promotion.value))
    const discountAmount = roundPrice(Math.max(0, regularPrice - effectivePrice))
    return {
      regularPrice,
      effectivePrice,
      discountAmount,
      discountRate: regularPrice > 0 ? discountAmount / regularPrice : 0,
      promotion: { ...promotion },
    }
  }

  exportState(): PromotionState {
    return { nextPromotion: this.nextPromotion, promotions: this.getPromotions() }
  }

  importState(state?: PromotionState) {
    this.nextPromotion = Math.max(1, state?.nextPromotion ?? 1)
    this.promotions = (state?.promotions ?? []).map(item => ({ ...item }))
  }
}

function normalizeValue(type: PromotionType, value: number) {
  const normalized = Number(value)
  if (!Number.isFinite(normalized)) return null
  if (type === 'percentage') return normalized > 0 && normalized < 100 ? roundPrice(normalized) : null
  return normalized >= .01 ? roundPrice(normalized) : null
}

function roundPrice(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}
