import type { BuildCommand, BuildToolController } from '@market-tycoon/build-mode'
import type { Direction, PlacedBuilding } from '@market-tycoon/simulation-engine'
import { StoreScene } from './StoreScene'
import type { BuildMutationApi } from './installBuildModeHistory'
import { requireWorldMapRuntime } from '../world/worldMapRuntime'
import { storeZoneManager } from '../zones/zoneRuntime'

interface InteractionScene extends StoreScene {
  buildTools?: BuildToolController
  buildMutations?: BuildMutationApi
}

interface InventorySlotSnapshot {
  id: string
  productKey: string | null
  quantity: number
  capacity: number
  averageUnitCost: number
}

interface BuildingPosition {
  x: number
  y: number
  direction: Direction
}

let installed = false
let movingBuildingId: string | undefined

export function installBuildInteractionTools() {
  if (installed) return
  installed = true

  const prototype = StoreScene.prototype as StoreScene & Record<string, any>

  const originalSelectBuilding = prototype.selectBuilding
  prototype.selectBuilding = function (buildingId: string | null) {
    const scene = this as InteractionScene & Record<string, any>
    const tool = scene.buildTools?.snapshot.activeTool ?? 'select'

    if (tool === 'remove' && buildingId) {
      const building = findBuilding(scene, buildingId)
      if (!building) return
      const removed = scene.grid.removeAt(building.gridX, building.gridY, building.direction)
      if (removed) {
        movingBuildingId = undefined
        originalSelectBuilding.call(this, null)
        scene.setStatus(`${building.definition.name} supprimé.`, '#86efac')
        scene.drawBuildings()
      }
      return
    }

    if (tool === 'move') {
      movingBuildingId = buildingId ?? undefined
      originalSelectBuilding.call(this, buildingId)
      if (buildingId) scene.setStatus('Choisissez la nouvelle position de cet équipement.', '#93c5fd')
      return
    }

    movingBuildingId = undefined
    return originalSelectBuilding.call(this, buildingId)
  }

  const originalPlaceSelected = prototype.placeSelected
  prototype.placeSelected = function () {
    const scene = this as InteractionScene & Record<string, any>
    if (scene.buildTools?.snapshot.activeTool !== 'move') return originalPlaceSelected.call(this)
    return moveSelectedBuilding(scene)
  }

  window.addEventListener('market-tycoon:build-tool-changed', event => {
    const tool = (event as CustomEvent<{ activeTool: string }>).detail?.activeTool
    if (tool !== 'move') movingBuildingId = undefined
  })
}

function moveSelectedBuilding(scene: InteractionScene & Record<string, any>) {
  if (!movingBuildingId) {
    scene.setStatus('Sélectionnez d’abord un équipement à déplacer.', '#fbbf24')
    return
  }

  const source = findBuilding(scene, movingBuildingId)
  const hovered = scene.hovered as { x: number; y: number } | undefined
  const mutations = scene.buildMutations
  if (!source || !hovered || !mutations) return

  const target: BuildingPosition = { x: hovered.x, y: hovered.y, direction: source.direction }
  const origin: BuildingPosition = { x: source.gridX, y: source.gridY, direction: source.direction }
  if (target.x === origin.x && target.y === origin.y) {
    scene.setStatus('L’équipement est déjà à cette position.', '#fbbf24')
    return
  }

  const validation = validateMove(scene, source, target)
  if (validation) {
    scene.setStatus(validation, '#f87171')
    return
  }

  const inventory = snapshotInventory(scene, source.id)
  let currentId = source.id
  let currentPosition = origin

  const moveTo = (destination: BuildingPosition) => {
    const current = findBuilding(scene, currentId)
    if (!current) return false
    const removed = mutations.removeRaw(current.gridX, current.gridY, current.direction)
    if (!removed) return false

    const placed = mutations.placeRaw(source.definition, destination.x, destination.y, destination.direction)
    if (!placed || !('definition' in placed)) {
      mutations.placeRaw(source.definition, current.gridX, current.gridY, current.direction)
      mutations.refresh()
      return false
    }

    currentId = placed.id
    currentPosition = destination
    mutations.refresh()
    mutations.restoreInventory(currentId, inventory)
    mutations.refresh()
    scene.selectedBuildingId = currentId
    scene.drawBuildings()
    return true
  }

  if (!moveTo(target)) {
    scene.setStatus('Le déplacement n’a pas pu être effectué.', '#f87171')
    return
  }

  const command: BuildCommand = {
    label: `Déplacer ${source.definition.name}`,
    execute: () => currentPosition.x === target.x && currentPosition.y === target.y ? true : moveTo(target),
    undo: () => currentPosition.x === origin.x && currentPosition.y === origin.y ? true : moveTo(origin),
  }
  mutations.history.record(command)
  movingBuildingId = currentId
  scene.setStatus(`${source.definition.name} déplacé.`, '#86efac')
}

function validateMove(scene: InteractionScene & Record<string, any>, source: PlacedBuilding, target: BuildingPosition) {
  const footprint = scene.grid.getFootprint(source.definition, target.x, target.y, target.direction)
  if (!footprint.length || !footprint.every((cell: { x: number; y: number }) => scene.grid.isInside(cell.x, cell.y))) {
    return 'La nouvelle emprise sort de la carte.'
  }
  const world = requireWorldMapRuntime()
  if (!footprint.every((cell: { x: number; y: number }) => world.isStoreInterior(cell))) {
    return 'L’équipement doit rester à l’intérieur du magasin.'
  }
  const incompatible = footprint.some((cell: { x: number; y: number }) => {
    const zoneKey = storeZoneManager.getZoneKeyAt(cell.x, cell.y)
    return !storeZoneManager.isBuildingAllowed(zoneKey, source.definition.category)
  })
  if (incompatible) return 'Cet équipement n’est pas autorisé dans la zone de destination.'

  const occupied = footprint.some((cell: { x: number; y: number }) => {
    const building = scene.grid.getBuildingAt(cell.x, cell.y)
    return building && building.id !== source.id
  })
  if (occupied) return 'La zone de destination est déjà occupée.'
  return undefined
}

function snapshotInventory(scene: StoreScene, buildingId: string): InventorySlotSnapshot[] | undefined {
  return scene.simulation.getEquipmentInventory(buildingId)?.compartments.map(slot => ({
    id: slot.id,
    productKey: slot.productKey,
    quantity: slot.quantity,
    capacity: slot.capacity,
    averageUnitCost: slot.averageUnitCost,
  }))
}

function findBuilding(scene: StoreScene, buildingId: string) {
  return scene.grid.getBuildings().find(building => building.id === buildingId)
}
