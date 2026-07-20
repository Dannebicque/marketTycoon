import Phaser from 'phaser'
import {
  GridManager,
  type BuildingDefinition,
  type Direction,
  type PlacedBuilding,
  type PlacedEdge,
} from './GridManager'

const BUILDINGS: Record<string, BuildingDefinition> = {
  shelf: { type: 'shelf', width: 1, height: 3, price: 100 },
  checkout: { type: 'checkout', width: 1, height: 2, price: 300 },
  wall: { type: 'wall', width: 1, height: 1, price: 20 },
  door: { type: 'door', width: 1, height: 1, price: 150 },
}

export class StoreScene extends Phaser.Scene {
  private grid = new GridManager(16, 16, 64, 32, 700, 80)
  private gridLayer!: Phaser.GameObjects.Graphics
  private buildingsLayer!: Phaser.GameObjects.Graphics
  private previewLayer!: Phaser.GameObjects.Graphics
  private hovered = { x: -1, y: -1 }
  private direction: Direction = 0
  private selected: BuildingDefinition = BUILDINGS.shelf
  private selectedLabel!: Phaser.GameObjects.Text

  constructor() { super('StoreScene') }

  create() {
    this.gridLayer = this.add.graphics()
    this.buildingsLayer = this.add.graphics()
    this.previewLayer = this.add.graphics()
    this.selectedLabel = this.add.text(18, 18, '', {
      fontFamily: 'Arial', fontSize: '18px', color: '#fff', backgroundColor: '#111827dd', padding: { x: 10, y: 8 },
    }).setScrollFactor(0).setDepth(1000)
    this.updateSelectedLabel()
    this.drawGrid()

    this.input.mouse?.disableContextMenu()
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2
      this.hovered = this.grid.screenToGrid(world.x, world.y)
      this.drawPreview()
    })
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.grid.isInside(this.hovered.x, this.hovered.y)) return
      if (pointer.rightButtonDown()) this.grid.removeAt(this.hovered.x, this.hovered.y, this.direction)
      else this.grid.place(this.selected, this.hovered.x, this.hovered.y, this.direction)
      this.drawBuildings()
      this.drawPreview()
    })

    this.input.keyboard?.on('keydown-R', () => {
      this.direction = ((this.direction + 1) % 4) as Direction
      this.drawPreview()
      this.updateSelectedLabel()
    })
    this.input.keyboard?.on('keydown-ONE', () => this.select('shelf'))
    this.input.keyboard?.on('keydown-TWO', () => this.select('checkout'))
    this.input.keyboard?.on('keydown-THREE', () => this.select('wall'))
    this.input.keyboard?.on('keydown-FOUR', () => this.select('door'))
    this.input.keyboard?.on('keydown-ESC', () => {
      this.previewLayer.clear()
      this.hovered = { x: -1, y: -1 }
    })
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom - dy * 0.001, .5, 2))
    })
  }

  private select(type: keyof typeof BUILDINGS) {
    this.selected = BUILDINGS[type]
    this.direction = 0
    this.updateSelectedLabel()
    this.drawPreview()
  }

  private updateSelectedLabel() {
    const names = { shelf: 'Rayon', checkout: 'Caisse', wall: 'Mur', door: 'Porte' }
    const orientation = this.selected.type === 'wall' || this.selected.type === 'door'
      ? (this.direction % 2 === 0 ? 'axe X' : 'axe Y')
      : `rotation ${this.direction * 90}°`
    this.selectedLabel.setText(`${names[this.selected.type]} · ${orientation}`)
  }

  private drawGrid() {
    for (let y = 0; y < this.grid.rows; y++) for (let x = 0; x < this.grid.columns; x++) {
      const p = this.grid.gridToScreen(x, y)
      this.diamond(this.gridLayer, p.x, p.y, 0x334155, .35, 0x64748b)
    }
  }

  private drawPreview() {
    this.previewLayer.clear()
    if (!this.grid.isInside(this.hovered.x, this.hovered.y)) return

    const valid = this.grid.canPlace(this.selected, this.hovered.x, this.hovered.y, this.direction)
    const color = valid ? 0x22c55e : 0xef4444

    if (this.selected.type === 'wall' || this.selected.type === 'door') {
      const p = this.grid.gridToScreen(this.hovered.x, this.hovered.y)
      this.drawEdgePreview(p.x, p.y, this.direction, color)
      return
    }

    for (const cell of this.grid.getFootprint(this.selected, this.hovered.x, this.hovered.y, this.direction)) {
      const p = this.grid.gridToScreen(cell.x, cell.y)
      this.diamond(this.previewLayer, p.x, p.y, color, .5, color)
    }
  }

  private drawBuildings() {
    this.buildingsLayer.clear()

    for (const building of this.grid.getBuildings().sort((a, b) => a.gridX + a.gridY - b.gridX - b.gridY)) {
      this.drawBuilding(building)
    }

    for (const edge of this.grid.getEdges().sort((a, b) => a.gridX + a.gridY - b.gridX - b.gridY)) {
      this.drawEdge(edge)
    }
  }

  private drawBuilding(building: PlacedBuilding) {
    for (const cell of this.grid.getFootprint(building.definition, building.gridX, building.gridY, building.direction)) {
      const p = this.grid.gridToScreen(cell.x, cell.y)
      if (building.definition.type === 'shelf') this.box(p.x, p.y, 44, 0xb07a4f)
      if (building.definition.type === 'checkout') this.box(p.x, p.y, 24, 0x2563eb)
    }
  }

  private drawEdge(edge: PlacedEdge) {
    const p = this.grid.gridToScreen(edge.gridX, edge.gridY)
    if (edge.type === 'wall') this.wall(p.x, p.y, edge.direction)
    else this.door(p.x, p.y, edge.direction)
  }

  private diamond(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, alpha: number, line: number) {
    const w = this.grid.tileWidth / 2, h = this.grid.tileHeight / 2
    g.fillStyle(color, alpha).lineStyle(1, line, .8).beginPath()
    g.moveTo(x, y).lineTo(x + w, y + h).lineTo(x, y + h * 2).lineTo(x - w, y + h).closePath().fillPath().strokePath()
  }

  private box(x: number, y: number, height: number, color: number) {
    const g = this.buildingsLayer, w = 25, d = 12
    const c = Phaser.Display.Color.ValueToColor(color)
    g.fillStyle(c.clone().darken(25).color).beginPath().moveTo(x - w, y + d).lineTo(x, y + d * 2).lineTo(x, y + d * 2 - height).lineTo(x - w, y + d - height).closePath().fillPath()
    g.fillStyle(c.clone().darken(10).color).beginPath().moveTo(x, y + d * 2).lineTo(x + w, y + d).lineTo(x + w, y + d - height).lineTo(x, y + d * 2 - height).closePath().fillPath()
    g.fillStyle(color).beginPath().moveTo(x, y - height).lineTo(x + w, y + d - height).lineTo(x, y + d * 2 - height).lineTo(x - w, y + d - height).closePath().fillPath()
  }

  private edgeEndpoints(x: number, y: number, direction: Direction) {
    const w = this.grid.tileWidth / 2
    const h = this.grid.tileHeight / 2
    return direction % 2 === 0
      ? { start: { x, y }, end: { x: x + w, y: y + h } }
      : { start: { x, y }, end: { x: x - w, y: y + h } }
  }

  private drawEdgePreview(x: number, y: number, direction: Direction, color: number) {
    const { start, end } = this.edgeEndpoints(x, y, direction)
    this.previewLayer.lineStyle(7, color, .8).beginPath()
      .moveTo(start.x, start.y).lineTo(end.x, end.y).strokePath()
  }

  private wall(x: number, y: number, direction: Direction) {
    const g = this.buildingsLayer
    const { start, end } = this.edgeEndpoints(x, y, direction)
    const height = 46

    g.fillStyle(0xcbd5e1, 1).beginPath()
      .moveTo(start.x, start.y)
      .lineTo(end.x, end.y)
      .lineTo(end.x, end.y - height)
      .lineTo(start.x, start.y - height)
      .closePath().fillPath()
    g.lineStyle(2, 0x64748b, 1).strokePath()
  }

  private door(x: number, y: number, direction: Direction) {
    const g = this.buildingsLayer
    const { start, end } = this.edgeEndpoints(x, y, direction)
    const height = 46
    const dx = end.x - start.x
    const dy = end.y - start.y
    const left = { x: start.x + dx * .18, y: start.y + dy * .18 }
    const right = { x: start.x + dx * .82, y: start.y + dy * .82 }

    g.lineStyle(5, 0xcbd5e1, 1).beginPath()
      .moveTo(start.x, start.y - height).lineTo(left.x, left.y - height)
      .moveTo(right.x, right.y - height).lineTo(end.x, end.y - height)
      .strokePath()
    g.lineStyle(3, 0x64748b, 1).beginPath()
      .moveTo(start.x, start.y).lineTo(start.x, start.y - height)
      .moveTo(end.x, end.y).lineTo(end.x, end.y - height)
      .strokePath()
    g.fillStyle(0x7c3aed, 1).beginPath()
      .moveTo(left.x, left.y)
      .lineTo(right.x, right.y)
      .lineTo(right.x, right.y - height + 8)
      .lineTo(left.x, left.y - height + 8)
      .closePath().fillPath()
    g.fillStyle(0xfacc15, 1).fillCircle(right.x - dx * .12, right.y - dy * .12 - 18, 2)
  }
}
