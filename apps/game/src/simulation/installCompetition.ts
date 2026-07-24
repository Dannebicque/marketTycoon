import {
  InfluenceEngine,
  competitionManager,
  type CompetitionState,
  type TrafficForecast,
} from '@market-tycoon/economy'

export const COMPETITION_STORAGE_KEY = 'market-tycoon.competition.v1'

let installed = false

export function installCompetition() {
  if (installed) return
  installed = true
  restoreCompetition()

  const originalForecast = InfluenceEngine.prototype.forecast
  InfluenceEngine.prototype.forecast = function forecastWithCompetition(context) {
    const competition = competitionManager.processDay(context.day)
    const result = originalForecast.call(this, {
      ...context,
      competitionMultiplier: (context.competitionMultiplier ?? 1) * competition.trafficMultiplier,
    })

    const factor = result.factors.find(item => item.source === 'competition')
    if (factor) {
      factor.detail = competition.leader
        ? `${competition.leader.icon} ${competition.leader.name} mène le marché · pression ${competition.pressure}/100`
        : 'Aucune pression concurrentielle'
    }

    const profileWeights = normalizeWeights(
      result.profileWeights.budget + competition.budgetWeightLift,
      result.profileWeights.regular,
      result.profileWeights.convenience + competition.convenienceWeightLift,
    )
    const demandMultiplier = roundMultiplier(result.demandMultiplier * competition.demandMultiplier)
    const expectedBasket = roundMoney(result.expectedBasket * competition.demandMultiplier)

    persistCompetition()
    dispatchUpdate(context.day)
    return { ...result, profileWeights, demandMultiplier, expectedBasket } satisfies TrafficForecast
  }

  window.addEventListener('beforeunload', persistCompetition)
}

export function getCompetitionSnapshot(day: number) {
  competitionManager.processDay(day)
  return competitionManager.getEffect()
}

export function persistCompetition() {
  localStorage.setItem(COMPETITION_STORAGE_KEY, JSON.stringify(competitionManager.exportState()))
}

export function restoreCompetition() {
  try {
    const raw = localStorage.getItem(COMPETITION_STORAGE_KEY)
    competitionManager.importState(raw ? JSON.parse(raw) as CompetitionState : undefined)
  } catch {
    competitionManager.importState()
  }
}

function dispatchUpdate(day: number) {
  window.dispatchEvent(new CustomEvent('market-tycoon:competition-updated', { detail: getCompetitionSnapshot(day) }))
}

function normalizeWeights(budget: number, regular: number, convenience: number) {
  const total = Math.max(.001, budget + regular + convenience)
  return {
    budget: roundMultiplier(budget / total),
    regular: roundMultiplier(regular / total),
    convenience: roundMultiplier(convenience / total),
  }
}
function roundMoney(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100 }
function roundMultiplier(value: number) { return Math.round((value + Number.EPSILON) * 1000) / 1000 }
