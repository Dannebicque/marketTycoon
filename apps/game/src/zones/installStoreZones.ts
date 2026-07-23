import Phaser from 'phaser'
import { validateZones } from '@market-tycoon/store-zones'
import { StoreScene } from '../phaser/StoreScene'
import { storeZoneManager, zoneRuntime } from './zoneRuntime'

let installed = false
let activeScene: (StoreScene & Record<string, any>) | undefined

interface WallDragState {
  x: number
  y: number
  direction: 0 | 1 | 2 | 3
}

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
    activeScene = scene
    scene.zoneLayer = scene.add.graphics().setDepth(12)
    scene.wallDragState = undefined
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
    scene.input.on('pointerup', () => {
      painting = false
      scene.wallDragState = undefined
    })
    drawZones(scene)
  }

  const originalRotate = prototype.rotateScene
  prototype.rotateScene = function (step: -1 | 1) {
    const scene = this as StoreScene & Record<string, any>
    scene.wallDragState = undefined
    const result = originalRotate.call(this, step)
    drawZones(scene)
    return result
  }

  window.addEventListener('market-tycoon:rotate', event => {
    const step = (event as CustomEvent<{ step: -1 | 1 }>).detail?.step
    if ((step === -1 || step === 1) && activeScene) activeScene.rotateScene(step)
  })

  const originalPlaceSelected = prototype.placeSelected
  prototype.placeSelected = function () {
    const scene = this as StoreScene & Record<string, any>
    if (!zoneRuntime.isBuildingMode()) return
    const selected = scene.selected
    const hovered = scene.hovered

    if (selected?.category === 'wall') {
      scene.wallDragState = {
        x: hovered.x,
        y: hovered.y,
        direction: scene.direction,
      } satisfies WallDragState
    }

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

  prototype.placeDraggedWall = function () {
    const scene = this as StoreScene & Record<string, any>
    if (!zoneRuntime.isBuildingMode()) return
    const drag = scene.wallDragState as WallDragState | undefined
    const selected = scene.selected
    const hovered = scene.hovered
    if (!drag || selected?.category !== 'wall' || !hovered) return

    const horizontal = drag.direction % 2 === 0
    const target = horizontal
      ? { x: hovered.x, y: drag.y }
      : { x: drag.x, y: hovered.y }
    const start = horizontal ? drag.x : drag.y
    const end = horizontal ? target.x : target.y
    const min = Math.min(start, end)
    const max = Math.max(start, end)
    const dragKey = `${drag.x}:${drag.y}:${drag.direction}:${target.x}:${target.y}`
    if (scene.lastDragKey === dragKey) return
    scene.lastDragKey = dragKey

    let placedCount = 0
    for (let cursor = min; cursor <= max; cursor++) {
      const x = horizontal ? cursor : drag.x
      const y = horizontal ? drag.y : cursor
      if (!scene.grid.isInside(x, y)) continue
      if (!scene.simulation.canSpend(selected.price)) break
      if (scene.grid.place(selected, x, y, drag.direction)) {
        scene.simulation.spend(selected.price)
        placedCount += 1
      }
    }

    if (placedCount) {
      scene.drawBuildings()
      scene.setStatus(`${placedCount} segment(s) de mur ajouté(s) · tracé ${horizontal ? 'horizontal' : 'vertical'}.`, '#86efac')
    }
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
