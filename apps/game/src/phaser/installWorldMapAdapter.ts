import Phaser from 'phaser'
import { getBuildingDefinition } from '@market-tycoon/catalog'
import { GridManager, NavigationGrid } from '@market-tycoon/simulation-engine'
import type { MapRect, ParcelAccess, ParcelDefinition, WorldMapRuntime } from '@market-tycoon/world-map'
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

interface ParcelVisuals {
  fillLayer: Phaser.GameObjects.Graphics
  borderLayer: Phaser.GameObjects.Graphics
  storeFrameLayer: Phaser.GameObjects.Graphics
  labels: Phaser.GameObjects.Text[]
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
let activeScene: StoreScene | undefined
let activeRuntime: WorldMapRuntime | undefined
let hoveredParcelId: string | undefined
const visuals = new WeakMap<StoreScene, ParcelVisuals>()

export function installWorldMapPhaserAdapter() {
  if (installed) return
  installed = true

  const originalCreate = StoreScene.prototype.create

  StoreScene.prototype.create = function createWorldScene(this: StoreScene) {
    const runtime = requireWorldMapRuntime()
    const map = runtime.definition
    activeScene = this
    activeRuntime = runtime

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

    installParcelPointerFeedback(this, runtime)
    drawParcels(this, runtime)
    seedInitialStore(this, runtime)
    frameWorldCamera(this)
  }

  window.addEventListener('market-tycoon:parcel-purchase-request', event => {
    const parcelId = (event as CustomEvent<{ parcelId: string }>).detail?.parcelId
    if (!parcelId || !activeScene || !activeRuntime) return
    const parcel = activeRuntime.getParcel(parcelId)
    if (!parcel || !activeRuntime.canPurchase(parcelId)) {
      emitActionResult(false, parcelId, 'Cette parcelle n’est pas disponible à l’achat.')
      return
    }
    const price = parcel.price ?? 0
    if (!activeScene.simulation.canSpend(price)) {
      emitActionResult(false, parcelId, 'Trésorerie insuffisante pour acheter cette parcelle.')
      return
    }
    activeScene.simulation.spend(price)
    activeRuntime.purchase(parcelId)
    drawParcels(activeScene, activeRuntime)
    emitActionResult(true, parcelId, `${parcel.name} a été achetée pour ${price.toLocaleString('fr-FR')} €.`)
    emitParcelSelection(activeRuntime, parcelId)
  })

  window.addEventListener('market-tycoon:building-extension-request', event => {
    const parcelId = (event as CustomEvent<{ parcelId: string }>).detail?.parcelId
    if (!parcelId || !activeScene || !activeRuntime) return
    const parcel = activeRuntime.getParcel(parcelId)
    if (!parcel || !activeRuntime.canExpandPlayerBuildingInto(parcelId)) {
      emitActionResult(false, parcelId, 'Cette parcelle ne peut pas accueillir une extension du magasin.')
      return
    }
    const cost = activeRuntime.getExtensionCost(parcelId)
    if (!activeScene.simulation.canSpend(cost)) {
      emitActionResult(false, parcelId, 'Trésorerie insuffisante pour construire cette extension.')
      return
    }
    activeScene.simulation.spend(cost)
    activeRuntime.expandPlayerBuildingInto(parcelId)
    drawParcels(activeScene, activeRuntime)
    emitActionResult(true, parcelId, `Extension construite sur ${parcel.name} pour ${cost.toLocaleString('fr-FR')} €.`)
    emitParcelSelection(activeRuntime, parcelId)
  })
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
  const entries = runtime.definition.spawnPoints.filter(point => point.kind === 'customer').map(point => ({ x: point.x, y: point.y }))
  if (entries.length) grid.getBorderWalkableCells = () => entries.filter(cell => grid.isWalkable(cell.x, cell.y))
}

function installParcelPointerFeedback(scene: StoreScene, runtime: WorldMapRuntime) {
  scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    const world = pointer.positionToCamera(scene.cameras.main) as Phaser.Math.Vector2
    const cell = scene.grid.screenToGrid(world.x, world.y)
    const parcel = runtime.getParcelAt(cell)
    if (parcel?.id === hoveredParcelId) return
    hoveredParcelId = parcel?.id
    emitParcelSelection(runtime, parcel?.id)
  })
}

