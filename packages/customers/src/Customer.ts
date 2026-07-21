import { CustomerBasket } from './CustomerBasket'
import { CustomerJourney } from './CustomerJourney'
import type { CustomerProfile, CustomerSnapshot } from './contracts'

export class Customer {
  readonly basket = new CustomerBasket()
  readonly journey = new CustomerJourney()
  private satisfaction = 100

  constructor(readonly profile: CustomerProfile) {}

  setSatisfaction(value: number) {
    this.satisfaction = Math.max(0, Math.min(100, Math.round(value)))
  }

  adjustSatisfaction(delta: number) {
    this.setSatisfaction(this.satisfaction + delta)
  }

  getSatisfaction() {
    return this.satisfaction
  }

  snapshot(): CustomerSnapshot {
    return {
      id: this.profile.id,
      state: this.journey.getState(),
      satisfaction: this.satisfaction,
      basket: this.basket.summarize(),
    }
  }
}
