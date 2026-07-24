import type { PaymentMethod, ProductCategory } from '@market-tycoon/catalog'

export type CustomerProfileKey = 'budget' | 'regular' | 'premium' | 'family' | 'hurried'

export interface CustomerProfileDefinition {
  key: CustomerProfileKey
  name: string
  budgetRange: readonly [number, number]
  priceSensitivityRange: readonly [number, number]
  availableTimeRangeMs: readonly [number, number]
  requirementRange: readonly [number, number]
  loyaltyRange: readonly [number, number]
  preferredPaymentMethods: readonly PaymentMethod[]
  preferredCategories: readonly ProductCategory[]
}

export const CUSTOMER_PROFILE_CATALOG: Record<CustomerProfileKey, CustomerProfileDefinition> = {
  budget: {
    key: 'budget', name: 'Économe', budgetRange: [18, 45], priceSensitivityRange: [0.8, 1],
    availableTimeRangeMs: [45_000, 90_000], requirementRange: [0.45, 0.7], loyaltyRange: [0.25, 0.55],
    preferredPaymentMethods: ['cash', 'card'], preferredCategories: ['grocery', 'vegetable', 'bakery'],
  },
  regular: {
    key: 'regular', name: 'Habitué', budgetRange: [30, 80], priceSensitivityRange: [0.45, 0.75],
    availableTimeRangeMs: [50_000, 110_000], requirementRange: [0.5, 0.75], loyaltyRange: [0.55, 0.85],
    preferredPaymentMethods: ['contactless', 'card'], preferredCategories: ['grocery', 'fresh', 'drink'],
  },
  premium: {
    key: 'premium', name: 'Premium', budgetRange: [70, 180], priceSensitivityRange: [0.15, 0.45],
    availableTimeRangeMs: [60_000, 130_000], requirementRange: [0.75, 1], loyaltyRange: [0.35, 0.7],
    preferredPaymentMethods: ['contactless', 'card'], preferredCategories: ['fresh', 'fruit', 'bakery'],
  },
  family: {
    key: 'family', name: 'Famille', budgetRange: [55, 140], priceSensitivityRange: [0.5, 0.85],
    availableTimeRangeMs: [80_000, 160_000], requirementRange: [0.55, 0.8], loyaltyRange: [0.45, 0.8],
    preferredPaymentMethods: ['card', 'contactless'], preferredCategories: ['grocery', 'fresh', 'hygiene', 'frozen'],
  },
  hurried: {
    key: 'hurried', name: 'Pressé', budgetRange: [20, 65], priceSensitivityRange: [0.3, 0.65],
    availableTimeRangeMs: [18_000, 45_000], requirementRange: [0.55, 0.85], loyaltyRange: [0.15, 0.45],
    preferredPaymentMethods: ['contactless'], preferredCategories: ['bakery', 'drink', 'fresh'],
  },
}
