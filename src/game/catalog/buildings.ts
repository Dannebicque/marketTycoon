import type { BuildingDefinition } from '../definitions'

interface BuildingModule { default: BuildingDefinition }
const modules = import.meta.glob<BuildingModule>('./buildings/**/*.building.ts', { eager: true })

function validateBuilding(definition: BuildingDefinition, filename: string) {
  if (!definition?.key?.trim()) throw new Error(`${filename} : clé d’équipement manquante.`)
  if (!definition.name?.trim()) throw new Error(`${definition.key} : nom manquant.`)
  if (definition.width <= 0 || definition.height <= 0) throw new Error(`${definition.key} : dimensions invalides.`)
  if (definition.price < 0) throw new Error(`${definition.key} : prix négatif.`)
  if (definition.category === 'shelf') {
    if (definition.layout.columns <= 0 || definition.layout.levels <= 0) throw new Error(`${definition.key} : grille interne invalide.`)
    if (!definition.allowedProductCategories.length) throw new Error(`${definition.key} : aucune catégorie de produit autorisée.`)
    if (definition.frozen && !definition.refrigerated) throw new Error(`${definition.key} : un équipement surgelé doit aussi être réfrigéré.`)
  }
  if (definition.category === 'checkout') {
    if (definition.scanTimePerArticleMs < 0 || definition.baseCheckoutTimeMs < 0) throw new Error(`${definition.key} : temps d’encaissement invalide.`)
    if (!definition.acceptedPayments.length) throw new Error(`${definition.key} : aucun moyen de paiement accepté.`)
  }
}

const catalogMap = new Map<string, BuildingDefinition>()
for (const [filename, module] of Object.entries(modules)) {
  const definition = module.default
  validateBuilding(definition, filename)
  if (catalogMap.has(definition.key)) throw new Error(`Clé d’équipement dupliquée : ${definition.key}`)
  catalogMap.set(definition.key, definition)
}

export const BUILDINGS: BuildingDefinition[] = [...catalogMap.values()].sort((a, b) => (a.toolbar?.order ?? 1_000) - (b.toolbar?.order ?? 1_000))
const standardShelf = catalogMap.get('standard-shelf')
if (!standardShelf) throw new Error('Le catalogue doit contenir un équipement standard-shelf.')
export const BUILDING_CATALOG: Record<string, BuildingDefinition> & { standardShelf: BuildingDefinition } = Object.assign(Object.fromEntries(catalogMap) as Record<string, BuildingDefinition>, { standardShelf })
export const BUILDING_REGISTRY: ReadonlyMap<string, BuildingDefinition> = catalogMap
export const SHELF_BUILDINGS = BUILDINGS.filter(item => item.category === 'shelf')
export const CHECKOUT_BUILDINGS = BUILDINGS.filter(item => item.category === 'checkout')
export function getBuildingDefinition(key: string) { return catalogMap.get(key) }
export function requireBuildingDefinition(key: string) {
  const definition = getBuildingDefinition(key)
  if (!definition) throw new Error(`Définition d’équipement inconnue : ${key}`)
  return definition
}
