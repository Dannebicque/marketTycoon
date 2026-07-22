import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { progression } from './progression'
import './style.css'

createApp(App)
  .provide('progression', progression)
  .use(i18n)
  .mount('#app')
