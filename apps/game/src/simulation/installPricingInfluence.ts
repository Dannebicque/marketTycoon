import { InfluenceEngine, StorePricingManager, type TrafficForecast } from '@market-tycoon/economy'
import { StoreScene } from '../phaser/StoreScene'

let installed = false
let activeScene: StoreScene | null = null

/**
 * Relie le prix réellement configuré dans le magasin au moteur d'influence.
 * Le calcul économique reste dans le package economy ; cette couche ne fait
 * qu'adapter l'état courant de Phaser au contexte de prévision.
 */
export function installPricingInfluence() {
  if (installed) return
  installed = true

  const originalCreate = StoreScene.prototype.create
  StoreScene.prototype.create = function createWithPricingInfluence() {
    originalCreate.call(this)
    activeScene = this
  }

  const originalForecast = InfluenceEngine.prototype.forecast
  InfluenceEngine.prototype.forecast = function forecastWithStorePricing(context) {
    const products = activeScene?.simulation.getProducts() ?? []
    const pricingManager = new StorePricingManager(products)
    const pricing = pricingManager.getSnapshot(products)

    return originalForecast.call(this, {
      ...context,
      storePriceIndex: pricing.storePriceIndex,
    }) satisfies TrafficForecast
  }

  window.addEventListener('market-tycoon:pricing-changed', dispatchCommercialUpdate)
}

function dispatchCommercialUpdate() {
  window.dispatchEvent(new CustomEvent('market-tycoon:commercial-context-changed'))
}
