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

export interface ProductDefinition {
  key: string
  category: ProductCategory
  name: string
  shortName: string
  salePrice: number
  purchasePrice: number
  color: number
  shelfLifeDays?: number
  requiresRefrigeration?: boolean
  requiresFreezing?: boolean
}

export type BuildingCategory = 'shelf' | 'checkout' | 'wall' | 'door'
export type BuildingKey =
  | 'standard-shelf'
  | 'fruit-shelf'
  | 'refrigerated-shelf'
  | 'freezer'
  | 'bakery-shelf'
  | 'standard-checkout'
  | 'self-checkout'
  | 'express-checkout'
  | 'wall'
  | 'door'

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
}

export interface ShelfDefinition extends BaseBuildingDefinition {
  category: 'shelf'
  capacity: number
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

export interface WallDefinition extends BaseBuildingDefinition {
  category: 'wall'
}

export interface DoorDefinition extends BaseBuildingDefinition {
  category: 'door'
}

export type BuildingDefinition =
  | ShelfDefinition
  | CheckoutDefinition
  | WallDefinition
  | DoorDefinition

export function isShelfDefinition(definition: BuildingDefinition): definition is ShelfDefinition {
  return definition.category === 'shelf'
}

export function isCheckoutDefinition(definition: BuildingDefinition): definition is CheckoutDefinition {
  return definition.category === 'checkout'
}

export function isEdgeDefinition(definition: BuildingDefinition): definition is WallDefinition | DoorDefinition {
  return definition.category === 'wall' || definition.category === 'door'
}
