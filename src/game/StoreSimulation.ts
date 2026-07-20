import type { PlacedBuilding } from './GridManager'

export type PaymentMethod = 'contactless' | 'card' | 'cash'

export interface ProductDefinition {
  key: string
  name: string
  shortName: string
  salePrice: number
  purchasePrice: number
  color: number
}

export interface ShelfState {
  buildingId: string
  product: ProductDefinition
  stock: number
  capacity: number
}

export interface BasketLine {
  shelfId: string
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
  servedCustomers: number
  lostCustomers: number
  satisfactionTotal: number
  satisfactionSamples: number
  totalQueueTimeMs: number
  articlesSold: number
  contactlessPayments: number
  cardPayments: number
  cashPayments: number
}

export interface DaySnapshot {
  day: number
  revenue: number
  constructionExpenses: number
  merchandiseExpenses: number
  profit: number
  servedCustomers: number
  lostCustomers: number
  articlesSold: number
  averageSatisfaction: number
  averageQueueSeconds: number
}

export const INITIAL_BUDGET = 2_000

const PRODUCTS: ProductDefinition[] = [
  { key: 'grocery', name: 'Épicerie', shortName: 'ÉPIC', salePrice: 6, purchasePrice: 3, color: 0xb07a4f },
  { key: 'fresh', name: 'Produits frais', shortName: 'FRAIS', salePrice: 9, purchasePrice: 5, color: 0x22c55e },
  { key: 'drinks', name: 'Boissons', shortName: 'BOIS', salePrice: 4, purchasePrice: 2, color: 0x38bdf8 },
  { key: 'hygiene', name: 'Hygiène', shortName: 'HYGI', salePrice: 12, purchasePrice: 7, color: 0xa855f7 },
]

export class StoreSimulation {
  private shelves = new Map<string, ShelfState>()
  private checkoutQueues = new Map<string, string[]>()
  private checkoutBusy = new Set<string>()
  private dayStart?: StoreMetrics

  readonly metrics: StoreMetrics = {
    cash: INITIAL_BUDGET,
    revenue: 0,
    profit: 0,
    constructionExpenses: 0,
    merchandiseExpenses: 0,
    servedCustomers: 0,
    lostCustomers: 0,
    satisfactionTotal: 0,
    satisfactionSamples: 0,
    totalQueueTimeMs: 0,
    articlesSold: 0,
    contactlessPayments: 0,
    cardPayments: 0,
    cashPayments: 0,
  }

  syncBuildings(buildings: PlacedBuilding[]) {
    const shelves = buildings.filter(item => item.definition.type === 'shelf')
    const checkouts = buildings.filter(item => item.definition.type === 'checkout')
    const shelfIds = new Set(shelves.map(item => item.id))
    const checkoutIds = new Set(checkouts.map(item => item.id))

    for (const id of this.shelves.keys()) if (!shelfIds.has(id)) this.shelves.delete(id)
    for (const id of this.checkoutQueues.keys()) if (!checkoutIds.has(id)) this.checkoutQueues.delete(id)

    shelves.forEach((shelf, index) => {
      if (!this.shelves.has(shelf.id)) {
        this.shelves.set(shelf.id, {
          buildingId: shelf.id,
          product: PRODUCTS[index % PRODUCTS.length],
          stock: 24,
          capacity: 24,
        })
      }
    })

    for (const checkout of checkouts) {
      if (!this.checkoutQueues.has(checkout.id)) this.checkoutQueues.set(checkout.id, [])
    }
  }

  startDay() { this.dayStart = { ...this.metrics } }

