import type {
  CustomerSatisfactionBreakdown,
  CustomerSatisfactionDriver,
  CustomerSatisfactionFactor,
  CustomerSatisfactionReport,
} from './contracts'

const defaultBreakdown: CustomerSatisfactionBreakdown = {
  price: 100,
  queue: 100,
  availability: 100,
  checkout: 100,
}

const factors: CustomerSatisfactionFactor[] = ['price', 'queue', 'availability', 'checkout']

export class CustomerSatisfaction {
  private readonly breakdown: CustomerSatisfactionBreakdown = { ...defaultBreakdown }

  set(factor: CustomerSatisfactionFactor, value: number) {
    this.breakdown[factor] = clamp(value)
  }

  adjust(factor: CustomerSatisfactionFactor, delta: number) {
    this.set(factor, this.breakdown[factor] + delta)
  }

  get(factor: CustomerSatisfactionFactor) {
    return this.breakdown[factor]
  }

  getBreakdown(): CustomerSatisfactionBreakdown {
    return { ...this.breakdown }
  }

  getOverall() {
    const values = Object.values(this.breakdown)
    return Math.round(values.reduce((total, value) => total + value, 0) / values.length)
  }

  getReport(requirement = .5): CustomerSatisfactionReport {
    const expectedScore = clamp(55 + clampRatio(requirement) * 35)
    const drivers = factors
      .map(factor => createDriver(factor, this.breakdown[factor], expectedScore))
      .sort((a, b) => Math.abs(b.deltaFromExpectation) - Math.abs(a.deltaFromExpectation))
    const positive = drivers.filter(driver => driver.impact === 'positive').sort((a, b) => b.deltaFromExpectation - a.deltaFromExpectation)[0]
    const negative = drivers.filter(driver => driver.impact === 'negative').sort((a, b) => a.deltaFromExpectation - b.deltaFromExpectation)[0]

    return {
      overall: this.getOverall(),
      expectedScore,
      breakdown: this.getBreakdown(),
      drivers,
      strongestPositive: positive ? { ...positive } : undefined,
      strongestNegative: negative ? { ...negative } : undefined,
    }
  }
}

function createDriver(
  factor: CustomerSatisfactionFactor,
  score: number,
  expectedScore: number,
): CustomerSatisfactionDriver {
  const deltaFromExpectation = score - expectedScore
  return {
    factor,
    score,
    deltaFromExpectation,
    impact: deltaFromExpectation >= 8 ? 'positive' : deltaFromExpectation <= -8 ? 'negative' : 'neutral',
  }
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function clampRatio(value: number) {
  return Math.max(0, Math.min(1, value))
}
