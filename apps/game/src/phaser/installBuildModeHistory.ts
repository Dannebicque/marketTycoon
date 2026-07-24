import { BuildHistory, type BuildCommand } from '@market-tycoon/build-mode'
import type { BuildingDefinition } from '@market-tycoon/catalog'
import type { Direction, GridManager, PlacedBuilding, PlacedEdge } from '@market-tycoon/simulation-engine'
import { StoreScene } from './StoreScene'

interface BuildModeScene extends StoreScene {
  buildHistory?: BuildHistory
}

type Placement = PlacedBuilding | PlacedEdge

let installed = false

export function installBuildModeHistory() {
  if (installed) return
  installed = true

  const originalCreate = StoreScene.prototype.create
  StoreScene.prototype.create = function createWithBuildHistory(this: BuildModeScene) {
    originalCreate.call(this)
    const history = new BuildHistory(150)
    this.buildHistory = history
    installGridHistory(this, this.grid, history)
    installKeyboardHistory(this, history)
    history.subscribe(snapshot => {
      window.dispatchEvent(new CustomEvent('market-tycoon:build-history-changed', { detail: snapshot }))
    })
  }
}

function installGridHistory(scene: StoreScene, grid: GridManager, history: BuildHistory) {
  const rawPlace = grid.place.bind(grid)
  const rawRemoveAt = grid.removeAt.bind(grid)
  let replaying = false

  grid.place = (definition, x, y, direction) => {
    const placed = rawPlace(definition, x, y, direction)
    if (!placed || replaying) return placed

    let current: Placement | null = placed
    const command: BuildCommand = {
      label: `Poser ${definition.name}`,
      execute: () => {
        if (!scene.simulation.canSpend(definition.price)) return false
        replaying = true
        current = rawPlace(definition, x, y, direction)
        replaying = false
        if (!current) return false
        scene.simulation.spend(definition.price)
        refreshScene(scene)
        return true
      },
      undo: () => {
        if (!current) return false
        replaying = true
        const removed = rawRemoveAt(x, y, direction)
        replaying = false
        if (!removed) return false
        refundConstruction(scene, definition.price)
        current = null
        refreshScene(scene)
        return true
      },
    }
    history.record(command)
    return placed
  }

  grid.removeAt = (x, y, direction) => {
    const snapshot = capturePlacement(grid, x, y, direction)
    const removed = rawRemoveAt(x, y, direction)
    if (!removed || replaying || !snapshot) return removed

    let current: Placement | null = null
    const command: BuildCommand = {
      label: `Supprimer ${snapshot.definition.name}`,
      execute: () => {
        replaying = true
        const result = rawRemoveAt(snapshot.x, snapshot.y, snapshot.direction)
        replaying = false
        if (!result) return false
        current = null
        refreshScene(scene)
        return true
      },
      undo: () => {
        replaying = true
        current = rawPlace(snapshot.definition, snapshot.x, snapshot.y, snapshot.direction)
        replaying = false
        if (!current) return false
        refreshScene(scene)
        return true
      },
    }
    history.record(command)
    return true
  }
}

function capturePlacement(grid: GridManager, x: number, y: number, direction?: Direction) {
  if (direction !== undefined) {
    const edge = grid.getEdges().find(item => item.gridX === x && item.gridY === y && item.direction === direction)
    if (edge) return { definition: requireDefinition(edge), x, y, direction }
  }
  const building = grid.getBuildingAt(x, y)
  return building ? { definition: building.definition, x: building.gridX, y: building.gridY, direction: building.direction } : undefined
}

function requireDefinition(edge: PlacedEdge): BuildingDefinition {
  const definition = (edge as PlacedEdge & { definition?: BuildingDefinition }).definition
  if (definition) return definition
  throw new Error(`Définition absente pour l'arête ${edge.definitionKey}.`)
}

function installKeyboardHistory(scene: StoreScene, history: BuildHistory) {
  scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey)) return
    const key = event.key.toLowerCase()
    if (key === 'z') {
      event.preventDefault()
      const changed = event.shiftKey ? history.redo() : history.undo()
      if (changed) setSceneStatus(scene, event.shiftKey ? 'Action rétablie.' : 'Action annulée.')
    } else if (key === 'y') {
      event.preventDefault()
      if (history.redo()) setSceneStatus(scene, 'Action rétablie.')
    }
  })
}

function refundConstruction(scene: StoreScene, amount: number) {
  scene.simulation.metrics.cash += amount
  scene.simulation.metrics.constructionExpenses = Math.max(0, scene.simulation.metrics.constructionExpenses - amount)
}

function refreshScene(scene: StoreScene) {
  scene.simulation.syncBuildings(scene.grid.getBuildings())
  scene.drawBuildings()
}

function setSceneStatus(scene: StoreScene, message: string) {
  ;(scene as StoreScene & { setStatus(message: string, color?: string): void }).setStatus(message, '#86efac')
}
