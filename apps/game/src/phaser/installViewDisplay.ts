import Phaser from 'phaser'
import type { Direction, PlacedBuilding, PlacedEdge } from '@market-tycoon/simulation-engine'
import { StoreScene } from './StoreScene'
import { viewDisplayRuntime } from './viewDisplayRuntime'

let installed = false

export function installViewDisplay() {
  if (installed) return
  installed = true

  const prototype = StoreScene.prototype as StoreScene & Record<string, any>

  prototype.drawEdge = function (edge: PlacedEdge) {
    const scene = this as StoreScene & Record<string, any>
    const point = scene.grid.gridToScreen(edge.gridX, edge.gridY)
    const direction = scene.grid.getViewDirection(edge.direction) as Direction
    const { start, end } = scene.edgeEndpoints(point.x, point.y, direction)
    const height = getWallHeight(direction)

    if (edge.type === 'wall') {
      scene.buildingsLayer
        .fillStyle(height <= 12 ? 0x94a3b8 : 0xcbd5e1, height <= 12 ? .9 : 1)
        .beginPath()
        .moveTo(start.x, start.y)
        .lineTo(end.x, end.y)
        .lineTo(end.x, end.y - height)
        .lineTo(start.x, start.y - height)
        .closePath()
        .fillPath()
      return
    }

    const postHeight = Math.max(10, height - 4)
    scene.buildingsLayer
      .lineStyle(height <= 12 ? 3 : 5, 0x7c3aed, .95)
      .beginPath()
      .moveTo(start.x, start.y)
      .lineTo(start.x, start.y - postHeight)
      .moveTo(end.x, end.y)
      .lineTo(end.x, end.y - postHeight)
      .strokePath()
  }

  const originalDrawShelfBoxes = prototype.drawShelfBoxes
  prototype.drawShelfBoxes = function (...args: any[]) {
    const scene = this as StoreScene & Record<string, any>
    const labelsBefore = scene.shelfLabels.length
    const result = originalDrawShelfBoxes.apply(this, args)
    const building = args[0] as PlacedBuilding
    const label = scene.shelfLabels[labelsBefore] as Phaser.GameObjects.Text | undefined
    if (label) {
      const cells = scene.grid.getFootprint(building.definition, building.gridX, building.gridY, building.direction)
      const points = cells.map((cell: { x: number; y: number }) => scene.grid.gridToScreen(cell.x, cell.y))
      const centerX = points.reduce((sum: number, point: { x: number }) => sum + point.x, 0) / points.length
      const frontY = Math.max(...points.map((point: { y: number }) => point.y))
      label.setPosition(centerX, frontY - 62)
    }
    return result
  }

  prototype.drawBuildings = function () {
    const scene = this as StoreScene & Record<string, any>
    scene.buildingsLayer.clear()
    scene.shelfLabels.forEach((label: Phaser.GameObjects.Text) => label.destroy())
    scene.shelfLabels = []

    const buildings = [...scene.grid.getBuildings()].sort((left: PlacedBuilding, right: PlacedBuilding) => {
      return visualDepth(scene, left) - visualDepth(scene, right)
    })
    buildings.forEach((building: PlacedBuilding) => scene.drawBuilding(building))

    const edges = [...scene.grid.getEdges()].sort((left: PlacedEdge, right: PlacedEdge) => {
      const leftPoint = scene.grid.gridToScreen(left.gridX, left.gridY)
      const rightPoint = scene.grid.gridToScreen(right.gridX, right.gridY)
      return leftPoint.y - rightPoint.y
    })
    edges.forEach((edge: PlacedEdge) => scene.drawEdge(edge))

    scene.drawSelection()
    scene.drawQueues()
  }

  window.addEventListener('market-tycoon:view-display-changed', () => {
    const game = (window as Window & { marketTycoonGame?: Phaser.Game }).marketTycoonGame
    const scene = game?.scene.getScene('StoreScene') as StoreScene | undefined
    scene?.drawBuildings()
  })
}

function visualDepth(scene: StoreScene & Record<string, any>, building: PlacedBuilding) {
  const cells = scene.grid.getFootprint(building.definition, building.gridX, building.gridY, building.direction)
  return Math.max(...cells.map((cell: { x: number; y: number }) => scene.grid.gridToScreen(cell.x, cell.y).y))
}

function getWallHeight(direction: Direction) {
  if (viewDisplayRuntime.wallMode === 'full') return 46
  if (viewDisplayRuntime.wallMode === 'low') return 10
  return direction === 2 || direction === 3 ? 10 : 46
}
