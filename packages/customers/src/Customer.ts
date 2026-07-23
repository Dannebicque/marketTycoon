import { CustomerBasket } from './CustomerBasket'
import { CustomerJourney } from './CustomerJourney'
import { CustomerSatisfaction } from './CustomerSatisfaction'
import type { CustomerProfile, CustomerSatisfactionFactor, CustomerSnapshot } from './contracts'

export class Customer {
  readonly basket = new CustomerBasket()
  readonly journey = new CustomerJourney()
  readonly satisfaction = new CustomerSatisfaction()

  constructor(readonly profile: CustomerProfile) {}

  setSatisfaction(value: number) {
    for (const factor of ['price', 'queue', 'availability', 'checkout'] as CustomerSatisfactionFactor[]) {
      this.satisfaction.set(factor, value)
    }
  }

  adjustSatisfaction(delta: number) {
    for (const factor of ['price', 'queue', 'availability', 'checkout'] as CustomerSatisfactionFactor[]) {
      this.satisfaction.adjust(factor, delta)
    }
  }

  getSatisfaction() {
    return this.satisfaction.getOverall()
  }

  getSatisfactionReport() {
    return this.satisfaction.getReport(this.profile.requirement)
  }

  getRemainingBudget() {
    return Math.max(0, this.profile.budget - this.basket.summarize().saleTotal)
  }

  snapshot(): CustomerSnapshot {
    return {
      id: this.profile.id,
      profile: { ...this.profile, preferredCategories: [...this.profile.preferredCategories] },
      state: this.journey.getState(),
      satisfaction: this.satisfaction.getOverall(),
      satisfactionBreakdown: this.satisfaction.getBreakdown(),
      satisfactionReport: this.getSatisfactionReport(),
      basket: this.basket.summarize(),
    }
  }
}
