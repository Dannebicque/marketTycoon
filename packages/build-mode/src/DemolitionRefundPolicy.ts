export type BuildDifficulty = 'relaxed' | 'standard' | 'hard' | 'expert'

export interface DemolitionRefundRule {
  difficulty: BuildDifficulty
  refundRate: number
}

const RULES: Record<BuildDifficulty, DemolitionRefundRule> = {
  relaxed: { difficulty: 'relaxed', refundRate: 1 },
  standard: { difficulty: 'standard', refundRate: .6 },
  hard: { difficulty: 'hard', refundRate: .35 },
  expert: { difficulty: 'expert', refundRate: 0 },
}

export class DemolitionRefundPolicy {
  constructor(private difficulty: BuildDifficulty = 'standard') {}

  get currentDifficulty() {
    return this.difficulty
  }

  get refundRate() {
    return RULES[this.difficulty].refundRate
  }

  setDifficulty(difficulty: BuildDifficulty) {
    this.difficulty = difficulty
  }

  calculate(purchasePrice: number) {
    return Math.max(0, Math.round(purchasePrice * this.refundRate))
  }
}

export function getDemolitionRefundRule(difficulty: BuildDifficulty) {
  return { ...RULES[difficulty] }
}
