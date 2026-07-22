import { gameEvents } from '@market-tycoon/events'
import type { ProgressionLevelDefinition, ProgressionMetric, ProgressionObjectiveDefinition, ProgressionObjectiveState, ProgressionSnapshot } from './contracts'
import { DEFAULT_PROGRESSION_LEVELS, DEFAULT_PROGRESSION_OBJECTIVES } from './defaultProgression'

const EMPTY_METRICS: Record<ProgressionMetric, number> = {
  'customers-entered': 0,
  'customers-served': 0,
  'customers-lost': 0,
  revenue: 0,
  'buildings-placed': 0,
  'employees-hired': 0,
  'days-completed': 0,
}

export class ProgressionManager {
  private readonly metrics = { ...EMPTY_METRICS }
  private readonly completedObjectiveKeys = new Set<string>()
  private readonly unlockedKeys = new Set<string>()
  private readonly unsubscribe: Array<() => void> = []
  private level = 1

  constructor(
    private readonly objectives: readonly ProgressionObjectiveDefinition[] = DEFAULT_PROGRESSION_OBJECTIVES,
    private readonly levels: readonly ProgressionLevelDefinition[] = DEFAULT_PROGRESSION_LEVELS,
  ) {
    this.installEventListeners()
    this.recalculate()
  }

  private installEventListeners() {
    this.unsubscribe.push(
      gameEvents.on('customer:entered-store', () => this.increment('customers-entered', 1)),
      gameEvents.on('customer:visit-completed', event => {
        this.increment('customers-served', 1)
        this.increment('revenue', event.saleTotal)
      }),
      gameEvents.on('customer:abandoned-visit', () => this.increment('customers-lost', 1)),
      gameEvents.on('building:placed', () => this.increment('buildings-placed', 1)),
      gameEvents.on('employee:hired', () => this.increment('employees-hired', 1)),
      gameEvents.on('store:day-closed', () => this.increment('days-completed', 1)),
    )
  }

  private increment(metric: ProgressionMetric, amount: number) {
    this.metrics[metric] = Math.max(0, this.metrics[metric] + amount)
    this.recalculate()
  }

  private recalculate() {
    for (const objective of this.objectives) {
      if (this.metrics[objective.metric] >= objective.target) this.completedObjectiveKeys.add(objective.key)
    }

    let nextLevel = 1
    for (const level of [...this.levels].sort((a, b) => a.level - b.level)) {
      if (level.requiredObjectiveKeys.every(key => this.completedObjectiveKeys.has(key))) nextLevel = level.level
    }
    this.level = nextLevel

    this.unlockedKeys.clear()
    for (const level of this.levels) {
      if (level.level <= this.level) for (const key of level.unlockKeys ?? []) this.unlockedKeys.add(key)
    }
  }

  getLevel() { return this.level }
  getLevelDefinition() { return this.levels.find(level => level.level === this.level) }
  isUnlocked(key?: string) { return !key || this.unlockedKeys.has(key) }
  getUnlockedKeys() { return [...this.unlockedKeys] }

  getObjectives(): ProgressionObjectiveState[] {
    return this.objectives.map(objective => ({
      ...objective,
      value: Math.min(objective.target, this.metrics[objective.metric]),
      completed: this.completedObjectiveKeys.has(objective.key),
    }))
  }

  snapshot(): ProgressionSnapshot {
    return {
      level: this.level,
      metrics: { ...this.metrics },
      completedObjectiveKeys: [...this.completedObjectiveKeys],
      unlockedKeys: [...this.unlockedKeys],
    }
  }

  restore(snapshot: ProgressionSnapshot) {
    Object.assign(this.metrics, EMPTY_METRICS, snapshot.metrics)
    this.completedObjectiveKeys.clear()
    snapshot.completedObjectiveKeys.forEach(key => this.completedObjectiveKeys.add(key))
    this.recalculate()
  }

  destroy() {
    this.unsubscribe.splice(0).forEach(unsubscribe => unsubscribe())
  }
}
