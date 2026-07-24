import type { CustomerJourneyState } from './contracts'

const allowedTransitions: Record<CustomerJourneyState, CustomerJourneyState[]> = {
  entering: ['shopping', 'abandoned'],
  shopping: ['queueing', 'leaving', 'abandoned'],
  queueing: ['checkout', 'abandoned'],
  checkout: ['leaving', 'completed', 'abandoned'],
  leaving: ['completed'],
  abandoned: [],
  completed: [],
}

export class CustomerJourney {
  constructor(private state: CustomerJourneyState = 'entering') {}

  getState() {
    return this.state
  }

  transitionTo(next: CustomerJourneyState) {
    if (!allowedTransitions[this.state].includes(next)) {
      throw new Error(`Invalid customer journey transition: ${this.state} -> ${next}`)
    }
    this.state = next
  }
}
