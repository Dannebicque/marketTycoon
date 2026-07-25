import type { BuildToolController, BuildToolKind } from '@market-tycoon/build-mode'
import type { WallMap, WallOrientation, WallSegment, WallSegmentKind } from '@market-tycoon/construction'
import type { Direction } from '@market-tycoon/simulation-engine'
import { StoreScene } from './StoreScene'
import { requireWorldMapRuntime } from '../world/worldMapRuntime'

interface StructuralRenderScene extends StoreScene {
  buildTools?: BuildToolController
  buildWalls?: WallMap
  structuralLayer?: Phaser.GameObjects.Graphics
  structuralPreviewLayer?: Phaser.GameObjects.Graphics
}

const kindByTool: Partial<Record<BuildToolKind, WallSegmentKind>> = {
  wall: 'wall',
  door: 'door',
  window: 'window',
  storefront: 'storefront',
}
const orientationByDirection: Record<Direction, WallOrientation> = {
  0: 'north',
  1: 'east',
  2: 'south',
  3: 'west',
}
const directionByOrientation: Record<WallOrientation, Direction> = {
  north: 0,
  east: 1,
  south: 2,
  west: 3,
}

let installed = false
let activeScene: StructuralRenderScene | undefined

export function installStructuralRendering() {
  if (installed) return
  installed = true

  const prototype = StoreScene.prototype as StoreScene & Record<string, any>
  const originalCreate = prototype.create
  prototype.create = function () {
    originalCreate.call(this)
    const scene = this as StructuralRenderScene
    activeScene = scene
    scene.structuralLayer = scene.add.graphics().setDepth(31)
    scene.structuralPreviewLayer = scene.add.graphics().setDepth(45)
    scene.input.on('pointermove', () => drawStructuralPreview(scene))
    drawStructuralLayer(scene)
  }

  const originalDrawBuildings = prototype.drawBuildings
  prototype.drawBuildings = function () {
    const result = originalDrawBuildings.call(this)
    drawStructuralLayer(this as StructuralRenderScene)
    drawStructuralPreview(this as StructuralRenderScene)
    return result
  }

  const originalRotate = prototype.rotateScene
  prototype.rotateScene = function (step: -1 | 1) {
    const result = originalRotate.call(this, step)
    drawStructuralLayer(this as StructuralRenderScene)
    drawStructuralPreview(this as StructuralRenderScene)
    return result
  }

  window.addEventListener('market-tycoon:build-tool-changed', () => {
    if (activeScene) drawStructuralPreview(activeScene)
  })
  window.addEventListener('market-tycoon:structural-runtime-changed', () => {
    if (!activeScene) return
    drawStructuralLayer(activeScene)
    drawStructuralPreview(activeScene)
  })
}

function drawStructuralLayer(scene: StructuralRenderScene) {
  const layer = scene.structuralLayer
  const walls = scene.buildWalls
  if (!layer || !walls) return
  layer.clear()
  for (const segment of walls.entries()) drawSegment(scene, layer, segment)
}

function drawSegment(scene: StructuralRenderScene, layer: Phaser.GameObjects.Graphics, segment: WallSegment) {
  if (segment.kind === 'wall') return
  const center = scene.grid.gridToScreen(segment.x, segment.y)
  const direction = scene.grid.getViewDirection(directionByOrientation[segment.orientation])
  const { start, end } = edgeEndpoints(scene, center.x, center.y, direction)
  const topStart = { x: start.x, y: start.y - 44 }
  const topEnd = { x: end.x, y: end.y - 44 }

  if (segment.kind === 'door') {
    layer.lineStyle(4, 0x7c3aed, 1)
      .beginPath()
      .moveTo(start.x, start.y).lineTo(topStart.x, topStart.y)
      .moveTo(end.x, end.y).lineTo(topEnd.x, topEnd.y)
      .moveTo(topStart.x, topStart.y).lineTo(topEnd.x, topEnd.y)
      .strokePath()
    return
  }

  const color = segment.kind === 'window' ? 0x7dd3fc : 0x22d3ee
  const alpha = segment.kind === 'window' ? .62 : .78
  layer.fillStyle(color, alpha)
    .beginPath()
    .moveTo(start.x, start.y - 8)
    .lineTo(end.x, end.y - 8)
    .lineTo(topEnd.x, topEnd.y + 5)
    .lineTo(topStart.x, topStart.y + 5)
    .closePath()
    .fillPath()
  layer.lineStyle(segment.kind === 'storefront' ? 3 : 2, 0xe0f2fe, .95)
    .beginPath()
    .moveTo(start.x, start.y - 8).lineTo(topStart.x, topStart.y + 5)
    .moveTo(end.x, end.y - 8).lineTo(topEnd.x, topEnd.y + 5)
    .moveTo(topStart.x, topStart.y + 5).lineTo(topEnd.x, topEnd.y + 5)
    .strokePath()
}

function drawStructuralPreview(scene: StructuralRenderScene & Record<string, any>) {
  const layer = scene.structuralPreviewLayer
  if (!layer) return
  layer.clear()
  const state = scene.buildTools?.snapshot
  const kind = state ? kindByTool[state.activeTool] : undefined
  if (!state || !kind) return

  const cell = scene.hovered as { x: number; y: number }
  if (!scene.grid.isInside(cell.x, cell.y)) return
  const orientation = orientationByDirection[state.rotation]
  const previous = scene.buildWalls?.get(cell.x, cell.y, orientation)
  const inside = requireWorldMapRuntime().isStoreInterior(cell)
  const valid = inside && (kind === 'wall' ? !previous : Boolean(previous))
  const color = valid ? previewColor(kind) : 0xef4444
  const center = scene.grid.gridToScreen(cell.x, cell.y)
  const direction = scene.grid.getViewDirection(state.rotation)
  const { start, end } = edgeEndpoints(scene, center.x, center.y, direction)

  layer.lineStyle(9, color, .88).beginPath().moveTo(start.x, start.y).lineTo(end.x, end.y).strokePath()
  layer.lineStyle(2, 0xffffff, .9).beginPath().moveTo(start.x, start.y - 5).lineTo(end.x, end.y - 5).strokePath()
  layer.fillStyle(color, .95).fillCircle((start.x + end.x) / 2, (start.y + end.y) / 2 - 10, 4)
}

function previewColor(kind: WallSegmentKind) {
  if (kind === 'door') return 0xa78bfa
  if (kind === 'window') return 0x7dd3fc
  if (kind === 'storefront') return 0x22d3ee
  return 0x22c55e
}

function edgeEndpoints(scene: StructuralRenderScene, x: number, y: number, direction: Direction) {
  const w = scene.grid.tileWidth / 2
  const h = scene.grid.tileHeight / 2
  return direction % 2 === 0
    ? { start: { x, y }, end: { x: x + w, y: y + h } }
    : { start: { x, y }, end: { x: x - w, y: y + h } }
}
