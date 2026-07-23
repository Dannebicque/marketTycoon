import { promotionAnalytics, type PromotionAnalyticsState } from '@market-tycoon/analytics'
import { getProductDefinition, isShelfDefinition } from '@market-tycoon/catalog'
import { promotionManager, type ProductPromotion, type PromotionState } from '@market-tycoon/economy'
import { gameEvents } from '@market-tycoon/events'
import { StoreSimulation } from '@market-tycoon/simulation-engine'
import type Phaser from 'phaser'
import { StoreScene } from '../phaser/StoreScene'

export const PROMOTIONS_STORAGE_KEY = 'market-tycoon.promotions.v1'
export const PROMOTION_ANALYTICS_STORAGE_KEY = 'market-tycoon.promotion-analytics.v1'

let installed = false
let analyticsPersistTimer: number | undefined
let activeSimulation: StoreSimulation | undefined
const simulationDays = new WeakMap<StoreSimulation, number>()
const promotionLabels = new WeakMap<StoreScene, Phaser.GameObjects.Text[]>()

export function installPromotions() {
  if (installed) return
  installed = true
  restorePromotions()
  restorePromotionAnalytics()

  const originalSetCurrentDay = StoreSimulation.prototype.setCurrentDay
  StoreSimulation.prototype.setCurrentDay = function setCurrentDayWithPromotions(day: number) {
    activeSimulation = this
    simulationDays.set(this, Math.max(1, Math.floor(day)))
    return originalSetCurrentDay.call(this, day)
  }

  const originalTakeItems = StoreSimulation.prototype.takeItems
  StoreSimulation.prototype.takeItems = function takePromotionalItems(shelfId, compartmentId, requestedQuantity, context = {}) {
    const compartment = this.getCompartment(shelfId, compartmentId)
    const product = compartment?.productKey ? getProductDefinition(compartment.productKey) : undefined
    if (!product) return originalTakeItems.call(this, shelfId, compartmentId, requestedQuantity, context)

    const day = context.day ?? simulationDays.get(this) ?? 1
    const activePromotion = promotionManager.getActivePromotion(product.key, day)
    if (!activePromotion) return originalTakeItems.call(this, shelfId, compartmentId, requestedQuantity, context)

    const promotedRequestedQuantity = applyVisibilityBoost(activePromotion, requestedQuantity)
    const quotedPrice = promotionManager.getPrice(product, day, promotedRequestedQuantity)
    const regularPrice = product.salePrice
    product.salePrice = quotedPrice.effectivePrice
    try {
      const line = originalTakeItems.call(this, shelfId, compartmentId, promotedRequestedQuantity, context)
      const actualPrice = line ? promotionManager.getPrice({ ...product, salePrice: regularPrice }, day, line.quantity) : quotedPrice
      window.dispatchEvent(new CustomEvent('market-tycoon:promotion-reaction', {
        detail: {
          customerId: context.customerId ?? 'Client',
          productName: product.name,
          promotionLabel: `${actualPrice.label} · ${promotionManager.getChannelLabel(activePromotion.channel)}`,
          accepted: Boolean(line),
          message: line ? positiveReaction(actualPrice.label) : hesitantReaction(actualPrice.label),
        },
      }))
      if (!line) return null
      return {
        ...line,
        product: { ...line.product, salePrice: actualPrice.effectivePrice },
        promotionId: activePromotion.id,
        regularUnitPrice: actualPrice.regularPrice,
        promotionLabel: actualPrice.label,
        promotionChannel: activePromotion.channel,
      }
    } finally {
      product.salePrice = regularPrice
    }
  }

  const originalDrawBuildings = StoreScene.prototype.drawBuildings
  StoreScene.prototype.drawBuildings = function drawBuildingsWithPromotions() {
    promotionLabels.get(this)?.forEach(label => label.destroy())
    promotionLabels.set(this, [])
    originalDrawBuildings.call(this)
    const labels: Phaser.GameObjects.Text[] = []
    const day = this.day
    for (const shelf of this.grid.getBuildings('shelf')) {
      if (!isShelfDefinition(shelf.definition)) continue
      const inventory = this.simulation.getEquipmentInventory(shelf.id)
      const active = uniquePromotions((inventory?.compartments ?? [])
        .map(slot => slot.productKey ? promotionManager.getActivePromotion(slot.productKey, day) : undefined)
        .filter((promotion): promotion is ProductPromotion => Boolean(promotion)))
      if (!active.length) continue
      const point = this.grid.gridToScreen(shelf.gridX, shelf.gridY)
      const text = active.slice(0, 2).map(promotion => {
        const prefix = promotion.channel === 'endcap' ? '⭐' : promotion.channel === 'flyer' ? '📰' : promotion.channel === 'coupon' ? '🎟' : '🏷'
        return `${prefix} ${promotionManager.getLabel(promotion)}`
      }).join(' · ')
      labels.push(this.add.text(point.x, point.y - 72, `PROMO ${text}`, {
        fontSize: '10px', fontStyle: 'bold', color: '#fff7ed', backgroundColor: '#dc2626ee', padding: { x: 5, y: 3 },
      }).setOrigin(.5).setDepth(90))
    }
    promotionLabels.set(this, labels)
  }

  gameEvents.on('product:purchase-decision', event => {
    const promotion = promotionManager.getActivePromotion(event.productKey, event.day)
    promotionAnalytics.recordDecision({
      day: event.day,
      productKey: event.productKey,
      promotionId: promotion?.id,
      requestedQuantity: event.requestedQuantity,
      acceptedQuantity: event.acceptedQuantity,
    })
    scheduleAnalyticsPersistence()
  })

  gameEvents.on('product:sold', event => {
    const promotion = promotionManager.getActivePromotion(event.productKey, event.day)
    promotionAnalytics.recordSale({
      day: event.day,
      productKey: event.productKey,
      promotionId: promotion?.id,
      quantity: event.quantity,
      unitSalePrice: event.unitSalePrice,
      unitCost: event.unitCost,
    })
    scheduleAnalyticsPersistence()
  })

  window.addEventListener('beforeunload', persistPromotions)
  window.addEventListener('beforeunload', persistPromotionAnalytics)
}

