import type { BuildingDefinition, BuildingMenuCategoryDefinition, BuildingMenuCategoryKey } from '../contracts'

export const DEFAULT_BUILDING_MENU_CATEGORY: BuildingMenuCategoryKey = 'other'

export const BUILDING_MENU_CATEGORIES: readonly BuildingMenuCategoryDefinition[] = [
  { key: 'equipment', label: 'Équipements', description: 'Rayons et présentoirs', icon: '🛒', order: 10 },
  { key: 'storage', label: 'Réserves', description: 'Zones de stockage', icon: '📦', order: 20 },
  { key: 'checkout', label: 'Caisses', description: 'Encaissement client', icon: '💳', order: 30 },
  { key: 'construction', label: 'Construction', description: 'Murs et accès', icon: '🧱', order: 40 },
  { key: 'other', label: 'Autres', description: 'Équipements non classés', icon: '🧰', order: 900 },
]

const categoryMap = new Map(BUILDING_MENU_CATEGORIES.map(category => [category.key, category]))
const legacyCategoryMap: Partial<Record<BuildingDefinition['category'], BuildingMenuCategoryKey>> = {
  shelf: 'equipment',
  storage: 'storage',
  checkout: 'checkout',
  wall: 'construction',
  door: 'construction',
}

export function getBuildingMenuCategoryKey(definition: BuildingDefinition): BuildingMenuCategoryKey {
  return definition.toolbar?.category ?? legacyCategoryMap[definition.category] ?? DEFAULT_BUILDING_MENU_CATEGORY
}

export function getBuildingMenuCategory(key: BuildingMenuCategoryKey): BuildingMenuCategoryDefinition {
  return categoryMap.get(key) ?? categoryMap.get(DEFAULT_BUILDING_MENU_CATEGORY)!
}

export function getBuildingMenuCategories(definitions: readonly BuildingDefinition[]): BuildingMenuCategoryDefinition[] {
  const usedKeys = new Set(definitions.map(getBuildingMenuCategoryKey))
  return BUILDING_MENU_CATEGORIES
    .filter(category => usedKeys.has(category.key))
    .sort((a, b) => a.order - b.order)
}
