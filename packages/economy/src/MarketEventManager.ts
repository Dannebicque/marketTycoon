export type MarketEventKind = 'local-festival' | 'roadworks' | 'transport-strike' | 'competitor-closure' | 'payday' | 'supply-alert'

export interface MarketEventDefinition {
  kind: MarketEventKind
  name: string
  description: string
  icon: string
  durationDays: readonly [number, number]
  trafficMultiplier: number
  demandMultiplier: number
}

export interface MarketEvent {
  id: string
  kind: MarketEventKind
  startDay: number
  endDay: number
  trafficMultiplier: number
  demandMultiplier: number
  createdAt: number
}

export interface MarketEventState {
  nextEvent?: number
  lastGeneratedDay?: number
  events?: MarketEvent[]
}

export const MARKET_EVENT_DEFINITIONS: Record<MarketEventKind, MarketEventDefinition> = {
  'local-festival': { kind: 'local-festival', name: 'Festival local', description: 'Une manifestation attire davantage de visiteurs dans la zone commerciale.', icon: '🎪', durationDays: [2, 4], trafficMultiplier: 1.22, demandMultiplier: 1.08 },
  roadworks: { kind: 'roadworks', name: 'Travaux routiers', description: 'Les accès au magasin sont perturbés pendant quelques jours.', icon: '🚧', durationDays: [3, 6], trafficMultiplier: .78, demandMultiplier: 1.02 },
  'transport-strike': { kind: 'transport-strike', name: 'Grève des transports', description: 'Les déplacements sont réduits et les achats se concentrent sur les clients proches.', icon: '🚌', durationDays: [1, 3], trafficMultiplier: .84, demandMultiplier: 1.05 },
  'competitor-closure': { kind: 'competitor-closure', name: 'Concurrent temporairement fermé', description: 'Une partie de la clientèle voisine cherche un magasin de remplacement.', icon: '🏪', durationDays: [2, 5], trafficMultiplier: 1.28, demandMultiplier: 1.04 },
  payday: { kind: 'payday', name: 'Période de paie', description: 'Les ménages disposent temporairement d’un budget plus confortable.', icon: '💳', durationDays: [1, 2], trafficMultiplier: 1.08, demandMultiplier: 1.16 },
  'supply-alert': { kind: 'supply-alert', name: 'Alerte d’approvisionnement', description: 'Les clients anticipent une possible pénurie et augmentent certaines quantités.', icon: '⚠️', durationDays: [1, 3], trafficMultiplier: 1.05, demandMultiplier: 1.24 },
}

export class MarketEventManager {
  private events: MarketEvent[] = []
  private nextEvent = 1
  private lastGeneratedDay = 0

  processDay(day: number) {
    const normalizedDay = Math.max(1, Math.floor(day))
    if (normalizedDay <= this.lastGeneratedDay) return this.getActive(normalizedDay)
    for (let current = this.lastGeneratedDay + 1; current <= normalizedDay; current++) this.maybeGenerate(current)
    this.lastGeneratedDay = normalizedDay
    this.events = this.events.filter(event => event.endDay >= normalizedDay - 30)
    return this.getActive(normalizedDay)
  }

  schedule(kind: MarketEventKind, startDay: number, duration?: number) {
    const definition = MARKET_EVENT_DEFINITIONS[kind]
    const normalizedStart = Math.max(1, Math.floor(startDay))
    const normalizedDuration = duration ?? randomBetween(definition.durationDays[0], definition.durationDays[1])
    const event: MarketEvent = {
      id: `EVENT-${this.nextEvent++}`,
      kind,
      startDay: normalizedStart,
      endDay: normalizedStart + Math.max(1, Math.floor(normalizedDuration)) - 1,
      trafficMultiplier: definition.trafficMultiplier,
      demandMultiplier: definition.demandMultiplier,
      createdAt: Date.now(),
    }
    this.events.push(event)
    return { ...event }
  }

  getActive(day: number) {
    return this.events.filter(event => day >= event.startDay && day <= event.endDay).map(event => ({ ...event }))
  }

  getEvents() { return this.events.map(event => ({ ...event })) }
  getDefinition(kind: MarketEventKind) { return MARKET_EVENT_DEFINITIONS[kind] }

  getCombinedEffect(day: number) {
    const active = this.getActive(day)
    return {
      trafficMultiplier: roundMultiplier(active.reduce((value, event) => value * event.trafficMultiplier, 1)),
      demandMultiplier: roundMultiplier(active.reduce((value, event) => value * event.demandMultiplier, 1)),
      events: active,
    }
  }

  exportState(): MarketEventState {
    return { nextEvent: this.nextEvent, lastGeneratedDay: this.lastGeneratedDay, events: this.getEvents() }
  }

  importState(state?: MarketEventState) {
    this.nextEvent = Math.max(1, state?.nextEvent ?? 1)
    this.lastGeneratedDay = Math.max(0, state?.lastGeneratedDay ?? 0)
    this.events = (state?.events ?? []).filter(event => Boolean(MARKET_EVENT_DEFINITIONS[event.kind])).map(event => ({ ...event }))
  }

  private maybeGenerate(day: number) {
    if (this.getActive(day).length) return
    const random = seededRandom(day * 1_009 + 73)
    if (random > .14) return
    const kinds = Object.keys(MARKET_EVENT_DEFINITIONS) as MarketEventKind[]
    const kind = kinds[Math.min(kinds.length - 1, Math.floor(seededRandom(day * 313 + 19) * kinds.length))]
    const definition = MARKET_EVENT_DEFINITIONS[kind]
    const duration = randomBetween(definition.durationDays[0], definition.durationDays[1], seededRandom(day * 719 + 11))
    this.schedule(kind, day, duration)
  }
}

export const marketEventManager = new MarketEventManager()

function seededRandom(seed: number) { const value = Math.sin(seed) * 10_000; return value - Math.floor(value) }
function randomBetween(min: number, max: number, random = Math.random()) { return min + Math.floor(random * (max - min + 1)) }
function roundMultiplier(value: number) { return Math.round((value + Number.EPSILON) * 1000) / 1000 }
