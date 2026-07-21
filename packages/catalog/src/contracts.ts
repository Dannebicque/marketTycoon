export type PaymentMethod = 'contactless' | 'card' | 'cash'

export type ProductCategory =
  | 'grocery'
  | 'fruit'
  | 'vegetable'
  | 'fresh'
  | 'drink'
  | 'hygiene'
  | 'frozen'
  | 'bakery'

export type StorageType = 'ambient' | 'cold' | 'frozen'

export type CompartmentType =
  | 'standard-shelf'
  | 'fruit-bin'
  | 'refrigerated-shelf'
  | 'freezer-shelf'
  | 'bakery-display'

export interface ProductDefinition {
  key: string
  category: ProductCategory
  name: string
  shortName: string
  salePrice: number
  purchasePrice: number
  marketPrice?: number
  priceSensitivity?: number
  color: number
  capacities: Partial<Record<CompartmentType, number>>
  shelfLifeDays?: number
  requiresRefrigeration?: boolean
  requiresFreezing?: boolean
}

export interface SupplierDefinition {
  key: string
  name: string
  leadTimeDays: number
  deliveryFee: number
  minimumOrderAmount: number
  priceMultiplier: number
  productKeys: string[]
}

export interface StorageDefinition {
  category: 'storage'
  storageType: StorageType
  capacity: number
}

export interface ProductCatalogReader {
  getProduct(key: string): ProductDefinition | undefined
  getProducts(): readonly ProductDefinition[]
}

export interface SupplierCatalogReader {
  getSupplier(key: string): SupplierDefinition | undefined
  getSuppliers(): readonly SupplierDefinition[]
}
