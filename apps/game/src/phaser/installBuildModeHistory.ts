import { BuildHistory, DemolitionRefundPolicy, type BuildCommand, type BuildDifficulty } from '@market-tycoon/build-mode'
import { getBuildingDefinition } from '@market-tycoon/catalog'
import type { Direction, GridManager, PlacedBuilding, PlacedEdge } from '@market-tycoon/simulation-engine'
import { StoreScene } from './StoreScene'

const BUILD_DIFFICULTY_STORAGE_KEY = 'market-tycoon.build-difficulty'

interface InventorySlotSnapshot {
  id: string
  productKey: string | null
  quantity: number
  capacity: number
  averageUnitCost: number
}

export interface BuildMutationApi {
  history: BuildHistory
  placeRaw: GridManager['place']
  removeRaw: GridManager['removeAt']
  refresh(): void
  restoreInventory(buildingId: string, slots?: InventorySlotSnapshot[]): void
}

interface BuildModeScene extends StoreScene {
  buildHistory?: BuildHistory
  buildMutations?: BuildMutationApi
}

type Placement = PlacedBuilding | PlacedEdge

interface PlacementSnapshot {
  definition: ReturnType<typeof getBuildingDefinition> extends infer T ? Exclude<T, undefined> : never
  x: number
  y: number
  direction: Direction
  inventory?: InventorySlotSnapshot[]
}

let installed = false
let activeHistory: BuildHistory | undefined
let activeScene: StoreScene | undefined
const refundPolicy = new DemolitionRefundPolicy(readDifficulty())

export function installBuildModeHistory() {
  if (installed) return
  installed = true

  const originalCreate = StoreScene.prototype.create
  StoreScene.prototype.create = function createWithBuildHistory(this: BuildModeScene) {
    originalCreate.call(this)
    const history = new BuildHistory(150)
    this.buildHistory = history
    activeHistory = history
    activeScene = this
    installGridHistory(this, this.grid, history)
    installKeyboardHistory(this, history)
    history.subscribe(snapshot => {
      window.dispatchEvent(new CustomEvent('market-tycoon:build-history-changed', { detail: snapshot }))
    })
    emitRefundPolicy()
  }

  window.addEventListener('market-tycoon:build-undo', () => runHistoryAction('undo'))
  window.addEventListener('market-tycoon:build-redo', () => runHistoryAction('redo'))
  window.addEventListener('market-tycoon:build-difficulty-change', event => {
    const difficulty = (event as CustomEvent<{ difficulty: BuildDifficulty }>).detail?.difficulty
    if (!difficulty) return
    refundPolicy.setDifficulty(difficulty)
    localStorage.setItem(BUILD_DIFFICULTY_STORAGE_KEY, difficulty)
    emitRefundPolicy()
  })
}

function readDifficulty(): BuildDifficulty {
  const value = localStorage.getItem(BUILD_DIFFICULTY_STORAGE_KEY)
  return value === 'relaxed' || value === 'hard' || value === 'expert' ? value : 'standard'
}

function emitRefundPolicy() {
  window.dispatchEvent(new CustomEvent('market-tycoon:demolition-refund-policy', {
    detail: {
      difficulty: refundPolicy.currentDifficulty,
      refundRate: refundPolicy.refundRate,
    },
  }))
}

function runHistoryAction(action: 'undo' | 'redo') {
  if (!activeHistory || !activeScene) return
  const changed = action === 'undo' ? activeHistory.undo() : activeHistory.redo()
  if (changed) setSceneStatus(activeScene, action === 'undo' ? 'Action annulée.' : 'Action rétablie.')
}

function installGridHistory(scene: BuildModeScene, grid: GridManager, history: BuildHistory) {
  const rawPlace = grid.place.bind(grid)
  const rawRemoveAt = grid.removeAt.bind(grid)
  let replaying = false

  const refresh = () => refreshScene(scene)
  const restoreInventory = (buildingId: string, slots?: InventorySlotSnapshot[]) => {
    if (!slots?.length) return
    const inventory = scene.simulation.getEquipmentInventory(buildingId)
    if (!inventory) return
    slots.forEach((saved, index) => {
      const target = inventory.compartments.find(slot => slot.id === saved.id) ?? inventory.compartments[index]
      if (target) Object.assign(target, saved)
    })
  }

  scene.buildMutations = {
    history,
    placeRaw: rawPlace,
    removeRaw: rawRemoveAt,
    refresh,
    restoreInventory,
  }

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
        refresh()
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
        refresh()
        return true
      },
    }
    history.record(command)
    return placed
  }

  grid.removeAt = (x, y, direction) => {
    const snapshot = capturePlacement(scene, grid, x, y, direction)
    const removed = rawRemoveAt(x, y, direction)
    if (!removed || replaying || !snapshot) return removed

    const refund = refundPolicy.calculate(snapshot.definition.price)
    applyDemolitionRefund(scene, refund)
    setSceneStatus(scene, refund > 0
      ? `${snapshot.definition.name} supprimé · ${refund.toLocaleString('fr-FR')} € récupérés.`
      : `${snapshot.definition.name} supprimé · aucun remboursement.`)

    let current: Placement | null = null
    const command: BuildCommand = {
      label: `Supprimer ${snapshot.definition.name}`,
      execute: () => {
        replaying = true
        const result = rawRemoveAt(snapshot.x, snapshot.y, snapshot.direction)
        replaying = false
        if (!result) return false
        applyDemolitionRefund(scene, refund)
        current = null
        refresh()
        return true
      },
      undo: () => {
        if (!scene.simulation.canSpend(refund)) return false
        replaying = true
        current = rawPlace(snapshot.definition, snapshot.x, snapshot.y, snapshot.direction)
        replaying = false
        if (!current) return false
        if (refund > 0) scene.simulation.spend(refund)
        refresh()
        if ('definition' in current) restoreInventory(current.id, snapshot.inventory)
        refresh()
        return true
      },
    }
    history.record(command)
    refresh()
    return true
  }
}

function capturePlacement(scene: StoreScene, grid: GridManager, x: number, y: number, direction?: Direction): PlacementSnapshot | undefined {
  if (direction !== undefined) {
    const edge = grid.getEdges().find(item => item.gridX === x && item.gridY === y && item.direction === direction)
    const definition = edge ? getBuildingDefinition(edge.definitionKey) : undefined
    if (edge && definition) return { definition, x, y, direction }
  }
  const building = grid.getBuildingAt(x, y)
  if (!building) return undefined
  const inventory = scene.simulation.getEquipmentInventory(building.id)
  return {
    definition: building.definition,
    x: building.gridX,
    y: building.gridY,
    direction: building.direction,
    inventory: inventory?.compartments.map(slot => ({
      id: slot.id,
      productKey: slot.productKey,
      quantity: slot.quantity,
      capacity: slot.capacity,
      averageUnitCost: slot.averageUnitCost,
    })),
  }
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

function applyDemolitionRefund(scene: StoreScene, amount: number) {
  scene.simulation.metrics.cash += amount
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
  ;(scene as any).setStatus(message, '#86efac')
}
