import type { SupplierDefinition } from '../contracts'
import { PRODUCTS } from './products'

export const SUPPLIERS: SupplierDefinition[] = [
  {
    key: 'metro-market',
    name: 'Metro Market',
    leadTimeDays: 1,
    deliveryFee: 45,
    minimumOrderAmount: 120,
    priceMultiplier: 1,
    productKeys: PRODUCTS.map(product => product.key),
  },
  {
    key: 'eco-wholesale',
    name: 'Eco Wholesale',
    leadTimeDays: 2,
    deliveryFee: 25,
    minimumOrderAmount: 200,
    priceMultiplier: .92,
    productKeys: PRODUCTS.filter(product => !product.requiresFreezing).map(product => product.key),
  },
  {
    key: 'fresh-logistics',
    name: 'Fresh Logistics',
    leadTimeDays: 1,
    deliveryFee: 60,
    minimumOrderAmount: 100,
    priceMultiplier: 1.08,
    productKeys: PRODUCTS.filter(product => product.requiresRefrigeration || product.requiresFreezing).map(product => product.key),
  },
]

export function getSupplier(key: string) {
  return SUPPLIERS.find(supplier => supplier.key === key)
}
