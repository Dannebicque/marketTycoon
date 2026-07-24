import {
  DEFAULT_PROGRESSION_CONFIGURATION,
  ProgressionManager,
  formatProgressionConfigurationIssues,
  parseProgressionConfiguration,
} from '@market-tycoon/progression'

const PROGRESSION_CONFIGURATION_URL = '/config/progression.json'

export async function createProgressionManager() {
  try {
    const response = await fetch(PROGRESSION_CONFIGURATION_URL, { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const result = parseProgressionConfiguration(await response.json())
    if (!result.valid || !result.configuration) {
      console.error(`Configuration de progression invalide :\n${formatProgressionConfigurationIssues(result.issues)}`)
      return new ProgressionManager(DEFAULT_PROGRESSION_CONFIGURATION)
    }
    return new ProgressionManager(result.configuration)
  } catch (error) {
    console.warn('Impossible de charger la configuration de progression, utilisation de la configuration par défaut.', error)
    return new ProgressionManager(DEFAULT_PROGRESSION_CONFIGURATION)
  }
}