import { ConstructionOrderQueue, type ConstructionOrder } from './ConstructionOrder'

export interface ConstructionSchedulerListener {
  (orders: ConstructionOrder[]): void
}

export class ConstructionScheduler {
  private readonly listeners = new Set<ConstructionSchedulerListener>()
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(private readonly queue: ConstructionOrderQueue) {}

  schedule(orderId: string) {
    const order = this.queue.get(orderId)
    if (!order || !this.queue.start(orderId)) return false
    this.emit()
    const timer = setTimeout(() => {
      this.timers.delete(orderId)
      this.queue.complete(orderId)
      this.emit()
    }, Math.max(0, order.durationMs))
    this.timers.set(orderId, timer)
    return true
  }

  cancel(orderId: string) {
    const timer = this.timers.get(orderId)
    if (timer) clearTimeout(timer)
    this.timers.delete(orderId)
    const changed = this.queue.cancel(orderId)
    if (changed) this.emit()
    return changed
  }

  restoreCompleted(orderId: string) {
    const changed = this.queue.restore(orderId)
    if (changed) this.emit()
    return changed
  }

  subscribe(listener: ConstructionSchedulerListener) {
    this.listeners.add(listener)
    listener(this.queue.list())
    return () => this.listeners.delete(listener)
  }

  dispose() {
    for (const timer of this.timers.values()) clearTimeout(timer)
    this.timers.clear()
    this.listeners.clear()
  }

  private emit() {
    const orders = this.queue.list()
    for (const listener of this.listeners) listener(orders)
  }
}
