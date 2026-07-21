import { createI18n } from 'vue-i18n'
import fr from './locales/fr.json'
import en from './locales/en.json'
import { getBuildingDefinition } from '../game/catalog/buildings'

export const SUPPORTED_LOCALES = ['fr', 'en'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

const STORAGE_KEY = 'market-tycoon.locale'

function resolveInitialLocale(): SupportedLocale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (SUPPORTED_LOCALES.includes(stored as SupportedLocale)) return stored as SupportedLocale
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: resolveInitialLocale(),
  fallbackLocale: 'fr',
  messages: { fr, en },
})

export function translate(key: string, params?: Record<string, unknown>): string {
  return String(i18n.global.t(key, params ?? {}))
}

export function setLocale(locale: SupportedLocale) {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.lang = locale
  applyCatalogTranslationExamples()
}

export function applyCatalogTranslationExamples() {
  const standardShelf = getBuildingDefinition('standard-shelf')
  if (!standardShelf) return
  standardShelf.name = translate('objects.standard-shelf.name')
  standardShelf.description = translate('objects.standard-shelf.description')
}

applyCatalogTranslationExamples()
document.documentElement.lang = i18n.global.locale.value