function emitParcelSelection(runtime: WorldMapRuntime, parcelId?: string) {
  const parcel = parcelId ? runtime.getParcel(parcelId) : undefined
  const state = parcel ? runtime.getParcelState(parcel.id) : undefined
  window.dispatchEvent(new CustomEvent('market-tycoon:parcel-selected', {
    detail: parcel ? {
      parcel: { ...parcel, access: state?.access ?? parcel.access },
      canPurchase: runtime.canPurchase(parcel.id),
      canExpand: runtime.canExpandPlayerBuildingInto(parcel.id),
      extensionCost: runtime.getExtensionCost(parcel.id),
    } : { parcel: null, canPurchase: false, canExpand: false, extensionCost: 0 },
  }))
}

function emitActionResult(success: boolean, parcelId: string, message: string) {
  window.dispatchEvent(new CustomEvent('market-tycoon:parcel-action-result', { detail: { success, parcelId, message } }))
}

function seedInitialStore(scene: StoreScene, runtime: WorldMapRuntime) {
  if (scene.grid.getBuildings().length || scene.grid.getEdges().length) return
  for (const equipment of runtime.definition.initialStore.equipment) {
    const definition = getBuildingDefinition(equipment.definitionKey)
    if (definition) scene.grid.place(definition, equipment.x, equipment.y, equipment.direction)
    else console.warn(`[world-map] Équipement initial inconnu : ${equipment.definitionKey}`)
  }
  for (const edge of runtime.definition.initialStore.edges) {
    const definition = getBuildingDefinition(edge.definitionKey)
    if (definition) scene.grid.place(definition, edge.x, edge.y, edge.direction)
    else console.warn(`[world-map] Élément structurel initial inconnu : ${edge.definitionKey}`)
  }
  scene.simulation.syncBuildings(scene.grid.getBuildings())
  initializeStarterAssortment(scene)
  scene.drawBuildings()
}

