export interface StoreReputation {
  notoriety: number
  trust: number
  loyalty: number
  lastProcessedDay: number
  history: StoreReputationSnapshot[]
}

export interface StoreReputationSnapshot {
  day: number
  notoriety: number
  trust: number
  loyalty: number
  reasons: string[]
}

export interface ReputationDayResult {
  day: number
  visitors: number
  servedCustomers: number
  lostCustomers: number
  conversionRate: number
  satisfactionScore: number
  availabilityRate: number
  advertisingLift: number
  activePromotions: number
}

export interface StoreReputationState {
  reputation?: Partial<StoreReputation>
}

export class StoreReputationManager {
  private reputation: StoreReputation = {
    notoriety: 8,
    trust: 50,
    loyalty: 4,
    lastProcessedDay: 0,
    history: [],
  }

  getSnapshot(): StoreReputation {
    return {
      ...this.reputation,
      history: this.reputation.history.map(item => ({ ...item, reasons: [...item.reasons] })),
    }
  }

  processDay(result: ReputationDayResult) {
    const day = Math.max(1, Math.floor(result.day))
    if (day <= this.reputation.lastProcessedDay) return this.getSnapshot()

    const reasons: string[] = []
    const visitorExposure = Math.min(1.2, Math.max(0, result.visitors) / 25)
    let notorietyDelta = .15 + visitorExposure * .45 + Math.max(0, result.advertisingLift) * 2.4 + Math.min(4, result.activePromotions) * .08
    if (result.advertisingLift > 0) reasons.push('La publicité accroît la visibilité du magasin.')
    if (result.visitors >= 25) reasons.push('La fréquentation entretient le bouche-à-oreille.')

    const conversionSignal = (clamp(result.conversionRate, 0, 1) - .65) * 2.4
    const satisfactionSignal = (clamp(result.satisfactionScore, 0, 100) - 55) / 22
    const availabilitySignal = (clamp(result.availabilityRate, 0, 1) - .82) * 3
    const lossRate = result.visitors > 0 ? clamp(result.lostCustomers / result.visitors, 0, 1) : 0
    const trustDelta = conversionSignal + satisfactionSignal + availabilitySignal - lossRate * 2.5

    if (result.availabilityRate < .75) reasons.push('Les ruptures dégradent la confiance.')
    if (result.satisfactionScore >= 65) reasons.push('Les visites satisfaisantes renforcent la confiance.')
    if (lossRate > .2) reasons.push('Trop de visiteurs quittent le magasin sans achat.')

    const loyaltyDelta = Math.max(-1.2, Math.min(1.5,
      (clamp(result.conversionRate, 0, 1) - .55) * 1.3
      + (clamp(result.satisfactionScore, 0, 100) - 55) / 55
      - lossRate,
    ))
    if (loyaltyDelta > .45) reasons.push('Une expérience régulière commence à fidéliser la clientèle.')

    if (result.visitors === 0) notorietyDelta = -.25
    this.reputation.notoriety = roundScore(this.reputation.notoriety + notorietyDelta)
    this.reputation.trust = roundScore(this.reputation.trust + trustDelta)
    this.reputation.loyalty = roundScore(this.reputation.loyalty + loyaltyDelta)
    this.reputation.lastProcessedDay = day
    this.reputation.history.push({
      day,
      notoriety: this.reputation.notoriety,
      trust: this.reputation.trust,
      loyalty: this.reputation.loyalty,
      reasons: reasons.length ? reasons : ['La réputation reste globalement stable.'],
    })
    this.reputation.history = this.reputation.history.slice(-60)
    return this.getSnapshot()
  }

  exportState(): StoreReputationState { return { reputation: this.getSnapshot() } }

  importState(state?: StoreReputationState) {
    const source = state?.reputation
    this.reputation = {
      notoriety: roundScore(source?.notoriety ?? 8),
      trust: roundScore(source?.trust ?? 50),
      loyalty: roundScore(source?.loyalty ?? 4),
      lastProcessedDay: Math.max(0, Math.floor(source?.lastProcessedDay ?? 0)),
      history: (source?.history ?? []).map(item => ({
        day: Math.max(1, Math.floor(item.day)),
        notoriety: roundScore(item.notoriety),
        trust: roundScore(item.trust),
        loyalty: roundScore(item.loyalty),
        reasons: [...(item.reasons ?? [])],
      })).slice(-60),
    }
  }
}

export const storeReputationManager = new StoreReputationManager()
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min)) }
function roundScore(value: number) { return Math.round(clamp(value, 0, 100) * 10) / 10 }
