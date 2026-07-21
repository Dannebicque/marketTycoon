import type { CustomerSatisfactionBreakdown, CustomerSatisfactionFactor } from './contracts'

const defaultBreakdown: CustomerSatisfactionBreakdown = {
  price: 100,
  queue: 100,
  availability: 100,
  checkout: 100,
}

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
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}