function initializeStarterAssortment(scene: StoreScene) {
  for (const shelf of scene.grid.getBuildings('shelf')) {
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
  const previous = visuals.get(scene)
  previous?.fillLayer.destroy()
  previous?.borderLayer.destroy()
  previous?.storeFrameLayer.destroy()
  previous?.labels.forEach(label => label.destroy())

  const current: ParcelVisuals = {
    fillLayer: scene.add.graphics().setDepth(2),
    borderLayer: scene.add.graphics().setDepth(3),
    storeFrameLayer: scene.add.graphics().setDepth(5),
    labels: [],
  }
  visuals.set(scene, current)

  for (const parcel of runtime.getParcels()) {
    const style = ACCESS_STYLES[parcel.access]
    drawParcelFill(scene, current.fillLayer, parcel, style)
    drawParcelBoundary(scene, current.borderLayer, parcel, style)
    const label = drawParcelLabel(scene, parcel, style)
    if (label) current.labels.push(label)
  }

  for (const area of runtime.getPlayerBuildingState()?.interiorAreas ?? []) drawStoreFrame(scene, current.storeFrameLayer, area)
}

function drawParcelFill(scene: StoreScene, layer: Phaser.GameObjects.Graphics, parcel: ParcelDefinition, style: ParcelVisualStyle) {
  for (let y = parcel.bounds.y; y < parcel.bounds.y + parcel.bounds.height; y++) for (let x = parcel.bounds.x; x < parcel.bounds.x + parcel.bounds.width; x++) {
    const point = scene.grid.gridToScreen(x, y)
    drawDiamond(layer, point.x, point.y, scene.grid.tileWidth, scene.grid.tileHeight, style.fill, style.fillAlpha)
  }
}

function drawParcelBoundary(scene: StoreScene, layer: Phaser.GameObjects.Graphics, parcel: ParcelDefinition, style: ParcelVisualStyle) {
  drawRectBoundary(scene, layer, parcel.bounds, style.lineWidth, style.line, style.lineAlpha)
  if (parcel.access === 'unavailable' || parcel.access === 'locked') {
    const { top, right, bottom, left, halfWidth, halfHeight } = rectCorners(scene, parcel.bounds)
    layer.lineStyle(2, style.line, .48).beginPath().moveTo(top.x, top.y).lineTo(bottom.x, bottom.y + scene.grid.tileHeight).moveTo(right.x + halfWidth, right.y + halfHeight).lineTo(left.x - halfWidth, left.y + halfHeight).strokePath()
  }
}

function drawStoreFrame(scene: StoreScene, layer: Phaser.GameObjects.Graphics, area: MapRect) {
  drawRectBoundary(scene, layer, area, 4, 0xf8fafc, .95)
}

function drawRectBoundary(scene: StoreScene, layer: Phaser.GameObjects.Graphics, bounds: MapRect, width: number, color: number, alpha: number) {
  const { top, right, bottom, left, halfWidth, halfHeight } = rectCorners(scene, bounds)
  layer.lineStyle(width, color, alpha).beginPath().moveTo(top.x, top.y).lineTo(right.x + halfWidth, right.y + halfHeight).lineTo(bottom.x, bottom.y + scene.grid.tileHeight).lineTo(left.x - halfWidth, left.y + halfHeight).closePath().strokePath()
}

function rectCorners(scene: StoreScene, bounds: MapRect) {
  return {
    top: scene.grid.gridToScreen(bounds.x, bounds.y),
    right: scene.grid.gridToScreen(bounds.x + bounds.width - 1, bounds.y),
    bottom: scene.grid.gridToScreen(bounds.x + bounds.width - 1, bounds.y + bounds.height - 1),
    left: scene.grid.gridToScreen(bounds.x, bounds.y + bounds.height - 1),
    halfWidth: scene.grid.tileWidth / 2,
    halfHeight: scene.grid.tileHeight / 2,
  }
}

function drawParcelLabel(scene: StoreScene, parcel: ParcelDefinition, style: ParcelVisualStyle) {
  if (parcel.access === 'owned' && parcel.usage === 'store') return undefined
  const center = scene.grid.gridToScreen(parcel.bounds.x + Math.floor(parcel.bounds.width / 2), parcel.bounds.y + Math.floor(parcel.bounds.height / 2))
  const price = parcel.access === 'for-sale' && parcel.price ? ` · ${parcel.price.toLocaleString('fr-FR')} €` : ''
  return scene.add.text(center.x, center.y, `${parcel.name}\n${style.label}${price}`, { fontFamily: 'Arial', fontSize: '12px', align: 'center', color: '#f8fafc', backgroundColor: '#0f172acc', padding: { x: 7, y: 5 } }).setOrigin(.5).setDepth(4)
}

function drawDiamond(graphics: Phaser.GameObjects.Graphics, x: number, y: number, tileWidth: number, tileHeight: number, color: number, alpha: number) {
  const halfWidth = tileWidth / 2, halfHeight = tileHeight / 2
  graphics.fillStyle(color, alpha).beginPath().moveTo(x, y).lineTo(x + halfWidth, y + halfHeight).lineTo(x, y + halfHeight * 2).lineTo(x - halfWidth, y + halfHeight).closePath().fillPath()
}

function frameWorldCamera(scene: StoreScene) {
  const center = scene.grid.gridToScreen(Math.floor(scene.grid.columns / 2), Math.floor(scene.grid.rows / 2))
  scene.cameras.main.centerOn(center.x, center.y)
  scene.cameras.main.setZoom(0.72)
}
