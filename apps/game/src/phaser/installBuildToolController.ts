import { BuildToolController, invalidPlacement, validPlacement, type PlacementValidationResult } from '@market-tycoon/build-mode'
import type { BuildingDefinition } from '@market-tycoon/catalog'
import { StoreScene } from './StoreScene'
import { requireWorldMapRuntime } from '../world/worldMapRuntime'
import { storeZoneManager } from '../zones/zoneRuntime'

interface BuildScene extends StoreScene {
  buildTools?: BuildToolController
}

let installed = false

export function installBuildToolController() {
  if (installed) return
  installed = true

  const prototype = StoreScene.prototype as StoreScene & Record<string, any>
  const originalCreate = prototype.create
  prototype.create = function () {
    originalCreate.call(this)
    const scene = this as BuildScene & Record<string, any>
    const controller = new BuildToolController()
    scene.buildTools = controller

    const selected = scene.selected as BuildingDefinition | undefined
    if (selected) controller.selectDefinition(selected.key, selected.category === 'wall' ? 'wall' : 'place')

    scene.input.keyboard?.on('keydown-R', () => controller.rotate(1))
    controller.subscribe(state => {
      window.dispatchEvent(new CustomEvent('market-tycoon:build-tool-changed', { detail: state }))
    })
  }

  const originalSelect = prototype.select
  prototype.select = function (key: string) {
    const result = originalSelect.call(this, key)
    const scene = this as BuildScene & Record<string, any>
    const selected = scene.selected as BuildingDefinition | undefined
    if (selected) scene.buildTools?.selectDefinition(selected.key, selected.category === 'wall' ? 'wall' : 'place')
    return result
  }

  const originalPlaceSelected = prototype.placeSelected
  prototype.placeSelected = function () {
    const scene = this as BuildScene & Record<string, any>
    const validation = validatePlacement(scene)
    window.dispatchEvent(new CustomEvent('market-tycoon:placement-validation', { detail: validation }))
    if (!validation.valid) {
      scene.setStatus(validation.message ?? 'Placement impossible.', '#f87171')
      return
    }
    return originalPlaceSelected.call(this)
  }
}

function validatePlacement(scene: BuildScene & Record<string, any>): PlacementValidationResult {
  const selected = scene.selected as BuildingDefinition | undefined
  const hovered = scene.hovered as { x: number; y: number } | undefined
  if (!selected || !hovered) return invalidPlacement('unknown', 'Aucun outil de construction actif.')
  if (!scene.grid.isInside(hovered.x, hovered.y)) return invalidPlacement('outside-grid', 'Cette cellule est en dehors de la carte.')

  const footprint = scene.grid.getFootprint(selected, hovered.x, hovered.y, scene.direction)
  const cells = footprint.length ? footprint : [hovered]
  if (!cells.length) return invalidPlacement('invalid-footprint', 'L’emprise de cet équipement est invalide.')

  const world = requireWorldMapRuntime()
  if (!cells.every((cell: { x: number; y: number }) => world.isStoreInterior(cell))) {
    return invalidPlacement('outside-store', 'Cet équipement doit être placé à l’intérieur du magasin.')
  }

  const edgeTool = selected.category === 'wall' || selected.category === 'door'
  if (!edgeTool && cells.some((cell: { x: number; y: number }) => scene.grid.getBuildingAt(cell.x, cell.y))) {
    return invalidPlacement('occupied', 'Une partie de l’emprise est déjà occupée.')
  }

  if (!edgeTool) {
    const incompatible = cells.find((cell: { x: number; y: number }) => {
      const zoneKey = storeZoneManager.getZoneKeyAt(cell.x, cell.y)
      return !storeZoneManager.isBuildingAllowed(zoneKey, selected.category)
    })
    if (incompatible) return invalidPlacement('zone-incompatible', 'Cet équipement n’est pas autorisé dans cette zone commerciale.')
  }

  if (!scene.simulation.canSpend(selected.price)) return invalidPlacement('insufficient-funds', `Budget insuffisant : ${selected.price.toLocaleString('fr-FR')} € requis.`)
  if (!scene.grid.canPlace(selected, hovered.x, hovered.y, scene.direction)) return invalidPlacement('unknown', 'Le placement entre en conflit avec la grille ou une structure existante.')
  return validPlacement()
}
