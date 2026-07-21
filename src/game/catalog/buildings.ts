import type { BuildingDefinition } from '../definitions'

export const BUILDING_CATALOG = {
  standardShelf: {
    key: 'standard-shelf', category: 'shelf', name: 'Rayon standard',
    description: 'Rayon polyvalent pour épicerie, boissons et hygiène.',
    width: 1, height: 3, price: 100, color: 0xb07a4f, renderer: 'standard-shelf',
    capacity: 24, allowedProductCategories: ['grocery', 'drink', 'hygiene'],
    customerPickupTimeMs: 650,
  },
  fruitShelf: {
    key: 'fruit-shelf', category: 'shelf', name: 'Fruits et légumes',
    description: 'Présentoir ouvert pour produits frais non réfrigérés.',
    width: 2, height: 2, price: 180, color: 0x84cc16, renderer: 'fruit-shelf',
    capacity: 36, allowedProductCategories: ['fruit', 'vegetable'],
    customerPickupTimeMs: 850,
  },
  refrigeratedShelf: {
    key: 'refrigerated-shelf', category: 'shelf', name: 'Rayon réfrigéré',
    description: 'Meuble froid pour yaourts, fromages et produits frais.',
    width: 1, height: 3, price: 320, color: 0x22c55e, renderer: 'refrigerated-shelf',
    capacity: 30, allowedProductCategories: ['fresh'], refrigerated: true,
    electricityCostPerDay: 12, customerPickupTimeMs: 900,
  },
  freezer: {
    key: 'freezer', category: 'shelf', name: 'Congélateur',
    description: 'Meuble de vente pour produits surgelés.',
    width: 1, height: 3, price: 450, color: 0x38bdf8, renderer: 'freezer',
    capacity: 30, allowedProductCategories: ['frozen'], refrigerated: true, frozen: true,
    electricityCostPerDay: 18, customerPickupTimeMs: 1100,
  },
  bakeryShelf: {
    key: 'bakery-shelf', category: 'shelf', name: 'Boulangerie',
    description: 'Présentoir dédié au pain et aux produits de boulangerie.',
    width: 2, height: 1, price: 220, color: 0xc08457, renderer: 'bakery-shelf',
    capacity: 20, allowedProductCategories: ['bakery'], customerPickupTimeMs: 700,
  },
  standardCheckout: {
    key: 'standard-checkout', category: 'checkout', name: 'Caisse classique',
    description: 'Caisse avec employé, rapide et compatible avec tous les paiements.',
    width: 1, height: 2, price: 300, color: 0x2563eb, renderer: 'standard-checkout',
    scanTimePerArticleMs: 500, baseCheckoutTimeMs: 1200,
    acceptedPayments: ['contactless', 'card', 'cash'], requiresEmployee: true,
  },
  selfCheckout: {
    key: 'self-checkout', category: 'checkout', name: 'Caisse automatique',
    description: 'Caisse compacte sans employé, réservée aux petits paniers.',
    width: 1, height: 1, price: 550, color: 0x06b6d4, renderer: 'self-checkout',
    scanTimePerArticleMs: 700, baseCheckoutTimeMs: 1800,
    acceptedPayments: ['contactless', 'card'], maxBasketSize: 12,
    requiresEmployee: false, breakdownChance: .12,
  },
  expressCheckout: {
    key: 'express-checkout', category: 'checkout', name: 'Caisse express',
    description: 'Caisse très rapide limitée à dix articles.',
    width: 1, height: 1, price: 420, color: 0xf59e0b, renderer: 'express-checkout',
    scanTimePerArticleMs: 350, baseCheckoutTimeMs: 900,
    acceptedPayments: ['contactless', 'card', 'cash'], maxBasketSize: 10,
    requiresEmployee: true,
  },
  wall: {
    key: 'wall', category: 'wall', name: 'Mur', description: 'Délimite les allées et bloque les déplacements.',
    width: 1, height: 1, price: 20, color: 0xcbd5e1, renderer: 'wall',
  },
  door: {
    key: 'door', category: 'door', name: 'Porte', description: 'Crée un passage dans un mur.',
    width: 1, height: 1, price: 150, color: 0x7c3aed, renderer: 'door',
  },
} satisfies Record<string, BuildingDefinition>

export type BuildingCatalogKey = keyof typeof BUILDING_CATALOG
export const BUILDINGS: BuildingDefinition[] = Object.values(BUILDING_CATALOG)
export const SHELF_BUILDINGS = BUILDINGS.filter(item => item.category === 'shelf')
export const CHECKOUT_BUILDINGS = BUILDINGS.filter(item => item.category === 'checkout')

export function getBuildingDefinition(key: string): BuildingDefinition | undefined {
  return BUILDINGS.find(item => item.key === key)
}
