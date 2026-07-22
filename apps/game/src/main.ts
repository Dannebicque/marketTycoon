import { createApp } from 'vue'
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

async function bootstrap() {
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

void bootstrap()
