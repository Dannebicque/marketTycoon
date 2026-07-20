export type Direction = 0 | 1 | 2 | 3
export type BuildingType = 'shelf' | 'checkout' | 'wall' | 'door'
export type EdgeAxis = 'x' | 'y'

export interface BuildingDefinition {
  type: BuildingType
  width: number
  height: number
  price: number
}

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
  gridX: number
  gridY: number
  axis: EdgeAxis
  direction: Direction
}

export class GridManager {
  private occupied = new Map<string, string>()
  private buildings = new Map<string, PlacedBuilding>()
  private edges = new Map<string, PlacedEdge>()

  constructor(
    public columns: number,
    public rows: number,
    public tileWidth: number,
    public tileHeight: number,
    public originX: number,
    public originY: number,
  ) {}

  gridToScreen(x: number, y: number) {
    return {
      x: this.originX + (x - y) * this.tileWidth / 2,
      y: this.originY + (x + y) * this.tileHeight / 2,
    }
  }

  screenToGrid(x: number, y: number) {
    const rx = x - this.originX
    const ry = y - this.originY
    return {
      x: Math.floor(rx / this.tileWidth + ry / this.tileHeight),
      y: Math.floor(ry / this.tileHeight - rx / this.tileWidth),
    }
  }

  getSize(definition: BuildingDefinition, direction: Direction) {
    return direction % 2 === 1
      ? { width: definition.height, height: definition.width }
      : { width: definition.width, height: definition.height }
  }

  getFootprint(definition: BuildingDefinition, x: number, y: number, direction: Direction) {
    if (this.isEdgeType(definition.type)) return []

    const size = this.getSize(definition, direction)
    const cells: Array<{ x: number; y: number }> = []
    for (let dy = 0; dy < size.height; dy++) {
      for (let dx = 0; dx < size.width; dx++) cells.push({ x: x + dx, y: y + dy })
    }
    return cells
  }

  isInside(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.columns && y < this.rows
  }

  getEdgeAxis(direction: Direction): EdgeAxis {
    return direction % 2 === 0 ? 'x' : 'y'
  }

  getEdgeKey(x: number, y: number, direction: Direction) {
    return `${x}:${y}:${this.getEdgeAxis(direction)}`
  }

  canPlace(definition: BuildingDefinition, x: number, y: number, direction: Direction) {
    if (!this.isInside(x, y)) return false

    if (definition.type === 'wall') {
      return !this.edges.has(this.getEdgeKey(x, y, direction))
    }

    if (definition.type === 'door') {
      return this.edges.get(this.getEdgeKey(x, y, direction))?.type === 'wall'
    }

    return this.getFootprint(definition, x, y, direction)
      .every(cell => this.isInside(cell.x, cell.y) && !this.occupied.has(`${cell.x}:${cell.y}`))
  }

  place(definition: BuildingDefinition, x: number, y: number, direction: Direction) {
    if (!this.canPlace(definition, x, y, direction)) return null

    if (this.isEdgeType(definition.type)) {
      const key = this.getEdgeKey(x, y, direction)
      const edge: PlacedEdge = {
        id: crypto.randomUUID(),
        type: definition.type,
        gridX: x,
        gridY: y,
        axis: this.getEdgeAxis(direction),
        direction,
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
    if (direction !== undefined) {
      const edgeKey = this.getEdgeKey(x, y, direction)
      if (this.edges.delete(edgeKey)) return true
    }

    const id = this.occupied.get(`${x}:${y}`)
    if (!id) return false
    const building = this.buildings.get(id)
    if (!building) return false
    this.getFootprint(building.definition, building.gridX, building.gridY, building.direction)
      .forEach(cell => this.occupied.delete(`${cell.x}:${cell.y}`))
    this.buildings.delete(id)
    return true
  }

  getBuildings() {
    return [...this.buildings.values()]
  }

  getEdges() {
    return [...this.edges.values()]
  }

  private isEdgeType(type: BuildingType): type is 'wall' | 'door' {
    return type === 'wall' || type === 'door'
  }
}
