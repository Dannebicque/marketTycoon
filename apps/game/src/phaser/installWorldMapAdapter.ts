import Phaser from 'phaser'
import { getBuildingDefinition } from '@market-tycoon/catalog'
import { GridManager, NavigationGrid } from '@market-tycoon/simulation-engine'
import type { ParcelAccess, ParcelDefinition, WorldMapRuntime } from '@market-tycoon/world-map'
import { StoreScene } from './StoreScene'
import { requireWorldMapRuntime } from '../world/worldMapRuntime'

interface ParcelVisualStyle {
  fill: number
  fillAlpha: number
  line: number
  lineAlpha: number
  lineWidth: number
  label: string
}

const ACCESS_STYLES: Record<ParcelAccess, ParcelVisualStyle> = {
  owned: { fill: 0x1e293b, fillAlpha: .05, line: 0x94a3b8, lineAlpha: .42, lineWidth: 1, label: 'Possédée' },
  'for-sale': { fill: 0xfacc15, fillAlpha: .08, line: 0xfacc15, lineAlpha: .95, lineWidth: 3, label: 'À vendre' },
  locked: { fill: 0x0f172a, fillAlpha: .28, line: 0xfb923c, lineAlpha: .82, lineWidth: 2, label: 'Verrouillée' },
  public: { fill: 0x334155, fillAlpha: .2, line: 0x64748b, lineAlpha: .55, lineWidth: 1, label: 'Espace public' },
  reserved: { fill: 0x312e81, fillAlpha: .18, line: 0xa78bfa, lineAlpha: .82, lineWidth: 2, label: 'Réservée' },
  unavailable: { fill: 0x450a0a, fillAlpha: .24, line: 0xef4444, lineAlpha: .72, lineWidth: 2, label: 'Indisponible' },
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
    return cells.every(cell => runtime.isStoreInterior(cell))
  }

  const baseRemoveAt = grid.removeAt.bind(grid)
  grid.removeAt = (x, y, direction) => runtime.isStoreInterior({ x, y }) && baseRemoveAt(x, y, direction)
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
  const fillLayer = scene.add.graphics().setDepth(2)
  const borderLayer = scene.add.graphics().setDepth(3)

  for (const parcel of runtime.getParcels()) {
    const style = ACCESS_STYLES[parcel.access]
    drawParcelFill(scene, fillLayer, parcel, style)
    drawParcelBoundary(scene, borderLayer, parcel, style)
    drawParcelLabel(scene, parcel, style)
  }
}

function drawParcelFill(scene: StoreScene, layer: Phaser.GameObjects.Graphics, parcel: ParcelDefinition, style: ParcelVisualStyle) {
  for (let y = parcel.bounds.y; y < parcel.bounds.y + parcel.bounds.height; y++) {
    for (let x = parcel.bounds.x; x < parcel.bounds.x + parcel.bounds.width; x++) {
      const point = scene.grid.gridToScreen(x, y)
      drawDiamond(layer, point.x, point.y, scene.grid.tileWidth, scene.grid.tileHeight, style.fill, style.fillAlpha)
    }
  }
}

function drawParcelBoundary(scene: StoreScene, layer: Phaser.GameObjects.Graphics, parcel: ParcelDefinition, style: ParcelVisualStyle) {
  const top = scene.grid.gridToScreen(parcel.bounds.x, parcel.bounds.y)
  const right = scene.grid.gridToScreen(parcel.bounds.x + parcel.bounds.width - 1, parcel.bounds.y)
  const bottom = scene.grid.gridToScreen(parcel.bounds.x + parcel.bounds.width - 1, parcel.bounds.y + parcel.bounds.height - 1)
  const left = scene.grid.gridToScreen(parcel.bounds.x, parcel.bounds.y + parcel.bounds.height - 1)
  const halfWidth = scene.grid.tileWidth / 2
  const halfHeight = scene.grid.tileHeight / 2

  layer.lineStyle(style.lineWidth, style.line, style.lineAlpha)
  layer.beginPath()
  layer.moveTo(top.x, top.y)
  layer.lineTo(right.x + halfWidth, right.y + halfHeight)
  layer.lineTo(bottom.x, bottom.y + scene.grid.tileHeight)
  layer.lineTo(left.x - halfWidth, left.y + halfHeight)
  layer.closePath()
  layer.strokePath()

  if (parcel.access === 'unavailable' || parcel.access === 'locked') {
    layer.lineStyle(2, style.line, .48)
    layer.beginPath()
    layer.moveTo(top.x, top.y)
    layer.lineTo(bottom.x, bottom.y + scene.grid.tileHeight)
    layer.moveTo(right.x + halfWidth, right.y + halfHeight)
    layer.lineTo(left.x - halfWidth, left.y + halfHeight)
    layer.strokePath()
  }
}

function drawParcelLabel(scene: StoreScene, parcel: ParcelDefinition, style: ParcelVisualStyle) {
  if (parcel.access === 'owned' && parcel.usage === 'store') return
  const center = scene.grid.gridToScreen(
    parcel.bounds.x + Math.floor(parcel.bounds.width / 2),
    parcel.bounds.y + Math.floor(parcel.bounds.height / 2),
  )
  const price = parcel.access === 'for-sale' && parcel.price ? ` · ${parcel.price.toLocaleString('fr-FR')} €` : ''
  scene.add.text(center.x, center.y, `${parcel.name}\n${style.label}${price}`, {
    fontFamily: 'Arial',
    fontSize: '12px',
    align: 'center',
    color: '#f8fafc',
    backgroundColor: '#0f172acc',
    padding: { x: 7, y: 5 },
  }).setOrigin(.5).setDepth(4)
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
    .beginPath()
    .moveTo(x, y)
    .lineTo(x + halfWidth, y + halfHeight)
    .lineTo(x, y + halfHeight * 2)
    .lineTo(x - halfWidth, y + halfHeight)
    .closePath()
    .fillPath()
}

function frameWorldCamera(scene: StoreScene) {
  const center = scene.grid.gridToScreen(
    Math.floor(scene.grid.columns / 2),
    Math.floor(scene.grid.rows / 2),
  )
  scene.cameras.main.centerOn(center.x, center.y)
  scene.cameras.main.setZoom(0.72)
}
