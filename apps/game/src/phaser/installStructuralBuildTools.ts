import {
  ConstructionOrderQueue,
  ConstructionScheduler,
  constructionMaterialCatalog,
  getWallSegmentProperties,
  isExteriorSegment,
  type ConstructionOrder,
  type WallMap,
  type WallOrientation,
  type WallSegmentKind,
} from '@market-tycoon/construction'
import type { BuildToolController, BuildToolKind } from '@market-tycoon/build-mode'
import { getBuildingDefinition } from '@market-tycoon/catalog'
import type { Direction } from '@market-tycoon/simulation-engine'
import { StoreScene } from './StoreScene'
import type { BuildMutationApi } from './installBuildModeHistory'
import { requireWorldMapRuntime } from '../world/worldMapRuntime'

interface StructuralScene extends StoreScene {
  buildTools?: BuildToolController
  buildMutations?: BuildMutationApi
  buildWalls?: WallMap
}

interface StructuralToolDefinition {
  kind: WallSegmentKind
  materialKey: string
  label: string
}

const STRUCTURAL_TOOLS: Partial<Record<BuildToolKind, StructuralToolDefinition>> = {
  wall: { kind: 'wall', materialKey: 'wall-standard', label: 'Mur' },
  door: { kind: 'door', materialKey: 'door-standard', label: 'Porte' },
  window: { kind: 'window', materialKey: 'window-standard', label: 'Fenêtre' },
  storefront: { kind: 'storefront', materialKey: 'storefront-standard', label: 'Vitrine' },
}
const orientationByDirection: Record<Direction, WallOrientation> = {
  0: 'north',
  1: 'east',
  2: 'south',
  3: 'west',
}

const orderQueue = new ConstructionOrderQueue()
const scheduler = new ConstructionScheduler(orderQueue)
let externalOrders: ConstructionOrder[] = []
let emittingOrders = false
let installed = false

export function installStructuralBuildTools() {
  if (installed) return
  installed = true

  scheduler.subscribe(() => emitCombinedOrders())
  window.addEventListener('market-tycoon:construction-orders-changed', event => {
    if (emittingOrders) return
    externalOrders = ((event as CustomEvent<{ orders: ConstructionOrder[] }>).detail?.orders ?? [])
      .filter(order => !order.id.startsWith('structure-'))
  })

  const prototype = StoreScene.prototype as StoreScene & Record<string, any>
  const originalCreate = prototype.create
  prototype.create = function () {
    originalCreate.call(this)
    const scene = this as StructuralScene
    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => handleStructuralPointer(scene, pointer))
  }

  const originalPlaceSelected = prototype.placeSelected
  prototype.placeSelected = function () {
    const tool = (this as StructuralScene).buildTools?.snapshot.activeTool
    if (tool && STRUCTURAL_TOOLS[tool]) return
    return originalPlaceSelected.call(this)
  }
}

