import type { CustomerProfileKey } from './CustomerProfileCatalog'

export interface CustomerMemory {
  id: string
  profileKey: CustomerProfileKey
  firstVisitDay: number
  lastVisitDay: number
  visits: number
  completedVisits: number
  abandonedVisits: number
  averageSatisfaction: number
  totalSpent: number
  affinity: number
  trust: number
  preferredStore: boolean
}

export interface CustomerMemoryOutcome {
  day: number
  satisfaction: number
  spent: number
  completed: boolean
}

export interface CustomerMemoryState {
  nextCustomer?: number
  customers?: CustomerMemory[]
}

export interface CustomerMemorySummary {
  knownCustomers: number
  activeCustomers: number
  preferredCustomers: number
  averageAffinity: number
  returnRate: number
  visits: number
  returningVisits: number
}

export class CustomerMemoryManager {
  private customers = new Map<string, CustomerMemory>()
  private nextCustomer = 1
  private visits = 0
  private returningVisits = 0

  create(profileKey: CustomerProfileKey, day: number) {
    const memory: CustomerMemory = {
      id: `LOYAL-${this.nextCustomer++}`,
      profileKey,
      firstVisitDay: day,
      lastVisitDay: day,
      visits: 0,
      completedVisits: 0,
      abandonedVisits: 0,
      averageSatisfaction: 50,
      totalSpent: 0,
      affinity: 8,
      trust: 50,
      preferredStore: false,
    }
    this.customers.set(memory.id, memory)
    return { ...memory }
  }

  selectReturning(day: number, profileKeys?: CustomerProfileKey[]) {
    const eligible = [...this.customers.values()].filter(memory => {
      if (profileKeys?.length && !profileKeys.includes(memory.profileKey)) return false
      const daysSinceVisit = Math.max(1, day - memory.lastVisitDay)
      const recency = Math.max(.15, 1 - daysSinceVisit / 24)
      const returnChance = clamp((memory.affinity / 100) * .72 + (memory.trust / 100) * .18, .02, .82) * recency
      return Math.random() < returnChance
    })
    if (!eligible.length) return undefined
    const total = eligible.reduce((sum, item) => sum + Math.max(1, item.affinity), 0)
    let cursor = Math.random() * total
    for (const memory of eligible) {
      cursor -= Math.max(1, memory.affinity)
      if (cursor <= 0) return { ...memory }
    }
    return { ...eligible[eligible.length - 1] }
  }

  beginVisit(memoryId: string, day: number) {
    const memory = this.customers.get(memoryId)
    if (!memory) return undefined
    const returning = memory.visits > 0
    memory.visits += 1
    memory.lastVisitDay = day
    this.visits += 1
    if (returning) this.returningVisits += 1
    return { memory: { ...memory }, returning }
  }

  recordOutcome(memoryId: string, outcome: CustomerMemoryOutcome) {
    const memory = this.customers.get(memoryId)
    if (!memory) return undefined
    const previousOutcomes = memory.completedVisits + memory.abandonedVisits
    memory.averageSatisfaction = round((memory.averageSatisfaction * previousOutcomes + clamp(outcome.satisfaction, 0, 100)) / Math.max(1, previousOutcomes + 1))
    memory.totalSpent = roundMoney(memory.totalSpent + Math.max(0, outcome.spent))
    if (outcome.completed) memory.completedVisits += 1
    else memory.abandonedVisits += 1

    const satisfactionEffect = (outcome.satisfaction - 55) * .12
    const completionEffect = outcome.completed ? 4 + Math.min(4, outcome.spent / 25) : -10
    memory.affinity = clamp(round(memory.affinity + satisfactionEffect + completionEffect), 0, 100)
    memory.trust = clamp(round(memory.trust + (outcome.satisfaction - memory.trust) * .16 + (outcome.completed ? 1.5 : -4)), 0, 100)
    memory.preferredStore = memory.completedVisits >= 3 && memory.affinity >= 58 && memory.averageSatisfaction >= 68
    return { ...memory }
  }

  get(id: string) {
    const memory = this.customers.get(id)
    return memory ? { ...memory } : undefined
  }

  getSummary(day?: number): CustomerMemorySummary {
    const customers = [...this.customers.values()]
    const active = day === undefined ? customers : customers.filter(item => day - item.lastVisitDay <= 14)
    return {
      knownCustomers: customers.length,
      activeCustomers: active.length,
      preferredCustomers: customers.filter(item => item.preferredStore).length,
      averageAffinity: customers.length ? round(customers.reduce((sum, item) => sum + item.affinity, 0) / customers.length) : 0,
      returnRate: this.visits ? roundMultiplier(this.returningVisits / this.visits) : 0,
      visits: this.visits,
      returningVisits: this.returningVisits,
    }
  }

  getCustomers(limit = 50) {
    return [...this.customers.values()]
      .sort((a, b) => b.affinity - a.affinity || b.lastVisitDay - a.lastVisitDay)
      .slice(0, limit)
      .map(item => ({ ...item }))
  }

  exportState(): CustomerMemoryState {
    return { nextCustomer: this.nextCustomer, customers: this.getCustomers(Number.MAX_SAFE_INTEGER) }
  }

  importState(state?: CustomerMemoryState) {
    this.nextCustomer = Math.max(1, state?.nextCustomer ?? 1)
    this.customers = new Map((state?.customers ?? []).map(item => [item.id, {
      ...item,
      affinity: clamp(item.affinity ?? 8, 0, 100),
      trust: clamp(item.trust ?? 50, 0, 100),
      preferredStore: Boolean(item.preferredStore),
    }]))
    this.visits = [...this.customers.values()].reduce((sum, item) => sum + item.visits, 0)
    this.returningVisits = [...this.customers.values()].reduce((sum, item) => sum + Math.max(0, item.visits - 1), 0)
  }
}

export const customerMemoryManager = new CustomerMemoryManager()

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min)) }
function round(value: number) { return Math.round(value * 10) / 10 }
function roundMoney(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100 }
function roundMultiplier(value: number) { return Math.round((value + Number.EPSILON) * 1000) / 1000 }
