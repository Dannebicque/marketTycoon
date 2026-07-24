import { createApp } from 'vue'
import { SAVE_GAME_STORAGE_KEY } from '@market-tycoon/save'
import App from './App.vue'
import HelpWidget from './components/help/HelpWidget.vue'
import ProgressionWidget from './components/progression/ProgressionWidget.vue'
import PromotionReactionOverlay from './components/promotions/PromotionReactionOverlay.vue'
import StoreIdentityWidget from './components/store/StoreIdentityWidget.vue'
import ZoneToolbarWidget from './components/zones/ZoneToolbarWidget.vue'
import { ADVERTISING_STORAGE_KEY, installBusinessFinance, LOANS_STORAGE_KEY } from './finance/installBusinessFinance'
import { i18n } from './i18n'
import { createProgressionManager } from './progression'
import { installViewDisplay } from './phaser/installViewDisplay'
import { installPromotions, PROMOTIONS_STORAGE_KEY, PROMOTION_ANALYTICS_STORAGE_KEY } from './promotions/installPromotions'
import { CUSTOMER_MEMORY_STORAGE_KEY, installCustomerMemory } from './simulation/installCustomerMemory'
import { installInfluence, STORE_REPUTATION_STORAGE_KEY } from './simulation/installInfluence'
import { installMarketEvents, MARKET_EVENTS_STORAGE_KEY } from './simulation/installMarketEvents'
import { installSimulationContext } from './simulation/SimulationContext'
import { installStoreNeeds } from './simulation/installStoreNeeds'
import { installStoreZones } from './zones/installStoreZones'
import './style.css'
import './progression.css'
import './store-identity.css'
import './zones.css'
import './help.css'
import './simulation-context.css'

const DEV_SCENARIO_VERSION = '9'
const DEV_SCENARIO_VERSION_KEY = 'market-tycoon.dev-scenario-version'

async function bootstrap() {
  migrateDevelopmentScenario()
  installViewDisplay()
  installStoreZones()
  installStoreNeeds()
  installPromotions()
  installBusinessFinance()
  installSimulationContext()
  installMarketEvents()
  installInfluence()
  installCustomerMemory()
  const progression = await createProgressionManager()

  createApp(App)
    .provide('progression', progression)
    .use(i18n)
    .mount('#app')

  const storeIdentityRoot = document.createElement('div')
  storeIdentityRoot.id = 'store-identity-ui'
  document.body.appendChild(storeIdentityRoot)
  createApp(StoreIdentityWidget).mount(storeIdentityRoot)

  const zoneRoot = document.createElement('div')
  zoneRoot.id = 'zone-ui'
  document.body.appendChild(zoneRoot)
  createApp(ZoneToolbarWidget, { progression }).mount(zoneRoot)

  const progressionRoot = document.createElement('div')
  progressionRoot.id = 'progression-ui'
  document.body.appendChild(progressionRoot)
  createApp(ProgressionWidget, { progression }).mount(progressionRoot)

  const helpRoot = document.createElement('div')
  helpRoot.id = 'help-ui'
  document.body.appendChild(helpRoot)
  createApp(HelpWidget).mount(helpRoot)

  const promotionReactionRoot = document.createElement('div')
  promotionReactionRoot.id = 'promotion-reaction-ui'
  document.body.appendChild(promotionReactionRoot)
  createApp(PromotionReactionOverlay).mount(promotionReactionRoot)
}

function migrateDevelopmentScenario() {
  if (!import.meta.env.DEV) return
  if (localStorage.getItem(DEV_SCENARIO_VERSION_KEY) === DEV_SCENARIO_VERSION) return

  localStorage.removeItem(SAVE_GAME_STORAGE_KEY)
  localStorage.removeItem('market-tycoon.zones.v1')
  localStorage.removeItem('market-tycoon.analytics.v1')
  localStorage.removeItem(PROMOTIONS_STORAGE_KEY)
  localStorage.removeItem(PROMOTION_ANALYTICS_STORAGE_KEY)
  localStorage.removeItem(ADVERTISING_STORAGE_KEY)
  localStorage.removeItem(LOANS_STORAGE_KEY)
  localStorage.removeItem(STORE_REPUTATION_STORAGE_KEY)
  localStorage.removeItem(CUSTOMER_MEMORY_STORAGE_KEY)
  localStorage.removeItem(MARKET_EVENTS_STORAGE_KEY)
  localStorage.setItem(DEV_SCENARIO_VERSION_KEY, DEV_SCENARIO_VERSION)
}

void bootstrap()
