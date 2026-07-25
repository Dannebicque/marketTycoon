export type ConstructionOrderKind = 'room' | 'floor' | 'wall' | 'extension' | 'blueprint'
export type ConstructionOrderStatus = 'planned' | 'building' | 'completed' | 'cancelled'

export interface ConstructionOrder {
  id: string
  kind: ConstructionOrderKind
  label: string
  cost: number
  durationMs: number
  createdAt: number
  startedAt?: number
  completedAt?: number
  status: ConstructionOrderStatus
  payload: Record<string, unknown>
}

export class ConstructionOrderQueue {
  private readonly orders = new Map<string, ConstructionOrder>()
  private nextId = 1

  create(input: Omit<ConstructionOrder, 'id' | 'createdAt' | 'status'>) {
    const order: ConstructionOrder = {
      ...input,
      id: `construction-${this.nextId++}`,
      createdAt: Date.now(),
      status: 'planned',
    }
    this.orders.set(order.id, order)
    return order
  }

  start(id: string, now = Date.now()) {
    const order = this.orders.get(id)
    if (!order || (order.status !== 'planned' && order.status !== 'cancelled')) return false
    order.status = 'building'
    order.startedAt = now
    order.completedAt = undefined
    return true
  }

  complete(id: string, now = Date.now()) {
    const order = this.orders.get(id)
    if (!order || order.status === 'cancelled' || order.status === 'completed') return false
    order.status = 'completed'
    order.completedAt = now
    return true
  }

  cancel(id: string) {
    const order = this.orders.get(id)
    if (!order || order.status === 'cancelled') return false
    order.status = 'cancelled'
    order.completedAt = undefined
    return true
  }

  restore(id: string, now = Date.now()) {
    const order = this.orders.get(id)
    if (!order || order.status !== 'cancelled') return false
    order.status = 'completed'
    order.startedAt ??= now
    order.completedAt = now
    return true
  }

  get(id: string) { return this.orders.get(id) }
  list() { return [...this.orders.values()] }
}
