export type Direction = 0 | 1 | 2 | 3

export interface BuildingDefinition {
  type: 'shelf' | 'checkout' | 'wall' | 'door'
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

export class GridManager {
  private occupied = new Map<string, string>()
  private buildings = new Map<string, PlacedBuilding>()

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

  canPlace(definition: BuildingDefinition, x: number, y: number, direction: Direction) {
    return this.getFootprint(definition, x, y, direction)
      .every(cell => this.isInside(cell.x, cell.y) && !this.occupied.has(`${cell.x}:${cell.y}`))
  }

  place(definition: BuildingDefinition, x: number, y: number, direction: Direction) {
    if (!this.canPlace(definition, x, y, direction)) return null
    const building: PlacedBuilding = { id: crypto.randomUUID(), definition, gridX: x, gridY: y, direction }
    this.buildings.set(building.id, building)
    this.getFootprint(definition, x, y, direction)
      .forEach(cell => this.occupied.set(`${cell.x}:${cell.y}`, building.id))
    return building
  }

  removeAt(x: number, y: number) {
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
}
