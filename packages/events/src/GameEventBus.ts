export type GameEventMap = Record<string, unknown>

type EventHandler<T> = (payload: T) => void

/**
 * Bus synchrone et typé pour diffuser les faits métier du jeu.
 * Indépendant de Vue, Phaser et des implémentations du moteur.
 */
export class GameEventBus<TEvents extends GameEventMap> {
  private readonly handlers = new Map<keyof TEvents, Set<EventHandler<unknown>>>()

  on<TKey extends keyof TEvents>(event: TKey, handler: EventHandler<TEvents[TKey]>) {
    const handlers = this.handlers.get(event) ?? new Set<EventHandler<unknown>>()
    handlers.add(handler as EventHandler<unknown>)
    this.handlers.set(event, handlers)
    return () => this.off(event, handler)
  }

  once<TKey extends keyof TEvents>(event: TKey, handler: EventHandler<TEvents[TKey]>) {
    const unsubscribe = this.on(event, payload => {
      unsubscribe()
      handler(payload)
    })
    return unsubscribe
  }

  off<TKey extends keyof TEvents>(event: TKey, handler: EventHandler<TEvents[TKey]>) {
    const handlers = this.handlers.get(event)
    handlers?.delete(handler as EventHandler<unknown>)
    if (handlers?.size === 0) this.handlers.delete(event)
  }

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]) {
    const handlers = this.handlers.get(event)
    if (!handlers) return
    for (const handler of [...handlers]) handler(payload)
  }

  clear(event?: keyof TEvents) {
    if (event !== undefined) this.handlers.delete(event)
    else this.handlers.clear()
  }

  listenerCount(event: keyof TEvents) {
    return this.handlers.get(event)?.size ?? 0
  }
}
