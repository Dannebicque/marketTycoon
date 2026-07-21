import { PRODUCTS, getProductDefinition, getProductsForCategories } from './catalog/products'
import { SUPPLIERS } from './catalog/suppliers'
import type { CheckoutDefinition, PaymentMethod, ProductDefinition, ShelfDefinition, StorageType } from './definitions'
import { isCheckoutDefinition, isShelfDefinition, isStorageDefinition } from './definitions'
import {
  createEquipmentInventory,
  getProductCapacity,
  isProductCompatible,
  type EquipmentCompartmentState,
  type EquipmentInventoryState,
} from './equipment/EquipmentInventory'
import type { PlacedBuilding } from './GridManager'
import { PurchaseOrderManager } from './logistics/PurchaseOrderManager'
import { ReserveManager } from './logistics/ReserveManager'

export type { PaymentMethod, ProductDefinition } from './definitions'

export interface ShoppingPlanItem {
  shelf: PlacedBuilding
  compartmentId: string
  requestedQuantity: number
}

export interface BasketLine {
  shelfId: string
  compartmentId: string
  product: ProductDefinition
  quantity: number
}

export interface BasketSummary {
  lines: BasketLine[]
  articleCount: number
  saleTotal: number
  purchaseTotal: number
}

export interface StoreMetrics {
  cash: number
  revenue: number
  profit: number
  constructionExpenses: number
  merchandiseExpenses: number
  operatingExpenses: number
  servedCustomers: number
  lostCustomers: number
  satisfactionTotal: number
  satisfactionSamples: number
  totalQueueTimeMs: number
  articlesSold: number
  contactlessPayments: number
  cardPayments: number
  cashPayments: number
  checkoutIncidents: number
}

export interface DaySnapshot {
  day: number
  revenue: number
  constructionExpenses: number
  merchandiseExpenses: number
  operatingExpenses: number
  profit: number
  servedCustomers: number
  lostCustomers: number
  articlesSold: number
  averageSatisfaction: number
  averageQueueSeconds: number
}

export interface CheckoutTiming { durationMs: number; incident: boolean }
export const INITIAL_BUDGET = 2_000

export class StoreSimulation {
  private inventories = new Map<string, EquipmentInventoryState>()
  private shelfDefinitions = new Map<string, ShelfDefinition>()
  private checkoutQueues = new Map<string, string[]>()
  private checkoutBusy = new Set<string>()
  private buildings: PlacedBuilding[] = []
  private dayStart?: StoreMetrics

  readonly reserve = new ReserveManager()
  readonly purchaseOrders = new PurchaseOrderManager()

  readonly metrics: StoreMetrics = {
    cash: INITIAL_BUDGET, revenue: 0, profit: 0, constructionExpenses: 0,
    merchandiseExpenses: 0, operatingExpenses: 0, servedCustomers: 0,
    lostCustomers: 0, satisfactionTotal: 0, satisfactionSamples: 0,
    totalQueueTimeMs: 0, articlesSold: 0, contactlessPayments: 0,
    cardPayments: 0, cashPayments: 0, checkoutIncidents: 0,
  }

  syncBuildings(buildings: PlacedBuilding[]) {
    this.buildings = buildings
    const shelves = buildings.filter(item => isShelfDefinition(item.definition))
    const checkouts = buildings.filter(item => isCheckoutDefinition(item.definition))
    const shelfIds = new Set(shelves.map(item => item.id))
    const checkoutIds = new Set(checkouts.map(item => item.id))

    for (const id of this.inventories.keys()) if (!shelfIds.has(id)) this.inventories.delete(id)
    for (const id of this.shelfDefinitions.keys()) if (!shelfIds.has(id)) this.shelfDefinitions.delete(id)
    for (const id of this.checkoutQueues.keys()) if (!checkoutIds.has(id)) this.checkoutQueues.delete(id)

    for (const shelf of shelves) {
      const definition = shelf.definition as ShelfDefinition
      this.shelfDefinitions.set(shelf.id, definition)
      if (!this.inventories.has(shelf.id)) this.inventories.set(shelf.id, createEquipmentInventory(shelf.id, definition))
    }

    for (const checkout of checkouts) {
      if (!this.checkoutQueues.has(checkout.id)) this.checkoutQueues.set(checkout.id, [])
    }
  }

  startDay() { this.dayStart = { ...this.metrics } }

