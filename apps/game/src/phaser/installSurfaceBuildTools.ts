import {
  BuildSurfaceMap,
  ConstructionOrderQueue,
  constructionMaterialCatalog,
  floodFillCells,
  getRectanglePerimeterUnits,
  rectangleCells,
} from '@market-tycoon/construction'
import type { ConstructionOrder, ConstructionRect } from '@market-tycoon/construction'
import { type BuildCommand, type BuildToolController } from '@market-tycoon/build-mode'
import { getBuildingDefinition } from '@market-tycoon/catalog'
import type { Direction } from '@market-tycoon/simulation-engine'
import type { MapRect } from '@market-tycoon/world-map'
import { StoreScene } from './StoreScene'
import type { BuildMutationApi } from './installBuildModeHistory'
import { requireWorldMapRuntime } from '../world/worldMapRuntime'

interface SurfaceScene extends StoreScene {
  buildTools?: BuildToolController
  buildMutations?: BuildMutationApi
  buildSurfaces?: BuildSurfaceMap
  buildSurfaceLayer?: Phaser.GameObjects.Graphics
}

const orderQueue = new ConstructionOrderQueue()
let installed = false
let rectangleStart: { x: number; y: number } | undefined
let selectedFloorStyle = localStorage.getItem('market-tycoon.floor-style') ?? 'concrete-light'

export function installSurfaceBuildTools() {
  if (installed) return
  installed = true

  const prototype = StoreScene.prototype as StoreScene & Record<string, any>
  const originalCreate = prototype.create
  prototype.create = function () {
    originalCreate.call(this)
    const scene = this as SurfaceScene
    scene.buildSurfaces = new BuildSurfaceMap()
    scene.buildSurfaceLayer = scene.add.graphics().setDepth(10)
    drawSurfaces(scene)
    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => handleSurfacePointer(scene, pointer))
  }

  const originalPlaceSelected = prototype.placeSelected
  prototype.placeSelected = function () {
    const tool = (this as SurfaceScene).buildTools?.snapshot.activeTool
    if (tool === 'room' || tool === 'floor' || tool === 'fill') return
    return originalPlaceSelected.call(this)
  }

  const originalRotate = prototype.rotateScene
  prototype.rotateScene = function (step: -1 | 1) {
    const result = originalRotate.call(this, step)
    drawSurfaces(this as SurfaceScene)
    return result
  }

  window.addEventListener('market-tycoon:build-tool-changed', event => {
    const tool = (event as CustomEvent<{ activeTool: string }>).detail?.activeTool
    if (tool !== 'room' && tool !== 'floor') rectangleStart = undefined
  })
  window.addEventListener('market-tycoon:floor-style-change', event => {
    const key = (event as CustomEvent<{ styleKey: string }>).detail?.styleKey
    if (key && constructionMaterialCatalog.get(key)?.kind === 'floor') selectedFloorStyle = key
  })
}

function handleSurfacePointer(scene: SurfaceScene & Record<string, any>, pointer: Phaser.Input.Pointer) {
  if (!pointer.leftButtonReleased()) return
  const tool = scene.buildTools?.snapshot.activeTool
  if (tool !== 'room' && tool !== 'floor' && tool !== 'fill') return
  const cell = scene.hovered as { x: number; y: number }
  const world = requireWorldMapRuntime()
  const allowed = tool === 'room' ? world.isBuildable(cell) : world.isStoreInterior(cell)
  if (!scene.grid.isInside(cell.x, cell.y) || !allowed) {
    scene.setStatus(tool === 'room' ? 'La pièce doit être construite sur une parcelle possédée et constructible.' : 'Le revêtement doit rester à l’intérieur du magasin.', '#f87171')
    return
  }

  if (tool === 'fill') {
    const cells = floodFillCells(cell, candidate => world.isStoreInterior(candidate), scene.grid.columns, scene.grid.rows)
    applyFloorCommand(scene, cells, 'Remplir le sol')
    return
  }

  if (!rectangleStart) {
    rectangleStart = { ...cell }
    scene.setStatus('Premier angle défini · cliquez sur l’angle opposé.', '#93c5fd')
    window.dispatchEvent(new CustomEvent('market-tycoon:build-surface-selection', { detail: { tool, start: rectangleStart } }))
    return
  }

  const cells = rectangleCells(rectangleStart, cell)
  const start = rectangleStart
  rectangleStart = undefined
  window.dispatchEvent(new CustomEvent('market-tycoon:build-surface-selection', { detail: { tool, start: null } }))
  const valid = tool === 'room'
    ? cells.every(candidate => world.isBuildable(candidate))
    : cells.every(candidate => world.isStoreInterior(candidate))
  if (!valid) {
    scene.setStatus(tool === 'room' ? 'La pièce doit rester entièrement sur des parcelles possédées et constructibles.' : 'Le rectangle doit rester entièrement dans le magasin.', '#f87171')
    return
  }
  if (tool === 'floor') applyFloorCommand(scene, cells, 'Peindre un sol rectangulaire')
  else applyRoomCommand(scene, start, cell, cells)
}

