import type { ProductDefinition, ShelfDefinition } from '@market-tycoon/catalog'

export interface EquipmentCompartmentState {
  id: string
  column: number
  level: number
  productKey: string | null
  quantity: number
  capacity: number
  averageUnitCost?: number
}

export interface EquipmentInventoryState {
  buildingId: string
  definitionKey: string
  compartments: EquipmentCompartmentState[]
}

export function createEquipmentInventory(buildingId: string, definition: ShelfDefinition): EquipmentInventoryState {
  const compartments: EquipmentCompartmentState[] = []
  for (let column = 0; column < definition.layout.columns; column++) {
    for (let level = 0; level < definition.layout.levels; level++) {
      compartments.push({
        id: `column-${column + 1}-level-${level + 1}`,
        column,
        level,
        productKey: null,
        quantity: 0,
        capacity: 0,
        averageUnitCost: 0,
      })
    }
  }
  return { buildingId, definitionKey: definition.key, compartments }
}

export function getProductCapacity(definition: ShelfDefinition, product: ProductDefinition): number {
  return product.capacities[definition.layout.compartmentType] ?? 0
}

export function isProductCompatible(definition: ShelfDefinition, product: ProductDefinition): boolean {
  if (!definition.allowedProductCategories.includes(product.category)) return false
  if (product.requiresFreezing && !definition.frozen) return false
  if (product.requiresRefrigeration && !definition.refrigerated && !definition.frozen) return false
  return getProductCapacity(definition, product) > 0
}
