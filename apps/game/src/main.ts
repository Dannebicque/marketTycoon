import { createApp } from 'vue'
import { SAVE_GAME_STORAGE_KEY } from '@market-tycoon/save'
import App from './App.vue'
import ProgressionWidget from './components/progression/ProgressionWidget.vue'
import StoreIdentityWidget from './components/store/StoreIdentityWidget.vue'
import ZoneToolbarWidget from './components/zones/ZoneToolbarWidget.vue'
import { i18n } from './i18n'
import { createProgressionManager } from './progression'
import { installStoreNeeds } from './simulation/installStoreNeeds'
import { installStoreZones } from './zones/installStoreZones'
import './style.css'
import './progression.css'
import './store-identity.css'
import './zones.css'

const DEV_SCENARIO_VERSION = '4'
const DEV_SCENARIO_VERSION_KEY = 'market-tycoon.dev-scenario-version'

async function bootstrap() {
  migrateDevelopmentScenario()
  installStoreZones()
  installStoreNeeds()
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
}

function migrateDevelopmentScenario() {
  if (!import.meta.env.DEV) return
  if (localStorage.getItem(DEV_SCENARIO_VERSION_KEY) === DEV_SCENARIO_VERSION) return

  // Le scénario de démonstration a changé de géométrie. Une ancienne sauvegarde
  // empêcherait son initialisation et conserverait des zones devenues incohérentes.
  localStorage.removeItem(SAVE_GAME_STORAGE_KEY)
  localStorage.removeItem('market-tycoon.zones.v1')
  localStorage.setItem(DEV_SCENARIO_VERSION_KEY, DEV_SCENARIO_VERSION)
}

void bootstrap()
