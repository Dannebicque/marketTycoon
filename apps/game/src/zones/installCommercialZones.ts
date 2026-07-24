import Phaser from 'phaser'
import { StoreScene } from '../phaser/StoreScene'
import { commercialZoneManager, commercialZoneRuntime } from './commercialZoneRuntime'

let installed = false

export function installCommercialZones() {
  if (installed) return
  installed = true
  const prototype = StoreScene.prototype as StoreScene & Record<string, any>
  const originalCreate = prototype.create
  prototype.create = function () {
    originalCreate.call(this)
    const scene = this as StoreScene & Record<string, any>
    scene.commercialZoneLayer = scene.add.graphics().setDepth(13)
    commercialZoneRuntime.setRedraw(() => drawCommercialZones(scene))
    commercialZoneRuntime.restore()
    let painting = false
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!commercialZoneRuntime.isEditing()) return
      painting = true
      paintAtPointer(scene, pointer)
    })
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!painting || (!pointer.leftButtonDown() && !pointer.rightButtonDown())) return
      paintAtPointer(scene, pointer)
    })
    scene.input.on('pointerup', () => { painting = false })
    drawCommercialZones(scene)
  }
  const originalRotate = prototype.rotateScene
  prototype.rotateScene = function (step: -1 | 1) {
    const result = originalRotate.call(this, step)
    drawCommercialZones(this as StoreScene & Record<string, any>)
    return result
  }
}

function paintAtPointer(scene: StoreScene & Record<string, any>, pointer: Phaser.Input.Pointer) {
  const world = pointer.positionToCamera(scene.cameras.main) as Phaser.Math.Vector2
  const cell = scene.grid.screenToGrid(world.x, world.y)
  if (!scene.grid.isInside(cell.x, cell.y)) return
  if (commercialZoneRuntime.eraseMode || pointer.rightButtonDown()) commercialZoneManager.erase(cell.x, cell.y)
  else if (commercialZoneRuntime.activeZoneId) commercialZoneManager.paint(commercialZoneRuntime.activeZoneId, cell.x, cell.y)
  commercialZoneRuntime.notifyChanged()
}

function drawCommercialZones(scene: StoreScene & Record<string, any>) {
  const layer = scene.commercialZoneLayer as Phaser.GameObjects.Graphics | undefined
  if (!layer) return
  layer.clear()
  const editing = commercialZoneRuntime.isEditing()
  for (const zone of commercialZoneManager.getZones()) {
    const sector = commercialZoneManager.getDefinition(zone.sectorKey)
    if (!sector) continue
    for (const cell of zone.cells) {
      const center = scene.grid.gridToScreen(cell.x, cell.y)
      const halfWidth = scene.grid.tileWidth / 2
      const halfHeight = scene.grid.tileHeight / 2
      layer.fillStyle(sector.color, editing ? .34 : .08)
      layer.lineStyle(zone.id === commercialZoneRuntime.activeZoneId && editing ? 3 : 1, sector.color, editing ? .9 : .22)
      layer.beginPath()
      layer.moveTo(center.x, center.y)
      layer.lineTo(center.x + halfWidth, center.y + halfHeight)
      layer.lineTo(center.x, center.y + scene.grid.tileHeight)
      layer.lineTo(center.x - halfWidth, center.y + halfHeight)
      layer.closePath()
      layer.fillPath()
      layer.strokePath()
    }
  }
}
