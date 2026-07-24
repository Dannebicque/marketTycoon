import type { PricingProduct } from './product'

export type PromotionType = 'percentage' | 'fixed-price' | 'x-for-y' | 'second-item-discount'
export type PromotionChannel = 'shelf' | 'flyer' | 'coupon' | 'endcap'
export type PromotionStatus = 'scheduled' | 'active' | 'finished' | 'cancelled'

export interface ProductPromotion {
  id: string
  productKey: string
  type: PromotionType
  value: number
  startDay: number
  endDay: number
  channel: PromotionChannel
  campaignCost: number
  createdAt: number
  buyQuantity?: number
  payQuantity?: number
  cancelledAt?: number
}

export interface ProductPromotionInput {
  productKey: string
  type: PromotionType
  value: number
  startDay: number
  endDay: number
  channel?: PromotionChannel
  campaignCost?: number
  buyQuantity?: number
  payQuantity?: number
}

export interface PromotionPriceSummary {
  regularPrice: number
  effectivePrice: number
  regularTotal: number
  effectiveTotal: number
  discountAmount: number
  discountRate: number
  quantity: number
  label?: string
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

    const mechanics = normalizeMechanics(input)
    if (!mechanics) return null
    const channel = input.channel ?? 'shelf'
    const duration = endDay - startDay + 1
    const promotion: ProductPromotion = {
      id: `PROMO-${this.nextPromotion++}`,
      productKey: input.productKey,
      type: input.type,
      value,
      startDay,
      endDay,
      channel,
      campaignCost: roundPrice(Math.max(0, input.campaignCost ?? defaultChannelCost(channel, duration))),
      buyQuantity: mechanics.buyQuantity,
      payQuantity: mechanics.payQuantity,
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

  getPromotions() { return this.promotions.map(item => ({ ...item, channel: item.channel ?? 'shelf', campaignCost: item.campaignCost ?? 0 })) }

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

  getPrice(product: PricingProduct, day: number, requestedQuantity = 1): PromotionPriceSummary {
    const quantity = Math.max(1, Math.floor(requestedQuantity))
    const regularPrice = roundPrice(product.salePrice)
    const regularTotal = roundPrice(regularPrice * quantity)
    const promotion = this.getActivePromotion(product.key, day)
    if (!promotion) return { regularPrice, effectivePrice: regularPrice, regularTotal, effectiveTotal: regularTotal, discountAmount: 0, discountRate: 0, quantity }

    const effectiveTotal = calculatePromotionalTotal(promotion, regularPrice, quantity)
    const effectivePrice = roundPrice(effectiveTotal / quantity)
    const discountAmount = roundPrice(Math.max(0, regularTotal - effectiveTotal))
    return {
      regularPrice,
      effectivePrice,
      regularTotal,
      effectiveTotal,
      discountAmount,
      discountRate: regularTotal > 0 ? discountAmount / regularTotal : 0,
      quantity,
      label: this.getLabel(promotion),
      promotion: { ...promotion },
    }
  }

  getLabel(promotion: ProductPromotion) {
    if (promotion.type === 'percentage') return `-${formatNumber(promotion.value)} %`
    if (promotion.type === 'fixed-price') return `${promotion.value.toFixed(2)} €`
    if (promotion.type === 'x-for-y') return `${promotion.buyQuantity ?? 3} pour ${promotion.payQuantity ?? 2}`
    return `2e à -${formatNumber(promotion.value)} %`
  }

  getChannelLabel(channel: PromotionChannel) {
    return channel === 'flyer' ? 'Prospectus' : channel === 'coupon' ? 'Coupon' : channel === 'endcap' ? 'Tête de gondole' : 'Étiquette rayon'
  }

  exportState(): PromotionState { return { nextPromotion: this.nextPromotion, promotions: this.getPromotions() } }

  importState(state?: PromotionState) {
    this.nextPromotion = Math.max(1, state?.nextPromotion ?? 1)
    this.promotions = (state?.promotions ?? []).map(item => ({ ...item, channel: item.channel ?? 'shelf', campaignCost: item.campaignCost ?? 0 }))
  }
}

function calculatePromotionalTotal(promotion: ProductPromotion, regularPrice: number, quantity: number) {
  if (promotion.type === 'percentage') return roundPrice(regularPrice * quantity * (1 - promotion.value / 100))
  if (promotion.type === 'fixed-price') return roundPrice(Math.min(regularPrice, promotion.value) * quantity)
  if (promotion.type === 'x-for-y') {
    const buy = Math.max(2, promotion.buyQuantity ?? 3)
    const pay = Math.max(1, Math.min(buy - 1, promotion.payQuantity ?? buy - 1))
    const groups = Math.floor(quantity / buy)
    const remainder = quantity % buy
    return roundPrice((groups * pay + remainder) * regularPrice)
  }
  const pairs = Math.floor(quantity / 2)
  const remainder = quantity % 2
  const discountedSecondPrice = regularPrice * (1 - promotion.value / 100)
  return roundPrice(pairs * (regularPrice + discountedSecondPrice) + remainder * regularPrice)
}

function normalizeMechanics(input: ProductPromotionInput) {
  if (input.type !== 'x-for-y') return { buyQuantity: undefined, payQuantity: undefined }
  const buyQuantity = Math.max(2, Math.floor(input.buyQuantity ?? 3))
  const payQuantity = Math.max(1, Math.floor(input.payQuantity ?? buyQuantity - 1))
  if (payQuantity >= buyQuantity) return null
  return { buyQuantity, payQuantity }
}

function defaultChannelCost(channel: PromotionChannel, duration: number) {
  const base = channel === 'flyer' ? 35 : channel === 'coupon' ? 18 : channel === 'endcap' ? 24 : 4
  return base + Math.max(0, duration - 1) * Math.max(1, Math.round(base * .2))
}

function normalizeValue(type: PromotionType, value: number) {
  const normalized = Number(value)
  if (!Number.isFinite(normalized)) return null
  if (type === 'percentage' || type === 'second-item-discount') return normalized > 0 && normalized < 100 ? roundPrice(normalized) : null
  if (type === 'x-for-y') return 0
  return normalized >= .01 ? roundPrice(normalized) : null
}

function formatNumber(value: number) { return Number.isInteger(value) ? String(value) : value.toFixed(1) }
function roundPrice(value: number) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100 }