  closeDay(day: number, buildings: PlacedBuilding[] = []): DaySnapshot {
    this.applyDailyOperatingCosts(buildings)
    const start = this.dayStart ?? this.emptySnapshotStart()
    const served = this.metrics.servedCustomers - start.servedCustomers
    const samples = this.metrics.satisfactionSamples - start.satisfactionSamples
    return {
      day,
      revenue: this.metrics.revenue - start.revenue,
      constructionExpenses: this.metrics.constructionExpenses - start.constructionExpenses,
      merchandiseExpenses: this.metrics.merchandiseExpenses - start.merchandiseExpenses,
      operatingExpenses: this.metrics.operatingExpenses - start.operatingExpenses,
      profit: this.getDayProfit(),
      servedCustomers: served,
      lostCustomers: this.metrics.lostCustomers - start.lostCustomers,
      articlesSold: this.metrics.articlesSold - start.articlesSold,
      averageSatisfaction: samples > 0 ? (this.metrics.satisfactionTotal - start.satisfactionTotal) / samples : 100,
      averageQueueSeconds: served > 0 ? (this.metrics.totalQueueTimeMs - start.totalQueueTimeMs) / served / 1000 : 0,
    }
  }

  canSpend(amount: number) { return this.metrics.cash >= amount }
  spend(amount: number) {
    if (!this.canSpend(amount)) return false
    this.metrics.cash -= amount
    this.metrics.constructionExpenses += amount
    this.recalculateProfit()
    return true
  }
  refund(amount: number) {
    this.metrics.cash += amount
    this.metrics.constructionExpenses = Math.max(0, this.metrics.constructionExpenses - amount)
    this.recalculateProfit()
  }

  getCompatibleProducts(buildingId: string) {
    const definition = this.shelfDefinitions.get(buildingId)
    if (!definition) return []
    return getProductsForCategories(definition.allowedProductCategories).filter(product => isProductCompatible(definition, product))
  }

  assignProductToCompartment(buildingId: string, compartmentId: string, productKey: string | null) {
    const inventory = this.inventories.get(buildingId)
    const definition = this.shelfDefinitions.get(buildingId)
    const compartment = inventory?.compartments.find(item => item.id === compartmentId)
    if (!inventory || !definition || !compartment) return false

    if (compartment.productKey && compartment.quantity > 0) {
      this.reserve.add(compartment.productKey, compartment.quantity, this.buildings)
    }

    if (productKey === null) {
      compartment.productKey = null
      compartment.quantity = 0
      compartment.capacity = 0
      return true
    }

    const product = getProductDefinition(productKey)
    if (!product || !isProductCompatible(definition, product)) return false
    compartment.productKey = product.key
    compartment.capacity = getProductCapacity(definition, product)
    compartment.quantity = 0
    return true
  }

  restockCompartment(buildingId: string, compartmentId: string) {
    const compartment = this.getCompartment(buildingId, compartmentId)
    if (!compartment?.productKey) return false
    const missing = compartment.capacity - compartment.quantity
    const moved = this.reserve.withdraw(compartment.productKey, missing)
    compartment.quantity += moved
    return moved > 0
  }

  restockEquipment(buildingId: string) {
    const inventory = this.inventories.get(buildingId)
    if (!inventory) return false
    let moved = 0
    for (const compartment of inventory.compartments) {
      if (!compartment.productKey) continue
      const quantity = this.reserve.withdraw(compartment.productKey, compartment.capacity - compartment.quantity)
      compartment.quantity += quantity
      moved += quantity
    }
    return moved > 0
  }

  restockAll() {
    let moved = 0
    for (const inventory of this.inventories.values()) {
      for (const compartment of inventory.compartments) {
        if (!compartment.productKey) continue
        const quantity = this.reserve.withdraw(compartment.productKey, compartment.capacity - compartment.quantity)
        compartment.quantity += quantity
        moved += quantity
      }
    }
    return moved > 0
  }

  createPurchaseOrder(supplierKey: string, lines: Array<{ productKey: string; quantity: number }>, day: number) {
    const order = this.purchaseOrders.createOrder(supplierKey, lines, day)
    if (!order || !this.canSpend(order.orderedTotal)) {
      if (order) this.purchaseOrders.cancel(order.id)
      return null
    }
    this.metrics.cash -= order.orderedTotal
    this.metrics.merchandiseExpenses += order.orderedTotal
    this.recalculateProfit()
    return order
  }

  processDeliveries(day: number) {
    this.purchaseOrders.process(day, this.buildings, this.reserve)
  }

  getSuppliers() { return SUPPLIERS }
  getPurchaseOrders() { return this.purchaseOrders.getOrders() }
  getReserveLines() { return this.reserve.getLines() }
  getReserveQuantity(productKey: string) { return this.reserve.getQuantity(productKey) }
  getStorageCapacity(type: StorageType) { return this.reserve.getCapacity(this.buildings, type) }
  getStorageUsed(type: StorageType) { return this.reserve.getUsed(type) }
  getStorageFree(type: StorageType) { return this.reserve.getFree(this.buildings, type) }
  hasStorage(type: StorageType) { return this.getStorageCapacity(type) > 0 }

