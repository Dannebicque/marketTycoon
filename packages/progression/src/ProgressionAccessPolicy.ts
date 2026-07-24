import type { ProgressionManager } from './ProgressionManager'

export type ProgressionAvailability = 'available' | 'locked-visible' | 'hidden'

export interface ProgressionUnlockable {
  requiredUnlockKey?: string
  unlockVisibility?: Exclude<ProgressionAvailability, 'available'>
}

export class ProgressionAccessPolicy {
  constructor(private readonly progression: ProgressionManager) {}

  isAccessible(definition?: ProgressionUnlockable | null): boolean {
    return !definition?.requiredUnlockKey || this.progression.isUnlocked(definition.requiredUnlockKey)
  }

  getAvailability(definition?: ProgressionUnlockable | null): ProgressionAvailability {
    if (this.isAccessible(definition)) return 'available'
    return definition?.unlockVisibility ?? 'locked-visible'
  }

  isVisible(definition?: ProgressionUnlockable | null): boolean {
    return this.getAvailability(definition) !== 'hidden'
  }

  getMissingUnlockKey(definition?: ProgressionUnlockable | null): string | null {
    return this.isAccessible(definition) ? null : definition?.requiredUnlockKey ?? null
  }
}
