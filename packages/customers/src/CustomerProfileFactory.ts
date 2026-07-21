import { CUSTOMER_PROFILE_CATALOG, type CustomerProfileDefinition, type CustomerProfileKey } from './CustomerProfileCatalog'
import type { CustomerProfile } from './contracts'

export interface CustomerProfileFactoryOptions {
  profileKey?: CustomerProfileKey
  random?: () => number
}

export function createCustomerProfile(
  id: string,
  options: CustomerProfileFactoryOptions = {},
): CustomerProfile {
  const random = options.random ?? Math.random
  const definition = options.profileKey
    ? CUSTOMER_PROFILE_CATALOG[options.profileKey]
    : chooseDefinition(random)

  return {
    id,
    profileKey: definition.key,
    budget: randomBetween(definition.budgetRange, random),
    priceSensitivity: randomBetween(definition.priceSensitivityRange, random),
    availableTimeMs: Math.round(randomBetween(definition.availableTimeRangeMs, random)),
    requirement: randomBetween(definition.requirementRange, random),
    loyalty: randomBetween(definition.loyaltyRange, random),
    preferredPaymentMethod: chooseOne(definition.preferredPaymentMethods, random),
    preferredCategories: [...definition.preferredCategories],
  }
}

function chooseDefinition(random: () => number): CustomerProfileDefinition {
  const definitions = Object.values(CUSTOMER_PROFILE_CATALOG)
  return definitions[Math.min(definitions.length - 1, Math.floor(random() * definitions.length))]
}

function chooseOne<T>(values: readonly T[], random: () => number): T {
  return values[Math.min(values.length - 1, Math.floor(random() * values.length))]
}

function randomBetween(range: readonly [number, number], random: () => number) {
  return range[0] + (range[1] - range[0]) * random()
}
