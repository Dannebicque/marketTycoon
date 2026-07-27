import Phaser from 'phaser'
import type { MapRect } from '@market-tycoon/world-map'
import { StoreScene } from './StoreScene'
import { requireWorldMapRuntime } from '../world/worldMapRuntime'

interface OwnedLandScene extends StoreScene {
  ownedLandLayer?: Phaser.GameObjects.Graphics
}

let installed = false
let activeScene: OwnedLandScene | undefined

export function installOwnedLandOverlay() {
  if (installed) return
  installed = true

  const originalCreate = StoreScene.prototype.create
  StoreScene.prototype.create = function createWithOwnedLandOverlay(this: OwnedLandScene) {
    originalCreate.call(this)
    activeScene = this
    this.ownedLandLayer = this.add.graphics().setDepth(6)
    drawOwnedLand(this)
  }

  window.addEventListener('market-tycoon:building-runtime-changed', redraw)
  window.addEventListener('market-tycoon:parcel-action-result', redraw)
}

function redraw() {
  if (activeScene) drawOwnedLand(activeScene)
}

function drawOwnedLand(scene: OwnedLandScene) {
  const layer = scene.ownedLandLayer
  if (!layer) return
  layer.clear()
  const runtime = requireWorldMapRuntime()

  for (const parcel of runtime.getOwnedParcels()) {
    drawRectBoundary(scene, layer, parcel.bounds, 4, 0xf8fafc, .92)
  }

  for (const area of runtime.getPlayerBuildingState()?.interiorAreas ?? []) {
    drawRectBoundary(scene, layer, area, 3, 0x4ade80, .95)
  }
}

function drawRectBoundary(scene: StoreScene, layer: Phaser.GameObjects.Graphics, bounds: MapRect, width: number, color: number, alpha: number) {
  const top = scene.grid.gridToScreen(bounds.x, bounds.y)
  const right = scene.grid.gridToScreen(bounds.x + bounds.width - 1, bounds.y)
  const bottom = scene.grid.gridToScreen(bounds.x + bounds.width - 1, bounds.y + bounds.height - 1)
  const left = scene.grid.gridToScreen(bounds.x, bounds.y + bounds.height - 1)
  const halfWidth = scene.grid.tileWidth / 2
  const halfHeight = scene.grid.tileHeight / 2
  layer.lineStyle(width, color, alpha)
    .beginPath()
    .moveTo(top.x, top.y)
    .lineTo(right.x + halfWidth, right.y + halfHeight)
    .lineTo(bottom.x, bottom.y + scene.grid.tileHeight)
    .lineTo(left.x - halfWidth, left.y + halfHeight)
    .closePath()
    .strokePath()
}
