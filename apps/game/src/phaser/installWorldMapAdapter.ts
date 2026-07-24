import Phaser from 'phaser'
import { getBuildingDefinition } from '@market-tycoon/catalog'
import { GridManager, NavigationGrid } from '@market-tycoon/simulation-engine'
import type { ParcelAccess, WorldMapRuntime } from '@market-tycoon/world-map'
import { StoreScene } from './StoreScene'
import { requireWorldMapRuntime } from '../world/worldMapRuntime'

const ACCESS_COLORS: Record<ParcelAccess, number> = {
  owned: 0x16a34a,
  'for-sale': 0xeab308,
  locked: 0xf97316,
  public: 0x475569,
  reserved: 0x8b5cf6,
  unavailable: 0x991b1b,
}

let installed = false

/**
 * Adapts the historical Phaser scene to the data-driven world map.
 * Domain rules stay in @market-tycoon/world-map; Phaser only renders and
 * delegates placement checks to the runtime.
 */
export function installWorldMapPhaserAdapter() {
  if (installed) return
  installed = true

  const originalCreate = StoreScene.prototype.create

  StoreScene.prototype.create = function createWorldScene(this: StoreScene) {
    const runtime = requireWorldMapRuntime()
    const map = runtime.definition

    this.grid = new GridManager(
      map.size.columns,
      map.size.rows,
      map.tile.width,
      map.tile.height,
      Math.max(760, map.size.rows * map.tile.width / 2 + 120),
      70,
    )

    // NavigationGrid is private in the legacy scene, but remains a normal
    // runtime property. It must be rebuilt whenever the grid is replaced.
    ;(this as unknown as { navigation: NavigationGrid }).navigation = new NavigationGrid(this.grid)

    installBuildabilityPolicy(this.grid, runtime)
    installMapEntryPolicy(this.grid, runtime)

    originalCreate.call(this)

    drawParcels(this, runtime)
    seedInitialStore(this, runtime)
    frameWorldCamera(this)
  }
}

function installBuildabilityPolicy(grid: GridManager, runtime: WorldMapRuntime) {
  const baseCanPlace = grid.canPlace.bind(grid)
  grid.canPlace = (definition, x, y, direction) => {
    if (!baseCanPlace(definition, x, y, direction)) return false
    const footprint = grid.getFootprint(definition, x, y, direction)
    const cells = footprint.length ? footprint : [{ x, y }]
    return cells.every(cell => runtime.isBuildable(cell))
  }

  const baseRemoveAt = grid.removeAt.bind(grid)
  grid.removeAt = (x, y, direction) => runtime.isBuildable({ x, y }) && baseRemoveAt(x, y, direction)
}

function installMapEntryPolicy(grid: GridManager, runtime: WorldMapRuntime) {
  const entries = runtime.definition.spawnPoints
    .filter(point => point.kind === 'customer')
    .map(point => ({ x: point.x, y: point.y }))

  if (!entries.length) return
  grid.getBorderWalkableCells = () => entries.filter(cell => grid.isWalkable(cell.x, cell.y))
}

function seedInitialStore(scene: StoreScene, runtime: WorldMapRuntime) {
  if (scene.grid.getBuildings().length || scene.grid.getEdges().length) return

  for (const equipment of runtime.definition.initialStore.equipment) {
    const definition = getBuildingDefinition(equipment.definitionKey)
    if (!definition) {
      console.warn(`[world-map] Équipement initial inconnu : ${equipment.definitionKey}`)
      continue
    }
    scene.grid.place(definition, equipment.x, equipment.y, equipment.direction)
  }

  for (const edge of runtime.definition.initialStore.edges) {
    const definition = getBuildingDefinition(edge.definitionKey)
    if (!definition) {
      console.warn(`[world-map] Élément structurel initial inconnu : ${edge.definitionKey}`)
      continue
    }
    scene.grid.place(definition, edge.x, edge.y, edge.direction)
  }

  scene.simulation.syncBuildings(scene.grid.getBuildings())
  initializeStarterAssortment(scene)
  scene.drawBuildings()
}

function initializeStarterAssortment(scene: StoreScene) {
  const shelves = scene.grid.getBuildings('shelf')
  for (const shelf of shelves) {
    const inventory = scene.simulation.getEquipmentInventory(shelf.id)
    const products = scene.simulation.getCompatibleProducts(shelf.id)
    if (!inventory || !products.length) continue

    inventory.compartments.forEach((compartment, index) => {
      const product = products[index % products.length]
      scene.simulation.assignProductToCompartment(shelf.id, compartment.id, product.key)
      const configured = scene.simulation.getCompartment(shelf.id, compartment.id)
      if (configured?.capacity) scene.simulation.reserve.add(product.key, configured.capacity * 2, scene.grid.getBuildings())
    })
    scene.simulation.restockEquipment(shelf.id)
  }

  scene.simulation.metrics.cash = Math.max(scene.simulation.metrics.cash, 5_000)
}

function drawParcels(scene: StoreScene, runtime: WorldMapRuntime) {
  const layer = scene.add.graphics().setDepth(2)

  for (const parcel of runtime.definition.parcels) {
    const access = runtime.getParcelState(parcel.id)?.access ?? parcel.access
    const color = ACCESS_COLORS[access]
    const alpha = access === 'owned' ? 0.16 : access === 'public' ? 0.08 : 0.12

    for (let y = parcel.bounds.y; y < parcel.bounds.y + parcel.bounds.height; y++) {
      for (let x = parcel.bounds.x; x < parcel.bounds.x + parcel.bounds.width; x++) {
        const point = scene.grid.gridToScreen(x, y)
        drawDiamond(layer, point.x, point.y, scene.grid.tileWidth, scene.grid.tileHeight, color, alpha)
      }
    }
  }
}

function drawDiamond(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  tileWidth: number,
  tileHeight: number,
  color: number,
  alpha: number,
) {
  const halfWidth = tileWidth / 2
  const halfHeight = tileHeight / 2
  graphics
    .fillStyle(color, alpha)
    .lineStyle(1, color, Math.min(0.7, alpha + 0.18))
    .beginPath()
    .moveTo(x, y)
    .lineTo(x + halfWidth, y + halfHeight)
    .lineTo(x, y + halfHeight * 2)
    .lineTo(x - halfWidth, y + halfHeight)
    .closePath()
    .fillPath()
    .strokePath()
}

function frameWorldCamera(scene: StoreScene) {
  const center = scene.grid.gridToScreen(
    Math.floor(scene.grid.columns / 2),
    Math.floor(scene.grid.rows / 2),
  )
  scene.cameras.main.centerOn(center.x, center.y)
  scene.cameras.main.setZoom(0.72)
}
