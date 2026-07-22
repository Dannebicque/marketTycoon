import { createApp } from 'vue'
import App from './App.vue'
import ProgressionWidget from './components/progression/ProgressionWidget.vue'
import { i18n } from './i18n'
import { createProgressionManager } from './progression'
import './style.css'
import './progression.css'

async function bootstrap() {
  const progression = await createProgressionManager()

  createApp(App)
    .provide('progression', progression)
    .use(i18n)
    .mount('#app')

  const progressionRoot = document.createElement('div')
  progressionRoot.id = 'progression-ui'
  document.body.appendChild(progressionRoot)
  createApp(ProgressionWidget, { progression }).mount(progressionRoot)
}

void bootstrap()
