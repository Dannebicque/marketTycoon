import { getProductDefinition } from '@market-tycoon/catalog'
import { promotionManager, type PromotionState } from '@market-tycoon/economy'
import { StoreSimulation } from '@market-tycoon/simulation-engine'

export const PROMOTIONS_STORAGE_KEY = 'market-tycoon.promotions.v1'

let installed = false
const simulationDays = new WeakMap<StoreSimulation, number>()

export function installPromotions() {
  if (installed) return
  installed = true
  restorePromotions()

  const originalSetCurrentDay = StoreSimulation.prototype.setCurrentDay
  StoreSimulation.prototype.setCurrentDay = function setCurrentDayWithPromotions(day: number) {
    simulationDays.set(this, Math.max(1, Math.floor(day)))
    return originalSetCurrentDay.call(this, day)
  }

  const originalTakeItems = StoreSimulation.prototype.takeItems
  StoreSimulation.prototype.takeItems = function takePromotionalItems(shelfId, compartmentId, requestedQuantity, context = {}) {
    const compartment = this.getCompartment(shelfId, compartmentId)
    const product = compartment?.productKey ? getProductDefinition(compartment.productKey) : undefined
    if (!product) return originalTakeItems.call(this, shelfId, compartmentId, requestedQuantity, context)

    const day = context.day ?? simulationDays.get(this) ?? 1
    const price = promotionManager.getPrice(product, day)
    if (!price.promotion) return originalTakeItems.call(this, shelfId, compartmentId, requestedQuantity, context)

    const regularPrice = product.salePrice
    product.salePrice = price.effectivePrice
    try {
      const line = originalTakeItems.call(this, shelfId, compartmentId, requestedQuantity, context)
      if (!line) return null
      return { ...line, product: { ...line.product, salePrice: price.effectivePrice } }
    } finally {
      product.salePrice = regularPrice
    }
  }

  window.addEventListener('beforeunload', persistPromotions)
}

export function persistPromotions() {
  localStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(promotionManager.exportState()))
}

export function restorePromotions() {
  try {
    const raw = localStorage.getItem(PROMOTIONS_STORAGE_KEY)
    promotionManager.importState(raw ? JSON.parse(raw) as PromotionState : undefined)
  } catch {
    promotionManager.importState()
  }
}
