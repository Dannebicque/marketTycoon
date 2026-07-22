import Phaser from 'phaser'
import { StoreScene } from '../phaser/StoreScene'
import { storeZoneManager, zoneRuntime } from './zoneRuntime'

let installed = false

export function installStoreZones() {
  if (installed) return
  installed = true

  const prototype = StoreScene.prototype as StoreScene & Record<string, any>
  const originalCreate = prototype.create
  prototype.create = function () {
    originalCreate.call(this)
    const scene = this as StoreScene & Record<string, any>
    scene.zoneLayer = scene.add.graphics().setDepth(12)
    zoneRuntime.setRedraw(() => drawZones(scene))
    zoneRuntime.restore()

    let painting = false
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!zoneRuntime.isEditing()) return
      painting = true
      paintAtPointer(scene, pointer)
    })
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!painting || !pointer.leftButtonDown()) return
      paintAtPointer(scene, pointer)
    })
    scene.input.on('pointerup', () => { painting = false })
    drawZones(scene)
  }

  const originalRotate = prototype.rotateScene
  prototype.rotateScene = function (step: -1 | 1) {
    const result = originalRotate.call(this, step)
    drawZones(this as StoreScene & Record<string, any>)
    return result
  }

  const originalPlaceSelected = prototype.placeSelected
  prototype.placeSelected = function () {
    const scene = this as StoreScene & Record<string, any>
    if (zoneRuntime.isEditing()) return
    const selected = scene.selected
    const hovered = scene.hovered
    if (selected && hovered && selected.category !== 'wall' && selected.category !== 'door') {
      const footprint = scene.grid.getFootprint(selected, hovered.x, hovered.y, scene.direction)
      const invalidCell = footprint.find((cell: { x: number; y: number }) => {
        const zoneKey = storeZoneManager.getZoneKeyAt(cell.x, cell.y)
        return !storeZoneManager.isBuildingAllowed(zoneKey, selected.category)
      })
      if (invalidCell) {
        const zone = storeZoneManager.getDefinition(storeZoneManager.getZoneKeyAt(invalidCell.x, invalidCell.y) ?? '')
        scene.setStatus(`Cet équipement n’est pas autorisé dans la zone ${zone?.name ?? 'sélectionnée'}.`, '#f87171')
        return
      }
    }
    return originalPlaceSelected.call(this)
  }
}

function paintAtPointer(scene: StoreScene & Record<string, any>, pointer: Phaser.Input.Pointer) {
  const world = pointer.positionToCamera(scene.cameras.main) as Phaser.Math.Vector2
  const cell = scene.grid.screenToGrid(world.x, world.y)
  if (!scene.grid.isInside(cell.x, cell.y)) return
  if (zoneRuntime.eraseMode || pointer.rightButtonDown()) storeZoneManager.erase(cell.x, cell.y)
  else if (zoneRuntime.activeZoneKey) storeZoneManager.paint(cell.x, cell.y, zoneRuntime.activeZoneKey)
  zoneRuntime.notifyChanged()
}

function drawZones(scene: StoreScene & Record<string, any>) {
  const layer = scene.zoneLayer as Phaser.GameObjects.Graphics | undefined
  if (!layer) return
  layer.clear()
  for (const cell of storeZoneManager.getCells()) {
    const definition = storeZoneManager.getDefinition(cell.zoneKey)
    if (!definition) continue
    const center = scene.grid.gridToScreen(cell.x, cell.y)
    const halfWidth = scene.grid.tileWidth / 2
    const halfHeight = scene.grid.tileHeight / 2
    layer.fillStyle(definition.color, zoneRuntime.isEditing() ? .38 : .13)
    layer.lineStyle(1, definition.color, zoneRuntime.isEditing() ? .85 : .25)
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
