import type { MarketTycoonEvents } from '@market-tycoon/events'

export type ProgressionEventKey = keyof MarketTycoonEvents
export const PROGRESSION_METRICS = [
  'customers-entered',
  'customers-served',
  'customers-lost',
  'revenue',
  'buildings-placed',
  'employees-hired',
  'days-completed',
] as const
export type ProgressionMetric = typeof PROGRESSION_METRICS[number]

export interface ProgressionObjectiveDefinition {
  key: string
  title: string
  description: string
  metric: ProgressionMetric
  target: number
  level: number
}

export interface ProgressionLevelDefinition {
  level: number
  title: string
  description: string
  requiredObjectiveKeys: string[]
  unlockKeys?: string[]
}

export interface ProgressionConfiguration {
  version: number
  levels: ProgressionLevelDefinition[]
  objectives: ProgressionObjectiveDefinition[]
}

export interface ProgressionConfigurationIssue {
  path: string
  message: string
}

export interface ProgressionConfigurationResult {
  valid: boolean
  configuration?: ProgressionConfiguration
  issues: ProgressionConfigurationIssue[]
}

export interface ProgressionObjectiveState extends ProgressionObjectiveDefinition {
  value: number
  completed: boolean
  completedAt?: number
}

export interface ProgressionSnapshot {
  configurationVersion: number
  level: number
  metrics: Record<ProgressionMetric, number>
  completedObjectiveKeys: string[]
  unlockedKeys: string[]
}