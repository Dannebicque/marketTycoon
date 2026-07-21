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

export type EmployeeRoleKey = string
export interface EmployeeRoleDefinition {
  key: EmployeeRoleKey
  name: string
  description: string
  icon: string
  baseDailySalary: number
  qualityRange: [number, number]
  skills: string[]
  order: number
}

export type BuildingCategory = 'shelf' | 'checkout' | 'storage' | 'wall' | 'door'
export type BuildingKey = string

export interface BuildingToolbarDefinition { icon: string; order: number }
export interface EquipmentLayoutDefinition { columns: number; levels: number; compartmentType: CompartmentType }
export interface BaseBuildingDefinition {
  key: BuildingKey
  category: BuildingCategory
  name: string
  description: string
  width: number
  height: number
  price: number
  color: number
  renderer: string
  toolbar?: BuildingToolbarDefinition
}
export interface ShelfDefinition extends BaseBuildingDefinition {
  category: 'shelf'
  layout: EquipmentLayoutDefinition
  allowedProductCategories: ProductCategory[]
  refrigerated?: boolean
  frozen?: boolean
  electricityCostPerDay?: number
  customerPickupTimeMs: number
}
export interface StorageDefinition extends BaseBuildingDefinition {
  category: 'storage'
  storageType: StorageType
  capacity: number
  electricityCostPerDay?: number
}
export interface CheckoutDefinition extends BaseBuildingDefinition {
  category: 'checkout'
  scanTimePerArticleMs: number
  baseCheckoutTimeMs: number
  acceptedPayments: PaymentMethod[]
  maxBasketSize?: number
  requiresEmployee: boolean
  breakdownChance?: number
}
export interface WallDefinition extends BaseBuildingDefinition { category: 'wall' }
export interface DoorDefinition extends BaseBuildingDefinition { category: 'door' }
export type BuildingDefinition = ShelfDefinition | StorageDefinition | CheckoutDefinition | WallDefinition | DoorDefinition

export interface ProductCatalogReader {
  getProduct(key: string): ProductDefinition | undefined
  getProducts(): readonly ProductDefinition[]
}
export interface SupplierCatalogReader {
  getSupplier(key: string): SupplierDefinition | undefined
  getSuppliers(): readonly SupplierDefinition[]
}

export function defineBuilding<T extends BuildingDefinition>(definition: T): T { return definition }
export function defineProduct<T extends ProductDefinition>(definition: T): T { return definition }
export function defineEmployeeRole<T extends EmployeeRoleDefinition>(definition: T): T { return definition }
export function isShelfDefinition(definition: BuildingDefinition): definition is ShelfDefinition { return definition.category === 'shelf' }
export function isStorageDefinition(definition: BuildingDefinition): definition is StorageDefinition { return definition.category === 'storage' }
export function isCheckoutDefinition(definition: BuildingDefinition): definition is CheckoutDefinition { return definition.category === 'checkout' }
export function isEdgeDefinition(definition: BuildingDefinition): definition is WallDefinition | DoorDefinition { return definition.category === 'wall' || definition.category === 'door' }
export function getProductStorageType(product: ProductDefinition): StorageType {
  if (product.requiresFreezing) return 'frozen'
  if (product.requiresRefrigeration) return 'cold'
  return 'ambient'
}