/**
 * Débite immédiatement le coût d'une campagne sur la trésorerie et l'impute
 * aux charges d'exploitation de la journée courante.
 */
export function chargePromotionCampaign(cost: number) {
  const simulation = activeSimulation
  const amount = roundMoney(cost)
  if (!simulation || amount < 0 || simulation.metrics.cash < amount) return false
  simulation.metrics.cash = roundMoney(simulation.metrics.cash - amount)
  simulation.metrics.operatingExpenses = roundMoney(simulation.metrics.operatingExpenses + amount)
  simulation.metrics.profit = roundMoney(
    simulation.metrics.revenue
      - simulation.metrics.constructionExpenses
      - simulation.metrics.merchandiseExpenses
      - simulation.metrics.operatingExpenses,
  )
  return true
}

export function getPromotionBudget() {
  return activeSimulation?.metrics.cash ?? 0
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

export function persistPromotionAnalytics() {
  localStorage.setItem(PROMOTION_ANALYTICS_STORAGE_KEY, JSON.stringify(promotionAnalytics.exportState()))
}

export function restorePromotionAnalytics() {
  try {
    const raw = localStorage.getItem(PROMOTION_ANALYTICS_STORAGE_KEY)
    promotionAnalytics.importState(raw ? JSON.parse(raw) as PromotionAnalyticsState : undefined)
  } catch {
    promotionAnalytics.importState()
  }
}

function scheduleAnalyticsPersistence() {
  if (analyticsPersistTimer) window.clearTimeout(analyticsPersistTimer)
  analyticsPersistTimer = window.setTimeout(persistPromotionAnalytics, 150)
}

function applyVisibilityBoost(promotion: ProductPromotion, requestedQuantity: number) {
  const quantity = Math.max(1, Math.floor(requestedQuantity))
  if (promotion.channel === 'endcap') return quantity + 1
  if (promotion.channel === 'flyer' && Math.random() < .35) return quantity + 1
  if (promotion.channel === 'coupon' && Math.random() < .18) return quantity + 1
  return quantity
}

function uniquePromotions(promotions: ProductPromotion[]) {
  return promotions.filter((promotion, index, items) => items.findIndex(item => item.id === promotion.id) === index)
}

function positiveReaction(label?: string) {
  const choices = [`Bonne affaire${label ? ` (${label})` : ''} !`, 'Ce prix vaut le coup.', 'J’en profite !']
  return choices[Math.floor(Math.random() * choices.length)]
}

function hesitantReaction(label?: string) {
  const choices = [`Même avec ${label ?? 'la promo'}, je réfléchis…`, 'Pas aujourd’hui.', 'Le prix reste trop élevé pour moi.']
  return choices[Math.floor(Math.random() * choices.length)]
}

function roundMoney(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}