function applyFloorCommand(scene: SurfaceScene, cells: Array<{ x: number; y: number }>, label: string) {
  const surfaces = scene.buildSurfaces
  const history = scene.buildMutations?.history
  const material = constructionMaterialCatalog.get(selectedFloorStyle)
  if (!surfaces || !history || !cells.length || material?.kind !== 'floor') return
  const cost = constructionMaterialCatalog.calculateCost(material.key, cells.length)
  if (!scene.simulation.canSpend(cost)) {
    scene.setStatus(`Trésorerie insuffisante · ${cost.toLocaleString('fr-FR')} € requis.`, '#f87171')
    return
  }

  const before = surfaces.snapshot()
  scene.simulation.spend(cost)
  surfaces.paint(cells, material.key)
  drawSurfaces(scene)
  const after = surfaces.snapshot()
  const order = completeOrder({
    kind: 'floor',
    label: `${label} · ${material.name}`,
    cost,
    durationMs: 600,
    payload: { cells, materialKey: material.key },
  })

  const undo = () => {
    surfaces.restore(before)
    scene.simulation.refund(cost)
    orderQueue.cancel(order.id)
    drawSurfaces(scene)
    emitOrders()
    return true
  }
  const execute = () => {
    if (!scene.simulation.canSpend(cost) || !scene.simulation.spend(cost)) return false
    surfaces.restore(after)
    orderQueue.restore(order.id)
    drawSurfaces(scene)
    emitOrders()
    return true
  }
  const command: BuildCommand = { label: order.label, execute, undo }
  history.record(command)
  scene.setStatus(`${cells.length} case(s) · ${material.name} · ${cost.toLocaleString('fr-FR')} €.`, '#86efac')
}

