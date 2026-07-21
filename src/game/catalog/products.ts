import type { ProductCategory, ProductDefinition } from '../definitions'

interface ProductModule {
  default: ProductDefinition
}

const modules = import.meta.glob<ProductModule>('./products/**/*.product.ts', { eager: true })

function validateProduct(product: ProductDefinition, filename: string) {
  if (!product?.key?.trim()) throw new Error(`${filename} : clé de produit manquante.`)
  if (!product.name?.trim()) throw new Error(`${product.key} : nom manquant.`)
  if (!product.shortName?.trim()) throw new Error(`${product.key} : nom court manquant.`)
  if (product.purchasePrice < 0 || product.salePrice < 0) throw new Error(`${product.key} : prix négatif.`)
  if (product.requiresFreezing && product.requiresRefrigeration) {
    throw new Error(`${product.key} : un produit ne peut pas demander simultanément réfrigération et congélation.`)
  }
  if (product.salePrice < product.purchasePrice) console.warn(`${product.key} est vendu à perte.`)
}

const catalog = new Map<string, ProductDefinition>()

for (const [filename, module] of Object.entries(modules)) {
  const product = module.default
  validateProduct(product, filename)
  if (catalog.has(product.key)) throw new Error(`Clé de produit dupliquée : ${product.key}`)
  catalog.set(product.key, product)
}

export const PRODUCT_CATALOG: ReadonlyMap<string, ProductDefinition> = catalog
export const PRODUCTS: ProductDefinition[] = [...catalog.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'))

export function getProductDefinition(key: string): ProductDefinition | undefined {
  return PRODUCT_CATALOG.get(key)
}

export function getProductsForCategories(categories: ProductCategory[]) {
  return PRODUCTS.filter(product => categories.includes(product.category))
}