  closeDay(day: number): DaySnapshot {
    const start = this.dayStart ?? this.emptySnapshotStart()
    const served = this.metrics.servedCustomers - start.servedCustomers
    const samples = this.metrics.satisfactionSamples - start.satisfactionSamples
    return {
      day,
      revenue: this.metrics.revenue - start.revenue,
      constructionExpenses: this.metrics.constructionExpenses - start.constructionExpenses,
      merchandiseExpenses: this.metrics.merchandiseExpenses - start.merchandiseExpenses,
      profit: this.getDayProfit(),
      servedCustomers: served,
      lostCustomers: this.metrics.lostCustomers - start.lostCustomers,
      articlesSold: this.metrics.articlesSold - start.articlesSold,
      averageSatisfaction: samples > 0
        ? (this.metrics.satisfactionTotal - start.satisfactionTotal) / samples
        : 100,
      averageQueueSeconds: served > 0
        ? (this.metrics.totalQueueTimeMs - start.totalQueueTimeMs) / served / 1000
        : 0,
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

  getAvailableShelves(buildings: PlacedBuilding[]) {
    return buildings.filter(building => {
      const state = this.shelves.get(building.id)
      return building.definition.type === 'shelf' && state && state.stock > 0
    })
  }

  createShoppingPlan(buildings: PlacedBuilding[]) {
    const available = this.getAvailableShelves(buildings)
    const shuffled = [...available].sort(() => Math.random() - .5)
    const shelfCount = Math.min(shuffled.length, PhaserMathBetween(1, 3))
    return shuffled.slice(0, shelfCount).map(shelf => ({ shelf, requestedQuantity: PhaserMathBetween(1, 3) }))
  }

  takeItems(shelfId: string, requestedQuantity: number): BasketLine | null {
    const shelf = this.shelves.get(shelfId)
    if (!shelf || shelf.stock <= 0) return null
    const quantity = Math.min(requestedQuantity, shelf.stock)
    shelf.stock -= quantity
    return { shelfId, product: shelf.product, quantity }
  }

  summarizeBasket(lines: BasketLine[]): BasketSummary {
    return {
      lines,
      articleCount: lines.reduce((total, line) => total + line.quantity, 0),
      saleTotal: lines.reduce((total, line) => total + line.quantity * line.product.salePrice, 0),
      purchaseTotal: lines.reduce((total, line) => total + line.quantity * line.product.purchasePrice, 0),
    }
  }

  choosePaymentMethod(): PaymentMethod {
    const roll = Math.random()
    if (roll < .5) return 'contactless'
    if (roll < .85) return 'card'
    return 'cash'
  }

  getCheckoutDurationMs(articleCount: number, payment: PaymentMethod) {
    const scanTime = 1_200 + articleCount * 550
    const paymentTime = payment === 'contactless' ? 900 : payment === 'card' ? 1_900 : 3_200
    return scanTime + paymentTime
  }

  restockAll() {
    let cost = 0
    for (const shelf of this.shelves.values()) cost += (shelf.capacity - shelf.stock) * shelf.product.purchasePrice
    if (!this.canSpend(cost)) return false
    this.metrics.cash -= cost
    this.metrics.merchandiseExpenses += cost
    for (const shelf of this.shelves.values()) shelf.stock = shelf.capacity
    this.recalculateProfit()
    return true
  }

  chooseCheckout(checkouts: PlacedBuilding[]) {
    return [...checkouts].sort((a, b) => this.queueLength(a.id) - this.queueLength(b.id))[0]
  }

  enqueue(checkoutId: string, customerId: string) {
    const queue = this.checkoutQueues.get(checkoutId) ?? []
    if (!queue.includes(customerId)) queue.push(customerId)
    this.checkoutQueues.set(checkoutId, queue)
    return queue.indexOf(customerId)
  }

  isFirst(checkoutId: string, customerId: string) {
    return this.checkoutQueues.get(checkoutId)?.[0] === customerId && !this.checkoutBusy.has(checkoutId)
  }

  startCheckout(checkoutId: string) { this.checkoutBusy.add(checkoutId) }

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
    }
    this.metrics.lostCustomers += 1
    this.metrics.satisfactionTotal += satisfaction
    this.metrics.satisfactionSamples += 1
  }

  queueLength(checkoutId: string) { return this.checkoutQueues.get(checkoutId)?.length ?? 0 }
  queuePosition(checkoutId: string, customerId: string) { return this.checkoutQueues.get(checkoutId)?.indexOf(customerId) ?? -1 }
  getQueue(checkoutId: string) { return [...(this.checkoutQueues.get(checkoutId) ?? [])] }
  getTotalStock() { return [...this.shelves.values()].reduce((total, shelf) => total + shelf.stock, 0) }
  getShelfState(buildingId: string) { return this.shelves.get(buildingId) }
  getShelfStates() { return [...this.shelves.values()].map(shelf => ({ ...shelf, product: { ...shelf.product } })) }
  getProducts() { return PRODUCTS }

  getDayRevenue() { return this.metrics.revenue - (this.dayStart?.revenue ?? 0) }
  getDayConstructionExpenses() { return this.metrics.constructionExpenses - (this.dayStart?.constructionExpenses ?? 0) }
  getDayMerchandiseExpenses() { return this.metrics.merchandiseExpenses - (this.dayStart?.merchandiseExpenses ?? 0) }
  getDayProfit() { return this.getDayRevenue() - this.getDayConstructionExpenses() - this.getDayMerchandiseExpenses() }

  getAverageSatisfaction() {
    return this.metrics.satisfactionSamples ? this.metrics.satisfactionTotal / this.metrics.satisfactionSamples : 100
  }

  getAverageQueueSeconds() {
    return this.metrics.servedCustomers ? this.metrics.totalQueueTimeMs / this.metrics.servedCustomers / 1000 : 0
  }

  private recalculateProfit() {
    this.metrics.profit = this.metrics.revenue - this.metrics.constructionExpenses - this.metrics.merchandiseExpenses
  }

  private emptySnapshotStart(): StoreMetrics {
    return {
      cash: this.metrics.cash,
      revenue: 0,
      profit: 0,
      constructionExpenses: 0,
      merchandiseExpenses: 0,
      servedCustomers: 0,
      lostCustomers: 0,
      satisfactionTotal: 0,
      satisfactionSamples: 0,
      totalQueueTimeMs: 0,
      articlesSold: 0,
      contactlessPayments: 0,
      cardPayments: 0,
      cashPayments: 0,
    }
  }
}

function PhaserMathBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