  getAvailableShelves(buildings: PlacedBuilding[]) {
    return buildings.filter(building => isShelfDefinition(building.definition) && Boolean(this.inventories.get(building.id)?.compartments.some(slot => slot.productKey && slot.quantity > 0)))
  }

  createShoppingPlan(buildings: PlacedBuilding[]): ShoppingPlanItem[] {
    const available = buildings.flatMap(shelf => {
      if (!isShelfDefinition(shelf.definition)) return []
      const inventory = this.inventories.get(shelf.id)
      return (inventory?.compartments ?? []).filter(slot => slot.productKey && slot.quantity > 0).map(slot => ({ shelf, compartmentId: slot.id }))
    }).sort(() => Math.random() - .5)
    const count = Math.min(available.length, randomBetween(1, 3))
    return available.slice(0, count).map(item => ({ ...item, requestedQuantity: randomBetween(1, 3) }))
  }

  takeItems(shelfId: string, compartmentId: string, requestedQuantity: number): BasketLine | null {
    const compartment = this.getCompartment(shelfId, compartmentId)
    if (!compartment?.productKey || compartment.quantity <= 0) return null
    const product = getProductDefinition(compartment.productKey)
    if (!product) return null
    const quantity = Math.min(requestedQuantity, compartment.quantity)
    compartment.quantity -= quantity
    return { shelfId, compartmentId, product, quantity }
  }

  summarizeBasket(lines: BasketLine[]): BasketSummary {
    return {
      lines,
      articleCount: lines.reduce((total, line) => total + line.quantity, 0),
      saleTotal: lines.reduce((total, line) => total + line.quantity * line.product.salePrice, 0),
      purchaseTotal: lines.reduce((total, line) => total + line.quantity * line.product.purchasePrice, 0),
    }
  }

  choosePaymentMethod(accepted?: PaymentMethod[]): PaymentMethod {
    const available: PaymentMethod[] = accepted?.length ? accepted : ['contactless', 'card', 'cash']
    const roll = Math.random()
    const preferred: PaymentMethod = roll < .5 ? 'contactless' : roll < .85 ? 'card' : 'cash'
    return available.includes(preferred) ? preferred : available[Math.floor(Math.random() * available.length)]
  }

  chooseCheckout(checkouts: PlacedBuilding[], basket?: BasketSummary, payment?: PaymentMethod) {
    return checkouts.filter(checkout => {
      if (!isCheckoutDefinition(checkout.definition)) return false
      if (basket && checkout.definition.maxBasketSize !== undefined && basket.articleCount > checkout.definition.maxBasketSize) return false
      return !payment || checkout.definition.acceptedPayments.includes(payment)
    }).sort((a, b) => this.queueLength(a.id) - this.queueLength(b.id))[0]
  }

  getCheckoutTiming(checkout: PlacedBuilding, articleCount: number, payment: PaymentMethod): CheckoutTiming {
    if (!isCheckoutDefinition(checkout.definition)) return { durationMs: 0, incident: false }
    const definition: CheckoutDefinition = checkout.definition
    const paymentTime = payment === 'contactless' ? 900 : payment === 'card' ? 1_900 : 3_200
    const incident = Boolean(definition.breakdownChance && Math.random() < definition.breakdownChance)
    if (incident) this.metrics.checkoutIncidents += 1
    return { durationMs: definition.baseCheckoutTimeMs + articleCount * definition.scanTimePerArticleMs + paymentTime + (incident ? 4_000 : 0), incident }
  }

  getPickupTimeMs(shelf: PlacedBuilding) { return isShelfDefinition(shelf.definition) ? shelf.definition.customerPickupTimeMs : 650 }
  enqueue(checkoutId: string, customerId: string) {
    const queue = this.checkoutQueues.get(checkoutId) ?? []
    if (!queue.includes(customerId)) queue.push(customerId)
    this.checkoutQueues.set(checkoutId, queue)
    return queue.indexOf(customerId)
  }
  isFirst(checkoutId: string, customerId: string) { return this.checkoutQueues.get(checkoutId)?.[0] === customerId && !this.checkoutBusy.has(checkoutId) }
  startCheckout(checkoutId: string) { this.checkoutBusy.add(checkoutId) }
  isCheckoutBusy(checkoutId: string) { return this.checkoutBusy.has(checkoutId) }

