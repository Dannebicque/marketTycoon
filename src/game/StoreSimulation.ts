import type { PlacedBuilding } from './GridManager'

export interface ShelfState {
  buildingId: string
  product: string
  stock: number
  capacity: number
  salePrice: number
  purchasePrice: number
}

export interface StoreMetrics {
  cash: number
  revenue: number
  profit: number
  servedCustomers: number
  lostCustomers: number
  satisfactionTotal: number
  satisfactionSamples: number
  totalQueueTimeMs: number
}

export class StoreSimulation {
  private shelves = new Map<string, ShelfState>()
  private checkoutQueues = new Map<string, string[]>()
  private checkoutBusy = new Set<string>()

  readonly metrics: StoreMetrics = {
    cash: 2_000,
    revenue: 0,
    profit: 0,
    servedCustomers: 0,
    lostCustomers: 0,
    satisfactionTotal: 0,
    satisfactionSamples: 0,
    totalQueueTimeMs: 0,
  }

  syncBuildings(buildings: PlacedBuilding[]) {
    const shelfIds = new Set(buildings.filter(item => item.definition.type === 'shelf').map(item => item.id))
    const checkoutIds = new Set(buildings.filter(item => item.definition.type === 'checkout').map(item => item.id))

    for (const id of this.shelves.keys()) if (!shelfIds.has(id)) this.shelves.delete(id)
    for (const id of this.checkoutQueues.keys()) if (!checkoutIds.has(id)) this.checkoutQueues.delete(id)

    for (const shelf of buildings.filter(item => item.definition.type === 'shelf')) {
      if (!this.shelves.has(shelf.id)) {
        this.shelves.set(shelf.id, {
          buildingId: shelf.id,
          product: 'Produit courant',
          stock: 12,
          capacity: 12,
          salePrice: 8,
          purchasePrice: 4,
        })
      }
    }

    for (const checkout of buildings.filter(item => item.definition.type === 'checkout')) {
      if (!this.checkoutQueues.has(checkout.id)) this.checkoutQueues.set(checkout.id, [])
    }
  }

  canSpend(amount: number) { return this.metrics.cash >= amount }

  spend(amount: number) {
    if (!this.canSpend(amount)) return false
    this.metrics.cash -= amount
    this.metrics.profit -= amount
    return true
  }

  refund(amount: number) {
    this.metrics.cash += amount
    this.metrics.profit += amount
  }

  getAvailableShelf(buildings: PlacedBuilding[]) {
    return buildings.find(building => {
      const state = this.shelves.get(building.id)
      return building.definition.type === 'shelf' && state && state.stock > 0
    })
  }

  takeProduct(shelfId: string) {
    const shelf = this.shelves.get(shelfId)
    if (!shelf || shelf.stock <= 0) return null
    shelf.stock -= 1
    return { salePrice: shelf.salePrice, purchasePrice: shelf.purchasePrice, product: shelf.product }
  }

  restockAll() {
    let cost = 0
    for (const shelf of this.shelves.values()) cost += (shelf.capacity - shelf.stock) * shelf.purchasePrice
    if (!this.spend(cost)) return false
    for (const shelf of this.shelves.values()) shelf.stock = shelf.capacity
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

  finishCheckout(
    checkoutId: string,
    customerId: string,
    salePrice: number,
    purchasePrice: number,
    queueTimeMs: number,
    satisfaction: number,
  ) {
    const queue = this.checkoutQueues.get(checkoutId) ?? []
    const index = queue.indexOf(customerId)
    if (index >= 0) queue.splice(index, 1)
    this.checkoutBusy.delete(checkoutId)
    this.metrics.cash += salePrice
    this.metrics.revenue += salePrice
    this.metrics.profit += salePrice - purchasePrice
    this.metrics.servedCustomers += 1
    this.metrics.totalQueueTimeMs += queueTimeMs
    this.metrics.satisfactionTotal += satisfaction
    this.metrics.satisfactionSamples += 1
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

  getTotalStock() {
    return [...this.shelves.values()].reduce((total, shelf) => total + shelf.stock, 0)
  }

  getShelfState(buildingId: string) { return this.shelves.get(buildingId) }

  getAverageSatisfaction() {
    return this.metrics.satisfactionSamples
      ? this.metrics.satisfactionTotal / this.metrics.satisfactionSamples
      : 100
  }

  getAverageQueueSeconds() {
    return this.metrics.servedCustomers
      ? this.metrics.totalQueueTimeMs / this.metrics.servedCustomers / 1000
      : 0
  }
}