function applyRoomCommand(scene: SurfaceScene, start: { x: number; y: number }, end: { x: number; y: number }, cells: Array<{ x: number; y: number }>) {
  const surfaces = scene.buildSurfaces
  const mutations = scene.buildMutations
  const wall = getBuildingDefinition('wall')
  const world = requireWorldMapRuntime()
  const floorMaterial = constructionMaterialCatalog.get(selectedFloorStyle)
  const wallMaterial = constructionMaterialCatalog.get('wall-standard')
  if (!surfaces || !mutations || !wall || floorMaterial?.kind !== 'floor' || wallMaterial?.kind !== 'wall') return
  const minX = Math.min(start.x, end.x), maxX = Math.max(start.x, end.x)
  const minY = Math.min(start.y, end.y), maxY = Math.max(start.y, end.y)
  if (minX === maxX || minY === maxY) {
    scene.setStatus('Une pièce doit mesurer au moins 2 × 2 cases.', '#f87171')
    return
  }

  const area: MapRect = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
  const constructionRect: ConstructionRect = area
  const floorCost = constructionMaterialCatalog.calculateCost(floorMaterial.key, cells.length)
  const wallCost = constructionMaterialCatalog.calculateCost(wallMaterial.key, getRectanglePerimeterUnits(constructionRect))
  const cost = floorCost + wallCost
  if (!scene.simulation.canSpend(cost)) {
    scene.setStatus(`Trésorerie insuffisante · ${cost.toLocaleString('fr-FR')} € requis.`, '#f87171')
    return
  }
  if (!world.addPlayerInteriorArea(area)) {
    scene.setStatus('Cette surface ne peut pas devenir une nouvelle pièce.', '#f87171')
    return
  }
  if (!scene.simulation.spend(cost)) {
    world.removePlayerInteriorArea(area)
    return
  }

  const beforeFloor = surfaces.snapshot()
  const placedWalls: Array<{ x: number; y: number; direction: Direction }> = []
  const perimeter: Array<{ x: number; y: number; direction: Direction }> = []
  for (let x = minX; x <= maxX; x++) perimeter.push({ x, y: minY, direction: 0 }, { x, y: maxY, direction: 2 })
  for (let y = minY; y <= maxY; y++) perimeter.push({ x: minX, y, direction: 3 }, { x: maxX, y, direction: 1 })
  for (const edge of perimeter) if (mutations.placeRaw(wall, edge.x, edge.y, edge.direction)) placedWalls.push(edge)

  surfaces.paint(cells, floorMaterial.key)
  mutations.refresh()
  drawSurfaces(scene)
  window.dispatchEvent(new Event('market-tycoon:building-runtime-changed'))
  const afterFloor = surfaces.snapshot()
  const order = completeOrder({
    kind: 'room',
    label: `Créer une pièce ${area.width} × ${area.height} · ${floorMaterial.name}`,
    cost,
    durationMs: 1_200,
    payload: { area, floorMaterialKey: floorMaterial.key, wallMaterialKey: wallMaterial.key },
  })

  const removeRoom = () => {
    for (const edge of placedWalls) mutations.removeRaw(edge.x, edge.y, edge.direction)
    world.removePlayerInteriorArea(area)
    surfaces.restore(beforeFloor)
    scene.simulation.refund(cost)
    orderQueue.cancel(order.id)
    mutations.refresh(); drawSurfaces(scene); emitOrders()
    window.dispatchEvent(new Event('market-tycoon:building-runtime-changed'))
    return true
  }
  const restoreRoom = () => {
    if (!scene.simulation.canSpend(cost) || !world.addPlayerInteriorArea(area)) return false
    if (!scene.simulation.spend(cost)) { world.removePlayerInteriorArea(area); return false }
    for (const edge of placedWalls) mutations.placeRaw(wall, edge.x, edge.y, edge.direction)
    surfaces.restore(afterFloor)
    orderQueue.restore(order.id)
    mutations.refresh(); drawSurfaces(scene); emitOrders()
    window.dispatchEvent(new Event('market-tycoon:building-runtime-changed'))
    return true
  }
  mutations.history.record({ label: order.label, execute: restoreRoom, undo: removeRoom })
  scene.setStatus(`Pièce créée · ${placedWalls.length} murs · ${cost.toLocaleString('fr-FR')} €.`, '#86efac')
}

function completeOrder(input: Omit<ConstructionOrder, 'id' | 'createdAt' | 'status'>) {
  const order = orderQueue.create(input)
  orderQueue.start(order.id)
  orderQueue.complete(order.id)
  emitOrders()
  return order
}

function emitOrders() {
  window.dispatchEvent(new CustomEvent('market-tycoon:construction-orders-changed', { detail: { orders: orderQueue.list() } }))
}

function drawSurfaces(scene: SurfaceScene) {
  const layer = scene.buildSurfaceLayer
  const surfaces = scene.buildSurfaces
  if (!layer || !surfaces) return
  layer.clear()
  for (const cell of surfaces.entries()) {
    const center = scene.grid.gridToScreen(cell.x, cell.y)
    const halfWidth = scene.grid.tileWidth / 2
    const halfHeight = scene.grid.tileHeight / 2
    const material = constructionMaterialCatalog.get(cell.style)
    layer.fillStyle(material?.color ?? 0x64748b, .38)
    layer.beginPath().moveTo(center.x, center.y).lineTo(center.x + halfWidth, center.y + halfHeight).lineTo(center.x, center.y + scene.grid.tileHeight).lineTo(center.x - halfWidth, center.y + halfHeight).closePath().fillPath()
  }
}
