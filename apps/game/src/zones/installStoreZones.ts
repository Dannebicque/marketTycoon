import Phaser from 'phaser'
import { validateZones } from '@market-tycoon/store-zones'
import { StoreScene } from '../phaser/StoreScene'
import { storeZoneManager, zoneRuntime } from './zoneRuntime'

let installed = false

export function installStoreZones() {
  if (installed) return
  installed = true

  const prototype = StoreScene.prototype as StoreScene & Record<string, any>

  const originalSelect = prototype.select
  prototype.select = function (...args: any[]) {
    zoneRuntime.activateBuildingTool()
    return originalSelect.apply(this, args)
  }

  const originalDrawPreview = prototype.drawPreview
  prototype.drawPreview = function () {
    if (!zoneRuntime.isBuildingMode()) {
      ;(this as StoreScene & Record<string, any>).previewLayer?.clear()
      return
    }
    return originalDrawPreview.call(this)
  }

  const originalSelectBuilding = prototype.selectBuilding
  prototype.selectBuilding = function (buildingId: string | null) {
    if (zoneRuntime.isEditing() && buildingId) return
    return originalSelectBuilding.call(this, buildingId)
  }

  const originalCreate = prototype.create
  prototype.create = function () {
    originalCreate.call(this)
    const scene = this as StoreScene & Record<string, any>
    scene.zoneLayer = scene.add.graphics().setDepth(12)
    zoneRuntime.setRedraw(() => drawZones(scene))
    zoneRuntime.setValidator(() => validateZones(storeZoneManager.getCells(), zoneRuntime.definitions, scene.grid))
    installGridValidationHooks(scene)
    zoneRuntime.restore()

    window.setTimeout(() => (document.querySelector('.palette-close') as HTMLButtonElement | null)?.click(), 0)

    let painting = false
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!zoneRuntime.isEditing()) return
      painting = true
      scene.selectedBuildingId = null
      scene.selectionLayer?.clear()
      paintAtPointer(scene, pointer)
    })
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!painting || (!pointer.leftButtonDown() && !pointer.rightButtonDown())) return
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
    if (!zoneRuntime.isBuildingMode()) return
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

  const originalPlaceDraggedWall = prototype.placeDraggedWall
  prototype.placeDraggedWall = function () {
    if (!zoneRuntime.isBuildingMode()) return
    return originalPlaceDraggedWall.call(this)
  }
}

function installGridValidationHooks(scene: StoreScene & Record<string, any>) {
  const originalPlace = scene.grid.place.bind(scene.grid)
  scene.grid.place = (...args: any[]) => {
    const result = originalPlace(...args)
    if (result) queueMicrotask(() => zoneRuntime.revalidate())
    return result
  }
  const originalRemoveAt = scene.grid.removeAt.bind(scene.grid)
  scene.grid.removeAt = (...args: any[]) => {
    const result = originalRemoveAt(...args)
    if (result) queueMicrotask(() => zoneRuntime.revalidate())
    return result
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
  const invalidCells = new Set(zoneRuntime.validation.invalidCellKeys)
  const editing = zoneRuntime.isEditing()

  for (const cell of storeZoneManager.getCells()) {
    const definition = storeZoneManager.getDefinition(cell.zoneKey)
    if (!definition) continue

    const center = scene.grid.gridToScreen(cell.x, cell.y)
    const halfWidth = scene.grid.tileWidth / 2
    const halfHeight = scene.grid.tileHeight / 2
    const invalid = invalidCells.has(`${cell.x}:${cell.y}`)

    // Always retain the semantic color of the zone. Invalidity is represented by
    // a red outline and a small warning marker instead of replacing the fill.
    layer.fillStyle(definition.color, editing ? .3 : .045)
    layer.lineStyle(invalid && editing ? 3 : 1, invalid && editing ? 0xef4444 : definition.color, editing ? .78 : .1)
    layer.beginPath()
    layer.moveTo(center.x, center.y)
    layer.lineTo(center.x + halfWidth, center.y + halfHeight)
    layer.lineTo(center.x, center.y + scene.grid.tileHeight)
    layer.lineTo(center.x - halfWidth, center.y + halfHeight)
    layer.closePath()
    layer.fillPath()
    layer.strokePath()

    if (invalid && editing) {
      layer.fillStyle(0xef4444, .95)
      layer.fillCircle(center.x, center.y + halfHeight, 3)
    }
  }
}
