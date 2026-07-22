import { createApp } from 'vue'
import App from './App.vue'
import ProgressionWidget from './components/progression/ProgressionWidget.vue'
import StoreIdentityWidget from './components/store/StoreIdentityWidget.vue'
import { i18n } from './i18n'
import { createProgressionManager } from './progression'
import './style.css'
import './progression.css'
import './store-identity.css'

async function bootstrap() {
  const progression = await createProgressionManager()

  createApp(App)
    .provide('progression', progression)
    .use(i18n)
    .mount('#app')

  const storeIdentityRoot = document.createElement('div')
  storeIdentityRoot.id = 'store-identity-ui'
  document.body.appendChild(storeIdentityRoot)
  createApp(StoreIdentityWidget).mount(storeIdentityRoot)

  const progressionRoot = document.createElement('div')
  progressionRoot.id = 'progression-ui'
  document.body.appendChild(progressionRoot)
  createApp(ProgressionWidget, { progression }).mount(progressionRoot)
}

void bootstrap()
