export type InfluenceSource = 'calendar' | 'reputation' | 'advertising' | 'promotions' | 'satisfaction' | 'competition' | 'events'

export interface InfluenceFactor {
  source: InfluenceSource
  label: string
  multiplier: number
  detail: string
}

export interface InfluenceContext {
  day: number
  baseVisitors: number
  baseBasket: number
  notoriety: number
  trust: number
  loyalty: number
  advertisingMultiplier?: number
  activePromotions?: number
  averagePromotionDiscount?: number
  satisfactionScore?: number
  competitionMultiplier?: number
  eventMultiplier?: number
}

export interface TrafficForecast {
  day: number
  expectedVisitors: number
  expectedBasket: number
  demandMultiplier: number
  trafficMultiplier: number
  satisfactionModifier: number
  profileWeights: {
    budget: number
    regular: number
    convenience: number
  }
  factors: InfluenceFactor[]
}

export class InfluenceEngine {
  forecast(context: InfluenceContext): TrafficForecast {
    const day = Math.max(1, Math.floor(context.day))
    const factors: InfluenceFactor[] = []
    const calendarMultiplier = this.calendarMultiplier(day)
    factors.push({ source: 'calendar', label: 'Calendrier', multiplier: calendarMultiplier, detail: this.calendarLabel(day) })

    const reputationMultiplier = clamp(.62 + clamp(context.notoriety, 0, 100) * .0072, .62, 1.34)
    factors.push({ source: 'reputation', label: 'Notoriété', multiplier: reputationMultiplier, detail: `${round(context.notoriety)} / 100` })

    const trustMultiplier = clamp(.82 + clamp(context.trust, 0, 100) * .0036, .82, 1.18)
    factors.push({ source: 'satisfaction', label: 'Confiance', multiplier: trustMultiplier, detail: `${round(context.trust)} / 100` })

    const advertisingMultiplier = clamp(context.advertisingMultiplier ?? 1, .5, 3)
    factors.push({ source: 'advertising', label: 'Publicité', multiplier: advertisingMultiplier, detail: advertisingMultiplier > 1 ? `+${round((advertisingMultiplier - 1) * 100)} % de portée` : 'Aucune campagne active' })

    const promotionLift = clamp((context.activePromotions ?? 0) * .035 + (context.averagePromotionDiscount ?? 0) * .18, 0, .45)
    const promotionMultiplier = 1 + promotionLift
    factors.push({ source: 'promotions', label: 'Promotions', multiplier: promotionMultiplier, detail: `${context.activePromotions ?? 0} offre(s) active(s)` })

    const competitionMultiplier = clamp(context.competitionMultiplier ?? 1, .55, 1.2)
    factors.push({ source: 'competition', label: 'Concurrence', multiplier: competitionMultiplier, detail: competitionMultiplier === 1 ? 'Aucune pression concurrentielle' : 'Pression du marché' })

    const eventMultiplier = clamp(context.eventMultiplier ?? 1, .6, 1.8)
    factors.push({ source: 'events', label: 'Évènements', multiplier: eventMultiplier, detail: eventMultiplier === 1 ? 'Aucun évènement majeur' : 'Contexte exceptionnel' })

    const trafficMultiplier = roundMultiplier(factors.reduce((value, factor) => value * factor.multiplier, 1))
    const satisfactionScore = clamp(context.satisfactionScore ?? context.trust, 0, 100)
    const satisfactionModifier = roundMultiplier(.85 + satisfactionScore * .003)
    const loyaltyBasketLift = clamp(context.loyalty, 0, 100) * .002
    const promotionBasketLift = clamp(context.averagePromotionDiscount ?? 0, 0, .8) * .22
    const expectedBasket = roundMoney(context.baseBasket * satisfactionModifier * (1 + loyaltyBasketLift + promotionBasketLift))
    const expectedVisitors = Math.max(1, Math.round(Math.max(1, context.baseVisitors) * trafficMultiplier))

    const budgetWeight = clamp(.32 + (context.averagePromotionDiscount ?? 0) * .28, .2, .55)
    const convenienceWeight = clamp(.2 + clamp(context.trust, 0, 100) * .0012, .18, .34)
    const regularWeight = Math.max(.1, 1 - budgetWeight - convenienceWeight)

    return {
      day,
      expectedVisitors,
      expectedBasket,
      demandMultiplier: roundMultiplier(promotionMultiplier * satisfactionModifier),
      trafficMultiplier,
      satisfactionModifier,
      profileWeights: normalizeWeights(budgetWeight, regularWeight, convenienceWeight),
      factors,
    }
  }

  private calendarMultiplier(day: number) {
    const weekday = (day - 1) % 7
    return [1, .92, .94, .98, 1.08, 1.24, 1.15][weekday]
  }

  private calendarLabel(day: number) {
    return ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][(day - 1) % 7]
  }
}

function normalizeWeights(budget: number, regular: number, convenience: number) {
  const total = budget + regular + convenience
  return {
    budget: roundMultiplier(budget / total),
    regular: roundMultiplier(regular / total),
    convenience: roundMultiplier(convenience / total),
  }
}
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min)) }
function round(value: number) { return Math.round(value) }
function roundMoney(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100 }
function roundMultiplier(value: number) { return Math.round((value + Number.EPSILON) * 1000) / 1000 }