function handleStructuralPointer(scene: StructuralScene & Record<string, any>, pointer: Phaser.Input.Pointer) {
  if (!pointer.leftButtonReleased()) return
  const state = scene.buildTools?.snapshot
  const tool = state ? STRUCTURAL_TOOLS[state.activeTool] : undefined
  if (!state || !tool) return

  const cell = scene.hovered as { x: number; y: number }
  const world = requireWorldMapRuntime()
  if (!scene.grid.isInside(cell.x, cell.y) || !world.isStoreInterior(cell)) {
    scene.setStatus('Les éléments structurels doivent être placés sur le bâtiment.', '#f87171')
    return
  }

  const walls = scene.buildWalls
  const mutations = scene.buildMutations
  const wallDefinition = getBuildingDefinition('wall')
  const doorDefinition = getBuildingDefinition('door')
  const material = constructionMaterialCatalog.get(tool.materialKey)
  if (!walls || !mutations || !wallDefinition || material?.kind !== 'wall') return

  const direction = state.rotation
  const orientation = orientationByDirection[direction]
  const previous = walls.get(cell.x, cell.y, orientation)
  const gridEdge = scene.grid.getEdges().find(edge => edge.gridX === cell.x && edge.gridY === cell.y && edge.axis === scene.grid.getEdgeAxis(direction))
  const candidate = { x: cell.x, y: cell.y, orientation, kind: tool.kind, materialKey: material.key }
  const properties = getWallSegmentProperties(tool.kind)

  if (tool.kind === 'wall' && (previous || gridEdge)) {
    scene.setStatus('Un segment existe déjà à cet emplacement.', '#f87171')
    return
  }
  if (tool.kind !== 'wall' && !previous && !gridEdge) {
    scene.setStatus(`Placez d’abord un mur avant d’ajouter une ${tool.label.toLowerCase()}.`, '#f87171')
    return
  }
  if (properties.facadeOnly && !isExteriorSegment(candidate, point => world.isStoreInterior(point))) {
    scene.setStatus(`${tool.label} uniquement disponible sur une façade extérieure.`, '#f87171')
    return
  }

  const previousMaterialCost = previous ? constructionMaterialCatalog.calculateCost(previous.materialKey, 1) : 0
  const cost = Math.max(0, constructionMaterialCatalog.calculateCost(material.key, 1) - previousMaterialCost)
  if (!scene.simulation.canSpend(cost) || !scene.simulation.spend(cost)) {
    scene.setStatus(`Trésorerie insuffisante · ${cost.toLocaleString('fr-FR')} € requis.`, '#f87171')
    return
  }

  const before = walls.snapshot()
  mutations.removeRaw(cell.x, cell.y, direction)
  walls.replace(candidate)
  const visualDefinition = tool.kind === 'door' && doorDefinition ? doorDefinition : wallDefinition
  if (!mutations.placeRaw(visualDefinition, cell.x, cell.y, direction)) {
    walls.restore(before)
    if (gridEdge) mutations.placeRaw(gridEdge.type === 'door' && doorDefinition ? doorDefinition : wallDefinition, cell.x, cell.y, direction)
    scene.simulation.refund(cost)
    scene.setStatus('Impossible de projeter cet élément dans la grille.', '#f87171')
    return
  }
  const after = walls.snapshot()
  mutations.refresh()
  emitStructuralChange()

  const order = orderQueue.create({
    kind: 'wall',
    label: `${tool.label} · ${material.name}`,
    cost,
    durationMs: 500,
    payload: { x: cell.x, y: cell.y, orientation, segmentKind: tool.kind, materialKey: material.key },
  })
  scheduler.schedule(order.id)

  const restoreSnapshot = (snapshot: typeof before, refund: boolean) => {
    mutations.removeRaw(cell.x, cell.y, direction)
    walls.restore(snapshot)
    const segment = walls.get(cell.x, cell.y, orientation)
    if (segment) {
      const definition = segment.kind === 'door' && doorDefinition ? doorDefinition : wallDefinition
      mutations.placeRaw(definition, cell.x, cell.y, direction)
    } else if (snapshot === before && gridEdge) {
      const definition = gridEdge.type === 'door' && doorDefinition ? doorDefinition : wallDefinition
      mutations.placeRaw(definition, cell.x, cell.y, direction)
    }
    if (refund) scene.simulation.refund(cost)
    mutations.refresh()
    emitStructuralChange()
    return true
  }

  mutations.history.record({
    label: order.label,
    undo: () => {
      scheduler.cancel(order.id)
      return restoreSnapshot(before, true)
    },
    execute: () => {
      if (!scene.simulation.canSpend(cost) || !scene.simulation.spend(cost)) return false
      const restored = restoreSnapshot(after, false)
      scheduler.restoreCompleted(order.id)
      return restored
    },
  })
  scene.setStatus(`${tool.label} planifiée · ${cost.toLocaleString('fr-FR')} €.`, '#86efac')
}

function emitStructuralChange() {
  window.dispatchEvent(new Event('market-tycoon:structural-runtime-changed'))
}

function emitCombinedOrders() {
  const structuralOrders = orderQueue.list().map(order => ({ ...order, id: `structure-${order.id}` }))
  emittingOrders = true
  window.dispatchEvent(new CustomEvent('market-tycoon:construction-orders-changed', {
    detail: { orders: [...externalOrders, ...structuralOrders] },
  }))
  emittingOrders = false
}
