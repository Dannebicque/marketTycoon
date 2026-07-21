import { CustomerVisitAnalyticsManager, type CustomerAbandonReason } from '@market-tycoon/analytics'
import { Customer, createCustomerProfile, type CustomerProfileKey } from '@market-tycoon/customers'
import type { PaymentMethod } from '@market-tycoon/catalog'

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

export class CustomerVisitRegistry {
  private readonly active = new Map<string, Customer>()

  constructor(readonly analytics = new CustomerVisitAnalyticsManager()) {}

  start(customerId: string, options: StartCustomerVisitOptions) {
    const customer = new Customer(createCustomerProfile(customerId, { profileKey: options.profileKey }))
    this.active.set(customerId, customer)
    this.analytics.start({ day: options.day, customerId, profile: customer.profile, startedAt: options.startedAt })
    return customer
  }

  get(customerId: string) {
    return this.active.get(customerId)
  }

  getActiveCustomers() {
    return [...this.active.values()]
  }

  complete(customerId: string, options: CompleteCustomerVisitOptions) {
    const customer = this.active.get(customerId)
    if (!customer) return null
    const basket = customer.basket.summarize()
    const satisfaction = customer.satisfaction.getBreakdown()
    this.active.delete(customerId)
    return this.analytics.complete(customerId, {
      articleCount: basket.articleCount,
      saleTotal: basket.saleTotal,
      paymentMethod: options.paymentMethod,
      queueTimeMs: options.queueTimeMs,
      satisfaction: { ...satisfaction, overall: customer.satisfaction.getOverall() },
      completedAt: options.completedAt,
    })
  }

  abandon(customerId: string, options: AbandonCustomerVisitOptions) {
    const customer = this.active.get(customerId)
    if (!customer) return null
    const basket = customer.basket.summarize()
    const satisfaction = customer.satisfaction.getBreakdown()
    this.active.delete(customerId)
    return this.analytics.abandon(customerId, {
      reason: options.reason,
      articleCount: basket.articleCount,
      potentialSaleTotal: basket.saleTotal,
      queueTimeMs: options.queueTimeMs ?? 0,
      satisfaction: { ...satisfaction, overall: customer.satisfaction.getOverall() },
      completedAt: options.completedAt,
    })
  }
}
