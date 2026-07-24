import {
  PROGRESSION_METRICS,
  type ProgressionConfiguration,
  type ProgressionConfigurationIssue,
  type ProgressionConfigurationResult,
  type ProgressionLevelDefinition,
  type ProgressionMetric,
  type ProgressionObjectiveDefinition,
} from './contracts'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const isPositiveInteger = (value: unknown): value is number => Number.isInteger(value) && Number(value) > 0
const isNonNegativeNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0
const isMetric = (value: unknown): value is ProgressionMetric => typeof value === 'string' && PROGRESSION_METRICS.includes(value as ProgressionMetric)

function readStringArray(value: unknown, path: string, issues: ProgressionConfigurationIssue[]) {
  if (!Array.isArray(value)) {
    issues.push({ path, message: 'doit être un tableau de chaînes' })
    return []
  }
  const result = value.filter(isString).map(item => item.trim())
  if (result.length !== value.length) issues.push({ path, message: 'contient une valeur invalide' })
  return [...new Set(result)]
}

function readLevel(value: unknown, index: number, issues: ProgressionConfigurationIssue[]): ProgressionLevelDefinition | undefined {
  const path = `levels[${index}]`
  if (!isRecord(value)) {
    issues.push({ path, message: 'doit être un objet' })
    return undefined
  }
  if (!isPositiveInteger(value.level)) issues.push({ path: `${path}.level`, message: 'doit être un entier positif' })
  if (!isString(value.title)) issues.push({ path: `${path}.title`, message: 'est obligatoire' })
  if (!isString(value.description)) issues.push({ path: `${path}.description`, message: 'est obligatoire' })
  const requiredObjectiveKeys = readStringArray(value.requiredObjectiveKeys, `${path}.requiredObjectiveKeys`, issues)
  const unlockKeys = value.unlockKeys === undefined ? [] : readStringArray(value.unlockKeys, `${path}.unlockKeys`, issues)
  if (!isPositiveInteger(value.level) || !isString(value.title) || !isString(value.description)) return undefined
  return { level: value.level, title: value.title.trim(), description: value.description.trim(), requiredObjectiveKeys, unlockKeys }
}

function readObjective(value: unknown, index: number, issues: ProgressionConfigurationIssue[]): ProgressionObjectiveDefinition | undefined {
  const path = `objectives[${index}]`
  if (!isRecord(value)) {
    issues.push({ path, message: 'doit être un objet' })
    return undefined
  }
  if (!isString(value.key)) issues.push({ path: `${path}.key`, message: 'est obligatoire' })
  if (!isString(value.title)) issues.push({ path: `${path}.title`, message: 'est obligatoire' })
  if (!isString(value.description)) issues.push({ path: `${path}.description`, message: 'est obligatoire' })
  if (!isMetric(value.metric)) issues.push({ path: `${path}.metric`, message: `métrique inconnue (${PROGRESSION_METRICS.join(', ')})` })
  if (!isNonNegativeNumber(value.target)) issues.push({ path: `${path}.target`, message: 'doit être un nombre positif ou nul' })
  if (!isPositiveInteger(value.level)) issues.push({ path: `${path}.level`, message: 'doit être un entier positif' })
  if (!isString(value.key) || !isString(value.title) || !isString(value.description) || !isMetric(value.metric) || !isNonNegativeNumber(value.target) || !isPositiveInteger(value.level)) return undefined
  return { key: value.key.trim(), title: value.title.trim(), description: value.description.trim(), metric: value.metric, target: value.target, level: value.level }
}

export function parseProgressionConfiguration(value: unknown): ProgressionConfigurationResult {
  const issues: ProgressionConfigurationIssue[] = []
  if (!isRecord(value)) return { valid: false, issues: [{ path: '', message: 'la configuration doit être un objet' }] }

  const version = isPositiveInteger(value.version) ? value.version : 1
  if (!Array.isArray(value.levels) || value.levels.length === 0) issues.push({ path: 'levels', message: 'doit contenir au moins un niveau' })
  if (!Array.isArray(value.objectives)) issues.push({ path: 'objectives', message: 'doit être un tableau' })

  const levels = Array.isArray(value.levels) ? value.levels.map((item, index) => readLevel(item, index, issues)).filter((item): item is ProgressionLevelDefinition => Boolean(item)) : []
  const objectives = Array.isArray(value.objectives) ? value.objectives.map((item, index) => readObjective(item, index, issues)).filter((item): item is ProgressionObjectiveDefinition => Boolean(item)) : []

  const levelNumbers = new Set<number>()
  for (const level of levels) {
    if (levelNumbers.has(level.level)) issues.push({ path: 'levels', message: `niveau ${level.level} défini plusieurs fois` })
    levelNumbers.add(level.level)
  }
  const sortedNumbers = [...levelNumbers].sort((a, b) => a - b)
  if (sortedNumbers[0] !== 1) issues.push({ path: 'levels', message: 'la progression doit commencer au niveau 1' })
  sortedNumbers.forEach((level, index) => {
    if (level !== index + 1) issues.push({ path: 'levels', message: 'les niveaux doivent être consécutifs' })
  })

  const objectiveKeys = new Set<string>()
  for (const objective of objectives) {
    if (objectiveKeys.has(objective.key)) issues.push({ path: 'objectives', message: `objectif ${objective.key} défini plusieurs fois` })
    objectiveKeys.add(objective.key)
    if (!levelNumbers.has(objective.level)) issues.push({ path: `objectives.${objective.key}.level`, message: `niveau ${objective.level} inexistant` })
  }
  for (const level of levels) {
    for (const key of level.requiredObjectiveKeys) {
      if (!objectiveKeys.has(key)) issues.push({ path: `levels.${level.level}.requiredObjectiveKeys`, message: `objectif ${key} inexistant` })
    }
  }

  if (issues.length > 0) return { valid: false, issues }
  return { valid: true, configuration: { version, levels: [...levels].sort((a, b) => a.level - b.level), objectives }, issues: [] }
}

export function formatProgressionConfigurationIssues(issues: readonly ProgressionConfigurationIssue[]) {
  return issues.map(issue => `${issue.path || 'configuration'} : ${issue.message}`).join('\n')
}