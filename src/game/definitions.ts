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
  color: number
  capacities: Partial<Record<CompartmentType, number>>
  shelfLifeDays?: number
  requiresRefrigeration?: boolean
  requiresFreezing?: boolean
}

export type BuildingCategory = 'shelf' | 'checkout' | 'wall' | 'door'
export type BuildingKey = string

export interface BuildingToolbarDefinition {
  icon: string
  order: number
}

export interface EquipmentLayoutDefinition {
  columns: number
  levels: number
  compartmentType: CompartmentType
}

interface BaseBuildingDefinition {
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

export type BuildingDefinition = ShelfDefinition | CheckoutDefinition | WallDefinition | DoorDefinition

export function defineBuilding<T extends BuildingDefinition>(definition: T): T { return definition }
export function defineProduct<T extends ProductDefinition>(definition: T): T { return definition }

export function isShelfDefinition(definition: BuildingDefinition): definition is ShelfDefinition {
  return definition.category === 'shelf'
}

export function isCheckoutDefinition(definition: BuildingDefinition): definition is CheckoutDefinition {
  return definition.category === 'checkout'
}

export function isEdgeDefinition(definition: BuildingDefinition): definition is WallDefinition | DoorDefinition {
  return definition.category === 'wall' || definition.category === 'door'
}
