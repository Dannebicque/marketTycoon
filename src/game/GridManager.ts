import type { BuildingCategory, BuildingDefinition } from './definitions'
import { isEdgeDefinition } from './definitions'

export type Direction = 0 | 1 | 2 | 3
export type EdgeAxis = 'x' | 'y'

export interface GridCell { x: number; y: number }

export interface PlacedBuilding {
  id: string
  definition: BuildingDefinition
  gridX: number
  gridY: number
  direction: Direction
}

export interface PlacedEdge {
  id: string
  type: 'wall' | 'door'
  definitionKey: 'wall' | 'door'
  gridX: number
  gridY: number
  axis: EdgeAxis
  direction: Direction
}

export class GridManager {
  private occupied = new Map<string, string>()
  private buildings = new Map<string, PlacedBuilding>()
  private edges = new Map<string, PlacedEdge>()
  private viewRotation: Direction = 0

  constructor(
    public columns: number,
    public rows: number,
    public tileWidth: number,
    public tileHeight: number,
    public originX: number,
    public originY: number,
  ) {}

  get rotation() { return this.viewRotation }

  rotateView(step: -1 | 1) {
    this.viewRotation = ((this.viewRotation + step + 4) % 4) as Direction
    return this.viewRotation
  }

  getViewDirection(direction: Direction): Direction {
    return ((direction + this.viewRotation) % 4) as Direction
  }

  gridToScreen(x: number, y: number) {
    const transformed = this.transformForView(x, y)
    return {
      x: this.originX + (transformed.x - transformed.y) * this.tileWidth / 2,
      y: this.originY + (transformed.x + transformed.y) * this.tileHeight / 2,
    }
  }

  screenToGrid(x: number, y: number) {
    const rx = x - this.originX
    const ry = y - this.originY
    const transformed = {
      x: Math.floor(rx / this.tileWidth + ry / this.tileHeight),
      y: Math.floor(ry / this.tileHeight - rx / this.tileWidth),
    }
    return this.inverseTransformForView(transformed.x, transformed.y)
  }

  private transformForView(x: number, y: number): GridCell {
    if (this.viewRotation === 1) return { x: this.rows - 1 - y, y: x }
    if (this.viewRotation === 2) return { x: this.columns - 1 - x, y: this.rows - 1 - y }
    if (this.viewRotation === 3) return { x: y, y: this.columns - 1 - x }
    return { x, y }
  }

  private inverseTransformForView(x: number, y: number): GridCell {
    if (this.viewRotation === 1) return { x: y, y: this.rows - 1 - x }
    if (this.viewRotation === 2) return { x: this.columns - 1 - x, y: this.rows - 1 - y }
    if (this.viewRotation === 3) return { x: this.columns - 1 - y, y: x }
    return { x, y }
  }

  getSize(definition: BuildingDefinition, direction: Direction) {
    return direction % 2 === 1
      ? { width: definition.height, height: definition.width }
      : { width: definition.width, height: definition.height }
  }

  getFootprint(definition: BuildingDefinition, x: number, y: number, direction: Direction) {
    if (isEdgeDefinition(definition)) return []
    const size = this.getSize(definition, direction)
    const cells: GridCell[] = []
    for (let dy = 0; dy < size.height; dy++) {
      for (let dx = 0; dx < size.width; dx++) cells.push({ x: x + dx, y: y + dy })
    }
    return cells
  }

  isInside(x: number, y: number) { return x >= 0 && y >= 0 && x < this.columns && y < this.rows }
  isCellOccupied(x: number, y: number) { return this.occupied.has(`${x}:${y}`) }
  isWalkable(x: number, y: number) { return this.isInside(x, y) && !this.isCellOccupied(x, y) }

  getBuildingAt(x: number, y: number) {
    const id = this.occupied.get(`${x}:${y}`)
    return id ? this.buildings.get(id) : undefined
  }

  getBorderWalkableCells() {
    const cells: GridCell[] = []
    for (let x = 0; x < this.columns; x++) {
      if (this.isWalkable(x, 0)) cells.push({ x, y: 0 })
      if (this.rows > 1 && this.isWalkable(x, this.rows - 1)) cells.push({ x, y: this.rows - 1 })
    }
    for (let y = 1; y < this.rows - 1; y++) {
      if (this.isWalkable(0, y)) cells.push({ x: 0, y })
      if (this.columns > 1 && this.isWalkable(this.columns - 1, y)) cells.push({ x: this.columns - 1, y })
    }
    return cells
  }

