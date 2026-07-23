import { customerVisitAnalytics, type CustomerAbandonReason } from '@market-tycoon/analytics'
import { Customer, createCustomerProfile, type CustomerProfileKey } from '@market-tycoon/customers'
import type { PaymentMethod } from '@market-tycoon/catalog'
import { gameEvents, type CustomerAbandonReason as EventCustomerAbandonReason } from '@market-tycoon/events'

export interface StartCustomerVisitOptions {
  day: number
  profileKey?: CustomerProfileKey
  startedAt?: number
}

export interface CompleteCustomerVisitOptions {
  paymentMethod: PaymentMethod
  queueTimeMs: number
  completedAt?: number
}

export interface AbandonCustomerVisitOptions {
  reason: CustomerAbandonReason
  queueTimeMs?: number
  completedAt?: number
}

interface ActiveVisit {
  customer: Customer
  day: number
  startedAt: number
}

export class CustomerVisitRegistry {
  private readonly active = new Map<string, ActiveVisit>()

  constructor(readonly analytics = customerVisitAnalytics) {}

  start(customerId: string, options: StartCustomerVisitOptions) {
    const customer = new Customer(createCustomerProfile(customerId, { profileKey: options.profileKey }))
    const startedAt = options.startedAt ?? Date.now()
    this.active.set(customerId, { customer, day: options.day, startedAt })
    this.analytics.start({ day: options.day, customerId, profile: customer.profile, startedAt })
    gameEvents.emit('customer:entered-store', {
      day: options.day,
      customerId,
      profileKey: customer.profile.profileKey,
      budget: customer.profile.budget,
      occurredAt: startedAt,
    })
    return customer
  }

  get(customerId: string) { return this.active.get(customerId)?.customer }
  getActiveCustomers() { return [...this.active.values()].map(visit => visit.customer) }

  complete(customerId: string, options: CompleteCustomerVisitOptions) {
    const visit = this.active.get(customerId)
    if (!visit) return null
    const { customer, day, startedAt } = visit
    const basket = customer.basket.summarize()
    const report = customer.getSatisfactionReport()
    const completedAt = options.completedAt ?? Date.now()
    this.active.delete(customerId)
    const observation = this.analytics.complete(customerId, {
      articleCount: basket.articleCount,
      saleTotal: basket.saleTotal,
      paymentMethod: options.paymentMethod,
      queueTimeMs: options.queueTimeMs,
      satisfaction: { ...report.breakdown, overall: report.overall, report },
      completedAt,
    })
    gameEvents.emit('customer:visit-completed', {
      day,
      customerId,
      articleCount: basket.articleCount,
      saleTotal: basket.saleTotal,
      paymentMethod: options.paymentMethod,
      queueTimeMs: options.queueTimeMs,
      satisfaction: report.overall,
      visitDurationMs: Math.max(0, completedAt - startedAt),
    })
    return observation
  }

  abandon(customerId: string, options: AbandonCustomerVisitOptions) {
    const visit = this.active.get(customerId)
    if (!visit) return null
    const { customer, day, startedAt } = visit
    const basket = customer.basket.summarize()
    const report = customer.getSatisfactionReport()
    const completedAt = options.completedAt ?? Date.now()
    const queueTimeMs = options.queueTimeMs ?? 0
    this.active.delete(customerId)
    const observation = this.analytics.abandon(customerId, {
      reason: options.reason,
      articleCount: basket.articleCount,
      potentialSaleTotal: basket.saleTotal,
      queueTimeMs,
      satisfaction: { ...report.breakdown, overall: report.overall, report },
      completedAt,
    })
    gameEvents.emit('customer:abandoned-visit', {
      day,
      customerId,
      reason: options.reason as EventCustomerAbandonReason,
      articleCount: basket.articleCount,
      potentialSaleTotal: basket.saleTotal,
      queueTimeMs,
      satisfaction: report.overall,
      visitDurationMs: Math.max(0, completedAt - startedAt),
    })
    return observation
  }
}
