import {
  BUILDINGS,
  isCheckoutDefinition,
  isShelfDefinition,
  isStorageDefinition,
  type BuildingDefinition,
  type StorageType,
} from '@market-tycoon/catalog'
import type { EmployeeManager } from '@market-tycoon/employees'
import type { Direction, PlacedBuilding } from '@market-tycoon/simulation-engine'
import type { StoreScene } from '../phaser/StoreScene'
import { storeZoneManager, zoneRuntime } from '../zones/zoneRuntime'

interface Rect { minX: number; maxX: number; minY: number; maxY: number }
interface EdgePlacement { x: number; y: number; direction: Direction }

const STORAGE_RECT: Rect = { minX: 2, maxX: 5, minY: 2, maxY: 11 }
const SALES_RECT: Rect = { minX: 6, maxX: 13, minY: 2, maxY: 11 }
const STORE_RECT: Rect = {
  minX: STORAGE_RECT.minX,
  maxX: SALES_RECT.maxX,
  minY: STORAGE_RECT.minY,
  maxY: STORAGE_RECT.maxY,
}

const STORAGE_POSITIONS: Record<StorageType, { x: number; y: number }> = {
  ambient: { x: 3, y: 4 },
  cold: { x: 3, y: 7 },
  frozen: { x: 3, y: 9 },
}

const SHELF_POSITIONS = [
  { x: 7, y: 3 },
  { x: 9, y: 3 },
  { x: 7, y: 7 },
  { x: 9, y: 7 },
]

let initialized = false

export function initializeDevelopmentScenario(scene: StoreScene, employeeManager: EmployeeManager) {
  if (!import.meta.env.DEV || initialized || scene.grid.getBuildings().length > 0) return false
  initialized = true

  paintValidStoreZones()
  buildEnvelopeFromPaintedCells(scene)

  const ambientStorage = BUILDINGS.filter(isStorageDefinition).find(item => item.storageType === 'ambient')
  if (ambientStorage) placeInZone(scene, ambientStorage, 'storage', STORAGE_POSITIONS.ambient)

  const shelfDefinitions = BUILDINGS.filter(isShelfDefinition).filter(item => !item.refrigerated && !item.frozen)
  const preferredShelves = uniqueDefinitions([
    shelfDefinitions.find(item => item.key === 'standard-shelf'),
    ...shelfDefinitions,
  ]).slice(0, SHELF_POSITIONS.length)

  const placedShelves = preferredShelves.flatMap((definition, index) => {
    const placed = placeInZone(scene, definition, 'sales', SHELF_POSITIONS[index])
    return placed ? [placed] : []
  })

  const checkoutDefinition = BUILDINGS
    .filter(isCheckoutDefinition)
    .filter(item => item.requiresEmployee)
    .sort((a, b) => a.price - b.price)[0]
  const checkout = checkoutDefinition ? placeInZone(scene, checkoutDefinition, 'sales', { x: 11, y: 9 }) : undefined

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
  zoneRuntime.revalidate()
  zoneRuntime.selectCursor()
  return true
}

function paintValidStoreZones() {
  storeZoneManager.clear()
  paintRect(STORAGE_RECT, 'storage')
  paintRect(SALES_RECT, 'sales')
  zoneRuntime.notifyChanged()
}

function paintRect(rect: Rect, zoneKey: string) {
  for (let y = rect.minY; y <= rect.maxY; y++) {
    for (let x = rect.minX; x <= rect.maxX; x++) storeZoneManager.paint(x, y, zoneKey)
  }
}

function buildEnvelopeFromPaintedCells(scene: StoreScene) {
  const wall = BUILDINGS.find(item => item.category === 'wall')
  const door = BUILDINGS.find(item => item.category === 'door')
  if (!wall || !door) return

  const boundaryEdges = collectRectangleBoundaryEdges(STORE_RECT)
  for (const edge of boundaryEdges) placeEdge(scene, wall, edge)

  // Cloison entre réserve et surface de vente.
  for (let y = STORAGE_RECT.minY; y <= STORAGE_RECT.maxY; y++) {
    placeEdge(scene, wall, { x: STORAGE_RECT.maxX, y, direction: 1 })
  }

  // Les portes remplacent les murs déjà posés sur les mêmes arêtes.
  placeEdge(scene, door, { x: 9, y: STORE_RECT.maxY, direction: 0 })
  placeEdge(scene, door, { x: STORAGE_RECT.maxX, y: 6, direction: 1 })
}

function collectRectangleBoundaryEdges(rect: Rect): EdgePlacement[] {
  const edges: EdgePlacement[] = []

  for (let x = rect.minX; x <= rect.maxX; x++) {
    // Arête supérieure de la première ligne de cellules.
    edges.push({ x, y: rect.minY - 1, direction: 0 })
    // Arête inférieure de la dernière ligne de cellules.
    edges.push({ x, y: rect.maxY, direction: 0 })
  }

  for (let y = rect.minY; y <= rect.maxY; y++) {
    // Arête gauche de la première colonne de cellules.
    edges.push({ x: rect.minX - 1, y, direction: 1 })
    // Arête droite de la dernière colonne de cellules.
    edges.push({ x: rect.maxX, y, direction: 1 })
  }

  return edges
}

function placeInZone(
  scene: StoreScene,
  definition: BuildingDefinition,
  zoneKey: string,
  preferred?: { x: number; y: number },
): PlacedBuilding | undefined {
  const candidates = preferred ? [preferred, ...zoneCandidates(zoneKey)] : zoneCandidates(zoneKey)
  const seen = new Set<string>()

  for (const candidate of candidates) {
    const candidateKey = `${candidate.x}:${candidate.y}`
    if (seen.has(candidateKey)) continue
    seen.add(candidateKey)

    const footprint = scene.grid.getFootprint(definition, candidate.x, candidate.y, 0)
    if (!footprint.length || !scene.grid.canPlace(definition, candidate.x, candidate.y, 0)) continue
    if (!footprint.every(cell => storeZoneManager.getZoneKeyAt(cell.x, cell.y) === zoneKey)) continue

    const placed = scene.grid.place(definition, candidate.x, candidate.y, 0)
    if (placed && 'definition' in placed) return placed
  }

  console.warn(`[dev-scenario] Impossible de placer ${definition.key} dans la zone ${zoneKey}.`)
  return undefined
}

function zoneCandidates(zoneKey: string) {
  return storeZoneManager.getCellsForZone(zoneKey)
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map(cell => ({ x: cell.x, y: cell.y }))
}

function placeEdge(scene: StoreScene, definition: BuildingDefinition, edge: EdgePlacement) {
  return scene.grid.place(definition, edge.x, edge.y, edge.direction)
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
  for (const roleKey of ['cashier', 'stocker']) {
    if (employeeManager.hasRole(roleKey)) continue
    const candidate = employeeManager.getCandidates().find(item => item.roleKey === roleKey)
    if (!candidate) continue
    const employee = employeeManager.hire(candidate.id, day)
    if (employee && roleKey === 'cashier' && checkoutId) employeeManager.assign(employee.id, checkoutId)
  }
}
