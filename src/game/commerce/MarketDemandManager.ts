import type { ProductDefinition } from '../definitions'

export type PurchaseDecision = 'accept' | 'reduce' | 'reject'

export interface CustomerPriceContext {
  /** 0 = insensible, 1 = très sensible. */
  priceSensitivity: number
  /** Budget restant du client au moment de la décision. */
  remainingBudget?: number
}

export interface PurchaseDecisionResult {
  decision: PurchaseDecision
  acceptedQuantity: number
  priceRatio: number
  acceptanceProbability: number
  satisfactionDelta: number
}

export interface MarketDemandOptions { random?: () => number }

/**
 * Calcule la réaction d’un client face au prix sans dépendre de Phaser.
 * La source aléatoire injectable permet des tests reproductibles.
 */
export class MarketDemandManager {
  private readonly random: () => number

  constructor(options: MarketDemandOptions = {}) { this.random = options.random ?? Math.random }

  evaluatePurchase(product: ProductDefinition, salePrice: number, requestedQuantity: number, customer: CustomerPriceContext): PurchaseDecisionResult {
    const quantity = Math.max(0, Math.floor(requestedQuantity))
    if (quantity === 0) return this.result('reject', 0, 1, 0, 0)

    // Le prix magasin est mutable. Le prix de marché ne doit donc jamais
    // retomber sur salePrice, sinon toute hausse deviendrait artificiellement neutre.
    const marketPrice = Math.max(.01, product.marketPrice ?? product.purchasePrice * 2.2)
    const priceRatio = salePrice / marketPrice
    const sensitivity = clamp(customer.priceSensitivity, 0, 1)

    if (customer.remainingBudget !== undefined && salePrice > customer.remainingBudget) {
      return this.result('reject', 0, priceRatio, 0, -12)
    }

    const relativeOverprice = Math.max(0, priceRatio - 1)
    const relativeDiscount = Math.max(0, 1 - priceRatio)
    const productSensitivity = clamp(product.priceSensitivity ?? .5, 0, 1)
    const combinedSensitivity = (sensitivity + productSensitivity) / 2
    const acceptanceProbability = clamp(.94 + relativeDiscount * .2 - relativeOverprice * (1.15 * combinedSensitivity + .25), .05, .99)

    if (this.random() <= acceptanceProbability) {
      const satisfactionDelta = Math.round(relativeDiscount * 10 - relativeOverprice * 12 * combinedSensitivity)
      return this.result('accept', quantity, priceRatio, acceptanceProbability, satisfactionDelta)
    }

    const reductionProbability = clamp(.55 - relativeOverprice * .25, .1, .65)
    if (quantity > 1 && this.random() <= reductionProbability) {
      return this.result('reduce', Math.max(1, Math.floor(quantity / 2)), priceRatio, acceptanceProbability, -6)
    }

    return this.result('reject', 0, priceRatio, acceptanceProbability, -10)
  }

  private result(decision: PurchaseDecision, acceptedQuantity: number, priceRatio: number, acceptanceProbability: number, satisfactionDelta: number): PurchaseDecisionResult {
    return { decision, acceptedQuantity, priceRatio, acceptanceProbability, satisfactionDelta }
  }
}

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, Number(value) || 0)) }
