export type CompetitorStrategy = 'discount' | 'quality' | 'convenience'

export interface CompetitorDefinition {
  id: string
  name: string
  icon: string
  strategy: CompetitorStrategy
  priceIndex: number
  quality: number
  convenience: number
  notoriety: number
}

export interface CompetitorState extends CompetitorDefinition {
  activity: number
  lastUpdatedDay: number
}

export interface CompetitionState {
  competitors?: CompetitorState[]
}

export interface CompetitionEffect {
  trafficMultiplier: number
  demandMultiplier: number
  budgetWeightLift: number
  convenienceWeightLift: number
  pressure: number
  leader?: CompetitorState
  competitors: CompetitorState[]
}

const DEFAULT_COMPETITORS: CompetitorDefinition[] = [
  { id: 'prix-malin', name: 'Prix Malin', icon: '🏷️', strategy: 'discount', priceIndex: .86, quality: 48, convenience: 58, notoriety: 62 },
  { id: 'marche-frais', name: 'Marché Frais', icon: '🥬', strategy: 'quality', priceIndex: 1.08, quality: 82, convenience: 52, notoriety: 55 },
  { id: 'express-corner', name: 'Express Corner', icon: '⚡', strategy: 'convenience', priceIndex: 1.12, quality: 60, convenience: 88, notoriety: 50 },
]

export class CompetitionManager {
  private competitors: CompetitorState[] = DEFAULT_COMPETITORS.map(item => ({ ...item, activity: 1, lastUpdatedDay: 0 }))

  processDay(day: number) {
    const normalizedDay = Math.max(1, Math.floor(day))
    this.competitors = this.competitors.map((competitor, index) => {
      if (competitor.lastUpdatedDay >= normalizedDay) return competitor
      const pulse = seededRandom(normalizedDay * 137 + index * 29)
      const activity = clamp(.82 + pulse * .36, .72, 1.22)
      return { ...competitor, activity: roundMultiplier(activity), lastUpdatedDay: normalizedDay }
    })
    return this.getEffect()
  }

  getEffect(): CompetitionEffect {
    const competitors = this.getCompetitors()
    const scores = competitors.map(item => ({ item, score: this.score(item) }))
    const leader = [...scores].sort((a, b) => b.score - a.score)[0]?.item
    const pressure = clamp(scores.reduce((sum, entry) => sum + entry.score, 0) / Math.max(1, scores.length), 0, 100)
    const trafficMultiplier = clamp(1.14 - pressure * .0042, .68, 1.08)
    const discountPressure = competitors.filter(item => item.strategy === 'discount').reduce((sum, item) => sum + item.activity * item.notoriety / 100, 0)
    const conveniencePressure = competitors.filter(item => item.strategy === 'convenience').reduce((sum, item) => sum + item.activity * item.notoriety / 100, 0)
    return {
      trafficMultiplier: roundMultiplier(trafficMultiplier),
      demandMultiplier: roundMultiplier(clamp(1.04 - pressure * .0012, .88, 1.04)),
      budgetWeightLift: roundMultiplier(clamp(discountPressure * .08, 0, .16)),
      convenienceWeightLift: roundMultiplier(clamp(conveniencePressure * .07, 0, .14)),
      pressure: Math.round(pressure),
      leader,
      competitors,
    }
  }

  getCompetitors() { return this.competitors.map(item => ({ ...item })) }
  exportState(): CompetitionState { return { competitors: this.getCompetitors() } }
  importState(state?: CompetitionState) {
    const incoming = state?.competitors ?? []
    this.competitors = DEFAULT_COMPETITORS.map(definition => {
      const saved = incoming.find(item => item.id === definition.id)
      return saved ? { ...definition, ...saved } : { ...definition, activity: 1, lastUpdatedDay: 0 }
    })
  }

  private score(competitor: CompetitorState) {
    const strategicStrength = competitor.strategy === 'discount'
      ? (1.2 - competitor.priceIndex) * 100
      : competitor.strategy === 'quality'
        ? competitor.quality
        : competitor.convenience
    return clamp((strategicStrength * .55 + competitor.notoriety * .45) * competitor.activity, 0, 100)
  }
}

export const competitionManager = new CompetitionManager()

function seededRandom(seed: number) { const value = Math.sin(seed) * 10_000; return value - Math.floor(value) }
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min)) }
function roundMultiplier(value: number) { return Math.round((value + Number.EPSILON) * 1000) / 1000 }
