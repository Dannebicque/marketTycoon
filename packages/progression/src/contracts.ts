import type { MarketTycoonEvents } from '@market-tycoon/events'

export type ProgressionEventKey = keyof MarketTycoonEvents
export type ProgressionMetric =
  | 'customers-entered'
  | 'customers-served'
  | 'customers-lost'
  | 'revenue'
  | 'buildings-placed'
  | 'employees-hired'
  | 'days-completed'

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

export interface ProgressionObjectiveState extends ProgressionObjectiveDefinition {
  value: number
  completed: boolean
  completedAt?: number
}

export interface ProgressionSnapshot {
  level: number
  metrics: Record<ProgressionMetric, number>
  completedObjectiveKeys: string[]
  unlockedKeys: string[]
}
