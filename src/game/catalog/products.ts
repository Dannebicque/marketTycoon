import type { ProductDefinition } from '../definitions'

export const PRODUCT_CATALOG = {
  pasta: {
    key: 'pasta', category: 'grocery', name: 'Pâtes', shortName: 'PÂTES',
    salePrice: 3.5, purchasePrice: 1.4, color: 0xd6a75f,
  },
  cannedFood: {
    key: 'canned-food', category: 'grocery', name: 'Conserves', shortName: 'CONS',
    salePrice: 4.5, purchasePrice: 2.1, color: 0xb07a4f,
  },
  apple: {
    key: 'apple', category: 'fruit', name: 'Pommes', shortName: 'POM',
    salePrice: 3, purchasePrice: 1.3, color: 0xef4444, shelfLifeDays: 5,
  },
  banana: {
    key: 'banana', category: 'fruit', name: 'Bananes', shortName: 'BAN',
    salePrice: 2.8, purchasePrice: 1.1, color: 0xfacc15, shelfLifeDays: 4,
  },
  tomato: {
    key: 'tomato', category: 'vegetable', name: 'Tomates', shortName: 'TOM',
    salePrice: 4, purchasePrice: 1.8, color: 0xdc2626, shelfLifeDays: 4,
  },
  yogurt: {
    key: 'yogurt', category: 'fresh', name: 'Yaourts', shortName: 'YAO',
    salePrice: 5, purchasePrice: 2.7, color: 0x22c55e, shelfLifeDays: 8, requiresRefrigeration: true,
  },
  cheese: {
    key: 'cheese', category: 'fresh', name: 'Fromage', shortName: 'FROM',
    salePrice: 7.5, purchasePrice: 4.2, color: 0xfbbf24, shelfLifeDays: 10, requiresRefrigeration: true,
  },
  water: {
    key: 'water', category: 'drink', name: 'Eau', shortName: 'EAU',
    salePrice: 2, purchasePrice: .7, color: 0x38bdf8,
  },
  soda: {
    key: 'soda', category: 'drink', name: 'Sodas', shortName: 'SODA',
    salePrice: 4, purchasePrice: 1.8, color: 0x0ea5e9,
  },
  shampoo: {
    key: 'shampoo', category: 'hygiene', name: 'Shampoing', shortName: 'SHAM',
    salePrice: 9, purchasePrice: 4.5, color: 0xa855f7,
  },
  frozenPizza: {
    key: 'frozen-pizza', category: 'frozen', name: 'Pizza surgelée', shortName: 'PIZZ',
    salePrice: 7, purchasePrice: 3.8, color: 0x60a5fa, requiresFreezing: true,
  },
  iceCream: {
    key: 'ice-cream', category: 'frozen', name: 'Glaces', shortName: 'GLACE',
    salePrice: 6, purchasePrice: 3, color: 0xf9a8d4, requiresFreezing: true,
  },
  bread: {
    key: 'bread', category: 'bakery', name: 'Pain', shortName: 'PAIN',
    salePrice: 2.5, purchasePrice: .8, color: 0xc08457, shelfLifeDays: 2,
  },
} satisfies Record<string, ProductDefinition>

export const PRODUCTS: ProductDefinition[] = Object.values(PRODUCT_CATALOG)

export function getProductsForCategories(categories: ProductDefinition['category'][]) {
  return PRODUCTS.filter(product => categories.includes(product.category))
}
