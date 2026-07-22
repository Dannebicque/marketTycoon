import {
  BUILDINGS,
  isCheckoutDefinition,
  isShelfDefinition,
  isStorageDefinition,
  type BuildingDefinition,
  type StorageType,
} from '@market-tycoon/catalog'
import type { EmployeeManager } from '@market-tycoon/employees'
import type { StoreScene } from '../phaser/StoreScene'

const STORAGE_POSITIONS: Record<StorageType, { x: number; y: number }> = {
  ambient: { x: 1, y: 1 },
  cold: { x: 1, y: 4 },
  frozen: { x: 1, y: 7 },
}

const SHELF_POSITIONS = [
  { x: 6, y: 3 },
  { x: 8, y: 3 },
  { x: 6, y: 7 },
  { x: 8, y: 7 },
]

let initialized = false

export function initializeDevelopmentScenario(scene: StoreScene, employeeManager: EmployeeManager) {
  if (!import.meta.env.DEV || initialized || scene.grid.getBuildings().length > 0) return false
  initialized = true

  // Le scénario initial ne place que le contenu accessible au premier rang.
  // Les réserves froides/surgelées restent visibles dans la palette mais verrouillées.
  const ambientStorage = BUILDINGS.filter(isStorageDefinition).find(item => item.storageType === 'ambient')
  if (ambientStorage) place(scene, ambientStorage, STORAGE_POSITIONS.ambient.x, STORAGE_POSITIONS.ambient.y)

  const shelfDefinitions = BUILDINGS.filter(isShelfDefinition).filter(item => !item.refrigerated && !item.frozen)
  const preferredShelves = uniqueDefinitions([
    shelfDefinitions.find(item => item.key === 'standard-shelf'),
    ...shelfDefinitions,
  ]).slice(0, SHELF_POSITIONS.length)

  const placedShelves = preferredShelves.flatMap((definition, index) => {
    const position = SHELF_POSITIONS[index]
    const placed = position ? place(scene, definition, position.x, position.y) : undefined
    return placed ? [placed] : []
  })

  const checkoutDefinition = BUILDINGS
    .filter(isCheckoutDefinition)
    .filter(item => item.requiresEmployee)
    .sort((a, b) => a.price - b.price)[0]
  const checkout = checkoutDefinition ? place(scene, checkoutDefinition, 11, 11) : undefined

  scene.simulation.syncBuildings(scene.grid.getBuildings())

  for (const shelf of placedShelves) {
    const inventory = scene.simulation.getEquipmentInventory(shelf.id)
    const compatibleProducts = scene.simulation.getCompatibleProducts(shelf.id)
    if (!inventory || !compatibleProducts.length) continue

    inventory.compartments.forEach((compartment, index) => {
      const product = compatibleProducts[index % compatibleProducts.length]
      scene.simulation.assignProductToCompartment(shelf.id, compartment.id, product.key)
      const configured = scene.simulation.getCompartment(shelf.id, compartment.id)
      if (configured?.capacity) scene.simulation.reserve.add(product.key, configured.capacity * 3, scene.grid.getBuildings())
    })
    scene.simulation.restockEquipment(shelf.id)
  }

  recruitInitialRoles(employeeManager, scene.day, checkout?.id)
  scene.simulation.metrics.cash = Math.max(scene.simulation.metrics.cash, 5_000)
  scene.drawBuildings()
  return true
}

function place(scene: StoreScene, definition: BuildingDefinition, x: number, y: number) {
  const placed = scene.grid.place(definition, x, y, 0)
  return placed && 'definition' in placed ? placed : undefined
}

function uniqueDefinitions(definitions: Array<BuildingDefinition | undefined>) {
  const seen = new Set<string>()
  return definitions.filter((definition): definition is BuildingDefinition => {
    if (!definition || seen.has(definition.key)) return false
    seen.add(definition.key)
    return true
  })
}

function recruitInitialRoles(employeeManager: EmployeeManager, day: number, checkoutId?: string) {
  // Le technicien est volontairement exclu : il doit être obtenu via
  // advanced-logistics et apparaît désormais dans « Métiers à débloquer ».
  for (const roleKey of ['cashier', 'stocker']) {
    if (employeeManager.hasRole(roleKey)) continue
    const candidate = employeeManager.getCandidates().find(item => item.roleKey === roleKey)
    if (!candidate) continue
    const employee = employeeManager.hire(candidate.id, day)
    if (employee && roleKey === 'cashier' && checkoutId) employeeManager.assign(employee.id, checkoutId)
  }
}
