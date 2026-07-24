import { BuildSurfaceMap, floodFillCells, getBuildSurfaceStyle, rectangleCells, type BuildCommand, type BuildToolController } from '@market-tycoon/build-mode'
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

let installed = false
let rectangleStart: { x: number; y: number } | undefined
let selectedFloorStyle = 'concrete-light'

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
    if (key && getBuildSurfaceStyle(key)) selectedFloorStyle = key
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
  const style = getBuildSurfaceStyle(selectedFloorStyle)
  if (!surfaces || !history || !cells.length || !style) return
  const before = surfaces.snapshot()
  surfaces.paint(cells, style.key)
  drawSurfaces(scene)
  const after = surfaces.snapshot()
  const restore = (snapshot: typeof before) => { surfaces.restore(snapshot); drawSurfaces(scene); return true }
  const command: BuildCommand = { label: `${label} · ${style.name}`, execute: () => restore(after), undo: () => restore(before) }
  history.record(command)
  scene.setStatus(`${cells.length} case(s) · ${style.name}.`, '#86efac')
}

function applyRoomCommand(scene: SurfaceScene, start: { x: number; y: number }, end: { x: number; y: number }, cells: Array<{ x: number; y: number }>) {
  const surfaces = scene.buildSurfaces
  const mutations = scene.buildMutations
  const wall = getBuildingDefinition('wall')
  const world = requireWorldMapRuntime()
  const style = getBuildSurfaceStyle(selectedFloorStyle)
  if (!surfaces || !mutations || !wall || !style) return
  const minX = Math.min(start.x, end.x), maxX = Math.max(start.x, end.x)
  const minY = Math.min(start.y, end.y), maxY = Math.max(start.y, end.y)
  if (minX === maxX || minY === maxY) {
    scene.setStatus('Une pièce doit mesurer au moins 2 × 2 cases.', '#f87171')
    return
  }

  const area: MapRect = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
  if (!world.addPlayerInteriorArea(area)) {
    scene.setStatus('Cette surface ne peut pas devenir une nouvelle pièce.', '#f87171')
    return
  }

  const beforeFloor = surfaces.snapshot()
  const placedWalls: Array<{ x: number; y: number; direction: Direction }> = []
  const perimeter: Array<{ x: number; y: number; direction: Direction }> = []
  for (let x = minX; x <= maxX; x++) perimeter.push({ x, y: minY, direction: 0 }, { x, y: maxY, direction: 2 })
  for (let y = minY; y <= maxY; y++) perimeter.push({ x: minX, y, direction: 3 }, { x: maxX, y, direction: 1 })

  for (const edge of perimeter) {
    const placed = mutations.placeRaw(wall, edge.x, edge.y, edge.direction)
    if (placed) placedWalls.push(edge)
  }
  surfaces.paint(cells, style.key)
  mutations.refresh()
  drawSurfaces(scene)
  window.dispatchEvent(new Event('market-tycoon:building-runtime-changed'))
  const afterFloor = surfaces.snapshot()

  const removeRoom = () => {
    for (const edge of placedWalls) mutations.removeRaw(edge.x, edge.y, edge.direction)
    world.removePlayerInteriorArea(area)
    surfaces.restore(beforeFloor)
    mutations.refresh(); drawSurfaces(scene)
    window.dispatchEvent(new Event('market-tycoon:building-runtime-changed'))
    return true
  }
  const restoreRoom = () => {
    if (!world.addPlayerInteriorArea(area)) return false
    for (const edge of placedWalls) mutations.placeRaw(wall, edge.x, edge.y, edge.direction)
    surfaces.restore(afterFloor)
    mutations.refresh(); drawSurfaces(scene)
    window.dispatchEvent(new Event('market-tycoon:building-runtime-changed'))
    return true
  }
  mutations.history.record({ label: `Créer une pièce ${area.width} × ${area.height} · ${style.name}`, execute: restoreRoom, undo: removeRoom })
  scene.setStatus(`Pièce créée · ${placedWalls.length} murs · ${style.name}.`, '#86efac')
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
    const style = getBuildSurfaceStyle(cell.style)
    layer.fillStyle(style?.color ?? 0x64748b, .38)
    layer.beginPath().moveTo(center.x, center.y).lineTo(center.x + halfWidth, center.y + halfHeight).lineTo(center.x, center.y + scene.grid.tileHeight).lineTo(center.x - halfWidth, center.y + halfHeight).closePath().fillPath()
  }
}