  finishCheckout(checkoutId: string, customerId: string, basket: BasketSummary, payment: PaymentMethod, queueTimeMs: number, satisfaction: number) {
    const queue = this.checkoutQueues.get(checkoutId) ?? []
    const index = queue.indexOf(customerId)
    if (index >= 0) queue.splice(index, 1)
    this.checkoutBusy.delete(checkoutId)
    this.metrics.cash += basket.saleTotal
    this.metrics.revenue += basket.saleTotal
    this.metrics.servedCustomers += 1
    this.metrics.articlesSold += basket.articleCount
    this.metrics.totalQueueTimeMs += queueTimeMs
    this.metrics.satisfactionTotal += satisfaction
    this.metrics.satisfactionSamples += 1
    if (payment === 'contactless') this.metrics.contactlessPayments += 1
    if (payment === 'card') this.metrics.cardPayments += 1
    if (payment === 'cash') this.metrics.cashPayments += 1
    this.recalculateProfit()
  }

  abandon(checkoutId: string | undefined, customerId: string, satisfaction = 0) {
    if (checkoutId) {
      const queue = this.checkoutQueues.get(checkoutId) ?? []
      const index = queue.indexOf(customerId)
      if (index >= 0) queue.splice(index, 1)
      this.checkoutBusy.delete(checkoutId)
    }
    this.metrics.lostCustomers += 1
    this.metrics.satisfactionTotal += satisfaction
    this.metrics.satisfactionSamples += 1
  }

  queueLength(checkoutId: string) { return this.checkoutQueues.get(checkoutId)?.length ?? 0 }
  queuePosition(checkoutId: string, customerId: string) { return this.checkoutQueues.get(checkoutId)?.indexOf(customerId) ?? -1 }
  getQueue(checkoutId: string) { return [...(this.checkoutQueues.get(checkoutId) ?? [])] }
  getCompartment(buildingId: string, compartmentId: string) { return this.inventories.get(buildingId)?.compartments.find(item => item.id === compartmentId) }
  getEquipmentInventory(buildingId: string) { return this.inventories.get(buildingId) }
  getEquipmentInventories() { return [...this.inventories.values()] }
  getTotalShelfStock() { return [...this.inventories.values()].flatMap(item => item.compartments).reduce((total, slot) => total + slot.quantity, 0) }
  getTotalReserveStock() { return this.reserve.getLines().reduce((total, line) => total + line.quantity, 0) }
  getTotalStock() { return this.getTotalShelfStock() + this.getTotalReserveStock() }
  getProducts() { return PRODUCTS }

  getDayRevenue() { return this.metrics.revenue - (this.dayStart?.revenue ?? 0) }
  getDayConstructionExpenses() { return this.metrics.constructionExpenses - (this.dayStart?.constructionExpenses ?? 0) }
  getDayMerchandiseExpenses() { return this.metrics.merchandiseExpenses - (this.dayStart?.merchandiseExpenses ?? 0) }
  getDayOperatingExpenses() { return this.metrics.operatingExpenses - (this.dayStart?.operatingExpenses ?? 0) }
  getDayProfit() { return this.getDayRevenue() - this.getDayConstructionExpenses() - this.getDayMerchandiseExpenses() - this.getDayOperatingExpenses() }
  getAverageSatisfaction() { return this.metrics.satisfactionSamples ? this.metrics.satisfactionTotal / this.metrics.satisfactionSamples : 100 }
  getAverageQueueSeconds() { return this.metrics.servedCustomers ? this.metrics.totalQueueTimeMs / this.metrics.servedCustomers / 1000 : 0 }

  private applyDailyOperatingCosts(buildings: PlacedBuilding[]) {
    const cost = buildings.reduce((total, building) => {
      if (isShelfDefinition(building.definition) || isStorageDefinition(building.definition)) return total + (building.definition.electricityCostPerDay ?? 0)
      return total
    }, 0)
    if (cost <= 0 || !this.canSpend(cost)) return
    this.metrics.cash -= cost
    this.metrics.operatingExpenses += cost
    this.recalculateProfit()
  }

  private recalculateProfit() { this.metrics.profit = this.metrics.revenue - this.metrics.constructionExpenses - this.metrics.merchandiseExpenses - this.metrics.operatingExpenses }
  private emptySnapshotStart(): StoreMetrics {
    return { cash: this.metrics.cash, revenue: 0, profit: 0, constructionExpenses: 0, merchandiseExpenses: 0, operatingExpenses: 0, servedCustomers: 0, lostCustomers: 0, satisfactionTotal: 0, satisfactionSamples: 0, totalQueueTimeMs: 0, articlesSold: 0, contactlessPayments: 0, cardPayments: 0, cashPayments: 0, checkoutIncidents: 0 }
  }
}

function randomBetween(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }
