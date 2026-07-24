import {
  customerMemoryManager,
  type CustomerMemoryState,
  type CustomerProfile,
  type CustomerProfileKey,
} from '@market-tycoon/customers'
import { gameEvents } from '@market-tycoon/events'
import { CustomerVisitRegistry } from '@market-tycoon/simulation-engine'
import { storeReputationManager } from '@market-tycoon/economy'

export const CUSTOMER_MEMORY_STORAGE_KEY = 'market-tycoon.customer-memory.v1'

const activeMemories = new Map<string, string>()
let installed = false

export function installCustomerMemory() {
  if (installed) return
  installed = true
  restoreCustomerMemory()

  const originalStart = CustomerVisitRegistry.prototype.start
  CustomerVisitRegistry.prototype.start = function startRememberedVisit(customerId, options) {
    const allowedProfiles = options.profileKey ? [options.profileKey] : undefined
    const returning = shouldTryReturningCustomer()
      ? customerMemoryManager.selectReturning(options.day, allowedProfiles)
      : undefined
    const profileKey = returning?.profileKey ?? options.profileKey
    const customer = originalStart.call(this, customerId, { ...options, profileKey })
    const memory = returning ?? customerMemoryManager.create(customer.profile.profileKey, options.day)
    const visit = customerMemoryManager.beginVisit(memory.id, options.day)
    activeMemories.set(customerId, memory.id)
    applyMemoryToProfile(customer.profile, visit?.memory ?? memory, Boolean(visit?.returning))
    return customer
  }

  gameEvents.on('customer:visit-completed', event => {
    const memoryId = activeMemories.get(event.customerId)
    if (!memoryId) return
    customerMemoryManager.recordOutcome(memoryId, {
      day: event.day,
      satisfaction: event.satisfaction,
      spent: event.saleTotal,
      completed: true,
    })
    activeMemories.delete(event.customerId)
    persistCustomerMemory()
    dispatchUpdate()
  })

  gameEvents.on('customer:abandoned-visit', event => {
    const memoryId = activeMemories.get(event.customerId)
    if (!memoryId) return
    customerMemoryManager.recordOutcome(memoryId, {
      day: event.day,
      satisfaction: event.satisfaction,
      spent: 0,
      completed: false,
    })
    activeMemories.delete(event.customerId)
    persistCustomerMemory()
    dispatchUpdate()
  })

  window.addEventListener('beforeunload', persistCustomerMemory)
}

export function getCustomerMemorySnapshot(day = 1) {
  return {
    summary: customerMemoryManager.getSummary(day),
    customers: customerMemoryManager.getCustomers(12),
  }
}

export function persistCustomerMemory() {
  localStorage.setItem(CUSTOMER_MEMORY_STORAGE_KEY, JSON.stringify(customerMemoryManager.exportState()))
}

export function restoreCustomerMemory() {
  try {
    const raw = localStorage.getItem(CUSTOMER_MEMORY_STORAGE_KEY)
    customerMemoryManager.importState(raw ? JSON.parse(raw) as CustomerMemoryState : undefined)
  } catch {
    customerMemoryManager.importState()
  }
}

function shouldTryReturningCustomer() {
  const loyalty = storeReputationManager.getSnapshot().loyalty
  const known = customerMemoryManager.getSummary().knownCustomers
  if (!known) return false
  return Math.random() < Math.min(.72, .12 + loyalty / 125)
}

function applyMemoryToProfile(profile: CustomerProfile, memory: ReturnType<typeof customerMemoryManager.getCustomers>[number], returning: boolean) {
  if (!returning) return
  const affinity = memory.affinity / 100
  const trust = memory.trust / 100
  profile.loyalty = clamp(profile.loyalty * .55 + affinity * .45, 0, 1)
  profile.priceSensitivity = clamp(profile.priceSensitivity * (1.08 - trust * .16), .05, 1)
  profile.availableTimeMs = Math.round(profile.availableTimeMs * (1 + affinity * .18))
  profile.requirement = clamp(profile.requirement * (1.04 - trust * .08), .2, 1)
  profile.budget = roundMoney(profile.budget * (1 + affinity * .12 + (memory.preferredStore ? .08 : 0)))
}

function dispatchUpdate() {
  window.dispatchEvent(new CustomEvent('market-tycoon:customer-memory-updated', { detail: getCustomerMemorySnapshot() }))
  window.dispatchEvent(new CustomEvent('market-tycoon:influence-updated'))
}

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)) }
function roundMoney(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100 }
