import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { createProgressionManager } from './progression'
import './style.css'

async function bootstrap() {
  const progression = await createProgressionManager()

  createApp(App)
    .provide('progression', progression)
    .use(i18n)
    .mount('#app')
}

void bootstrap()