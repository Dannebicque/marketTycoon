import {
  InfluenceEngine,
  marketEventManager,
  type MarketEventState,
  type TrafficForecast,
} from '@market-tycoon/economy'

export const MARKET_EVENTS_STORAGE_KEY = 'market-tycoon.market-events.v1'

let installed = false

export function installMarketEvents() {
  if (installed) return
  installed = true
  restoreMarketEvents()

  const originalForecast = InfluenceEngine.prototype.forecast
  InfluenceEngine.prototype.forecast = function forecastWithMarketEvents(context) {
    const effect = marketEventManager.processDay(context.day)
    const result = originalForecast.call(this, {
      ...context,
      eventMultiplier: (context.eventMultiplier ?? 1) * effect.trafficMultiplier,
    })
    const eventFactor = result.factors.find(factor => factor.source === 'events')
    if (eventFactor) {
      eventFactor.detail = effect.events.length
        ? effect.events.map(event => `${marketEventManager.getDefinition(event.kind).icon} ${marketEventManager.getDefinition(event.kind).name}`).join(' · ')
        : 'Aucun évènement majeur'
    }
    const demandMultiplier = roundMultiplier(result.demandMultiplier * effect.demandMultiplier)
    const expectedBasket = roundMoney(result.expectedBasket * effect.demandMultiplier)
    persistMarketEvents()
    dispatchUpdate(context.day)
    return { ...result, demandMultiplier, expectedBasket } satisfies TrafficForecast
  }

  window.addEventListener('beforeunload', persistMarketEvents)
}

export function getMarketEventSnapshot(day: number) {
  const effect = marketEventManager.getCombinedEffect(day)
  return {
    ...effect,
    events: effect.events.map(event => ({
      ...event,
      definition: marketEventManager.getDefinition(event.kind),
    })),
  }
}

export function persistMarketEvents() {
  localStorage.setItem(MARKET_EVENTS_STORAGE_KEY, JSON.stringify(marketEventManager.exportState()))
}

export function restoreMarketEvents() {
  try {
    const raw = localStorage.getItem(MARKET_EVENTS_STORAGE_KEY)
    marketEventManager.importState(raw ? JSON.parse(raw) as MarketEventState : undefined)
  } catch {
    marketEventManager.importState()
  }
}

function dispatchUpdate(day: number) {
  window.dispatchEvent(new CustomEvent('market-tycoon:market-events-updated', { detail: getMarketEventSnapshot(day) }))
}

function roundMoney(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100 }
function roundMultiplier(value: number) { return Math.round((value + Number.EPSILON) * 1000) / 1000 }
