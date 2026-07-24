import Phaser from 'phaser'
import { BuildSurfaceMap, floodFillCells, rectangleCells, type BuildCommand, type BuildToolController } from '@market-tycoon/build-mode'
import { getBuildingDefinition } from '@market-tycoon/catalog'
import type { Direction } from '@market-tycoon/simulation-engine'
import { StoreScene } from './StoreScene'
import type { BuildMutationApi } from './installBuildModeHistory'
import { requireWorldMapRuntime } from '../world/worldMapRuntime'

interface SurfaceScene extends StoreScene {
  buildTools?: BuildToolController
  buildMutations?: BuildMutationApi
  buildSurfaces?: BuildSurfaceMap
  buildSurfaceLayer?: Phaser.GameObjects.Graphics
}

const FLOOR_STYLE = 'default'
let installed = false
let rectangleStart: { x: number; y: number } | undefined

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
    if (tool !== 'room' && tool !== 'floor') {
      rectangleStart = undefined
      window.dispatchEvent(new CustomEvent('market-tycoon:build-surface-selection', { detail: { tool, start: null } }))
    }
  })
}

function handleSurfacePointer(scene: SurfaceScene & Record<string, any>, pointer: Phaser.Input.Pointer) {
  if (!pointer.leftButtonReleased()) return
  const tool = scene.buildTools?.snapshot.activeTool
  if (tool !== 'room' && tool !== 'floor' && tool !== 'fill') return
  const cell = scene.hovered as { x: number; y: number }
  if (!scene.grid.isInside(cell.x, cell.y) || !requireWorldMapRuntime().isStoreInterior(cell)) {
    scene.setStatus('Le revêtement doit rester à l’intérieur du magasin.', '#f87171')
    return
  }

  if (tool === 'fill') {
    const cells = floodFillCells(cell, candidate => requireWorldMapRuntime().isStoreInterior(candidate), scene.grid.columns, scene.grid.rows)
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
  if (!cells.every(candidate => requireWorldMapRuntime().isStoreInterior(candidate))) {
    scene.setStatus('Le rectangle doit rester entièrement dans le magasin.', '#f87171')
    return
  }
  if (tool === 'floor') applyFloorCommand(scene, cells, 'Peindre un sol rectangulaire')
  else applyRoomCommand(scene, start, cell, cells)
}

function applyFloorCommand(scene: SurfaceScene, cells: Array<{ x: number; y: number }>, label: string) {
  const surfaces = scene.buildSurfaces
  const history = scene.buildMutations?.history
  if (!surfaces || !history || !cells.length) return
  const before = surfaces.snapshot()
  surfaces.paint(cells, FLOOR_STYLE)
  drawSurfaces(scene)
  const after = surfaces.snapshot()
  const restore = (snapshot: typeof before) => { surfaces.restore(snapshot); drawSurfaces(scene); return true }
  const command: BuildCommand = { label, execute: () => restore(after), undo: () => restore(before) }
  history.record(command)
  scene.setStatus(`${cells.length} case(s) de sol appliquée(s).`, '#86efac')
}

function applyRoomCommand(scene: SurfaceScene, start: { x: number; y: number }, end: { x: number; y: number }, cells: Array<{ x: number; y: number }>) {
  const surfaces = scene.buildSurfaces
  const mutations = scene.buildMutations
  const wall = getBuildingDefinition('wall')
  if (!surfaces || !mutations || !wall) return
  const minX = Math.min(start.x, end.x), maxX = Math.max(start.x, end.x)
  const minY = Math.min(start.y, end.y), maxY = Math.max(start.y, end.y)
  if (minX === maxX || minY === maxY) {
    scene.setStatus('Une pièce doit mesurer au moins 2 × 2 cases.', '#f87171')
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
  surfaces.paint(cells, FLOOR_STYLE)
  mutations.refresh()
  drawSurfaces(scene)
  const afterFloor = surfaces.snapshot()

  const removeRoom = () => {
    for (const edge of placedWalls) mutations.removeRaw(edge.x, edge.y, edge.direction)
    surfaces.restore(beforeFloor)
    mutations.refresh(); drawSurfaces(scene); return true
  }
  const restoreRoom = () => {
    for (const edge of placedWalls) mutations.placeRaw(wall, edge.x, edge.y, edge.direction)
    surfaces.restore(afterFloor)
    mutations.refresh(); drawSurfaces(scene); return true
  }
  mutations.history.record({ label: `Créer une pièce ${maxX - minX + 1} × ${maxY - minY + 1}`, execute: restoreRoom, undo: removeRoom })
  scene.setStatus(`Pièce créée · ${placedWalls.length} murs posés.`, '#86efac')
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
    layer.fillStyle(cell.style === 'default' ? 0x64748b : 0x475569, .28)
    layer.beginPath().moveTo(center.x, center.y).lineTo(center.x + halfWidth, center.y + halfHeight).lineTo(center.x, center.y + scene.grid.tileHeight).lineTo(center.x - halfWidth, center.y + halfHeight).closePath().fillPath()
  }
}
