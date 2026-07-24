import Phaser from 'phaser'
import type { BuildCommand } from '@market-tycoon/build-mode'
import { StoreScene } from '../phaser/StoreScene'
import type { BuildMutationApi } from '../phaser/installBuildModeHistory'
import { commercialZoneManager, commercialZoneRuntime } from './commercialZoneRuntime'

interface CommercialZoneScene extends StoreScene {
  buildMutations?: BuildMutationApi
  commercialZoneLayer?: Phaser.GameObjects.Graphics
}

type CommercialZoneState = ReturnType<typeof commercialZoneManager.exportState>

let installed = false

export function installCommercialZones() {
  if (installed) return
  installed = true
  const prototype = StoreScene.prototype as StoreScene & Record<string, any>
  const originalCreate = prototype.create
  prototype.create = function () {
    originalCreate.call(this)
    const scene = this as CommercialZoneScene
    scene.commercialZoneLayer = scene.add.graphics().setDepth(13)
    commercialZoneRuntime.setRedraw(() => drawCommercialZones(scene))
    commercialZoneRuntime.setShelfCoverageResolver(() => scene.grid.getBuildings('shelf').map((building: any) => ({
      buildingId: building.id,
      ...commercialZoneManager.getCoverage(scene.grid.getFootprint(building.definition, building.gridX, building.gridY, building.direction)),
    })))
    commercialZoneRuntime.restore()
    let painting = false
    let beforePaint: CommercialZoneState | undefined

    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!commercialZoneRuntime.isEditing()) return
      painting = true
      beforePaint = cloneState(commercialZoneManager.exportState())
      paintAtPointer(scene, pointer)
    })
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!painting || (!pointer.leftButtonDown() && !pointer.rightButtonDown())) return
      paintAtPointer(scene, pointer)
    })
    scene.input.on('pointerup', () => {
      if (!painting) return
      painting = false
      const afterPaint = cloneState(commercialZoneManager.exportState())
      if (beforePaint && JSON.stringify(beforePaint) !== JSON.stringify(afterPaint)) {
        recordZonePainting(scene, beforePaint, afterPaint)
      }
      beforePaint = undefined
    })
    drawCommercialZones(scene)
  }
  const originalRotate = prototype.rotateScene
  prototype.rotateScene = function (step: -1 | 1) {
    const result = originalRotate.call(this, step)
    drawCommercialZones(this as CommercialZoneScene)
    return result
  }
}

function recordZonePainting(scene: CommercialZoneScene, before: CommercialZoneState, after: CommercialZoneState) {
  const history = scene.buildMutations?.history
  if (!history) return
  const apply = (state: CommercialZoneState) => {
    commercialZoneManager.importState(cloneState(state))
    commercialZoneRuntime.notifyChanged()
    return true
  }
  const command: BuildCommand = {
    label: commercialZoneRuntime.eraseMode ? 'Effacer une zone commerciale' : 'Peindre une zone commerciale',
    execute: () => apply(after),
    undo: () => apply(before),
  }
  history.record(command)
}

function cloneState(state: CommercialZoneState): CommercialZoneState {
  return JSON.parse(JSON.stringify(state)) as CommercialZoneState
}

function paintAtPointer(scene: StoreScene & Record<string, any>, pointer: Phaser.Input.Pointer) {
  const world = pointer.positionToCamera(scene.cameras.main) as Phaser.Math.Vector2
  const cell = scene.grid.screenToGrid(world.x, world.y)
  if (!scene.grid.isInside(cell.x, cell.y)) return
  if (commercialZoneRuntime.eraseMode || pointer.rightButtonDown()) commercialZoneManager.erase(cell.x, cell.y)
  else if (commercialZoneRuntime.activeZoneId) commercialZoneManager.paint(commercialZoneRuntime.activeZoneId, cell.x, cell.y)
  commercialZoneRuntime.notifyChanged()
}

function drawCommercialZones(scene: CommercialZoneScene) {
  const layer = scene.commercialZoneLayer
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