  getEdgeAxis(direction: Direction): EdgeAxis { return direction % 2 === 0 ? 'x' : 'y' }
  getEdgeKey(x: number, y: number, direction: Direction) { return `${x}:${y}:${this.getEdgeAxis(direction)}` }

  getEdgeBetween(from: GridCell, to: GridCell) {
    if (to.x === from.x + 1 && to.y === from.y) return this.edges.get(`${from.x}:${from.y}:y`)
    if (to.x === from.x - 1 && to.y === from.y) return this.edges.get(`${to.x}:${to.y}:y`)
    if (to.y === from.y + 1 && to.x === from.x) return this.edges.get(`${from.x}:${from.y}:x`)
    if (to.y === from.y - 1 && to.x === from.x) return this.edges.get(`${to.x}:${to.y}:x`)
    return undefined
  }

  isMovementBlocked(from: GridCell, to: GridCell) { return this.getEdgeBetween(from, to)?.type === 'wall' }

  getWalkableNeighbours(cell: GridCell) {
    return [
      { x: cell.x + 1, y: cell.y },
      { x: cell.x - 1, y: cell.y },
      { x: cell.x, y: cell.y + 1 },
      { x: cell.x, y: cell.y - 1 },
    ].filter(next => this.isWalkable(next.x, next.y) && !this.isMovementBlocked(cell, next))
  }

  getAdjacentWalkableCells(building: PlacedBuilding) {
    const footprint = this.getFootprint(building.definition, building.gridX, building.gridY, building.direction)
    const candidates = new Map<string, GridCell>()
    for (const cell of footprint) {
      for (const neighbour of [
        { x: cell.x + 1, y: cell.y }, { x: cell.x - 1, y: cell.y },
        { x: cell.x, y: cell.y + 1 }, { x: cell.x, y: cell.y - 1 },
      ]) {
        if (this.isWalkable(neighbour.x, neighbour.y)) candidates.set(`${neighbour.x}:${neighbour.y}`, neighbour)
      }
    }
    return [...candidates.values()]
  }

  canPlace(definition: BuildingDefinition, x: number, y: number, direction: Direction) {
    if (!this.isInside(x, y)) return false
    if (definition.category === 'wall') return !this.edges.has(this.getEdgeKey(x, y, direction))
    if (definition.category === 'door') return this.edges.get(this.getEdgeKey(x, y, direction))?.type === 'wall'
    return this.getFootprint(definition, x, y, direction)
      .every(cell => this.isInside(cell.x, cell.y) && !this.isCellOccupied(cell.x, cell.y))
  }

  place(definition: BuildingDefinition, x: number, y: number, direction: Direction) {
    if (!this.canPlace(definition, x, y, direction)) return null
    if (isEdgeDefinition(definition)) {
      const key = this.getEdgeKey(x, y, direction)
      const edge: PlacedEdge = {
        id: crypto.randomUUID(), type: definition.category, definitionKey: definition.key,
        gridX: x, gridY: y, axis: this.getEdgeAxis(direction), direction,
      }
      this.edges.set(key, edge)
      return edge
    }
    const building: PlacedBuilding = { id: crypto.randomUUID(), definition, gridX: x, gridY: y, direction }
    this.buildings.set(building.id, building)
    this.getFootprint(definition, x, y, direction)
      .forEach(cell => this.occupied.set(`${cell.x}:${cell.y}`, building.id))
    return building
  }

  removeAt(x: number, y: number, direction?: Direction) {
    if (direction !== undefined && this.edges.delete(this.getEdgeKey(x, y, direction))) return true
    const id = this.occupied.get(`${x}:${y}`)
    if (!id) return false
    const building = this.buildings.get(id)
    if (!building) return false
    this.getFootprint(building.definition, building.gridX, building.gridY, building.direction)
      .forEach(cell => this.occupied.delete(`${cell.x}:${cell.y}`))
    this.buildings.delete(id)
    return true
  }

  getBuildings(category?: Extract<BuildingCategory, 'shelf' | 'checkout'>) {
    const values = [...this.buildings.values()]
    return category ? values.filter(building => building.definition.category === category) : values
  }

  getEdges() { return [...this.edges.values()] }
}
