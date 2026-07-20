import Phaser from 'phaser'
import { CustomerAgent } from './CustomerAgent'
import {
  GridManager,
  type BuildingDefinition,
  type Direction,
  type GridCell,
  type PlacedBuilding,
  type PlacedEdge,
} from './GridManager'
import { NavigationGrid } from './NavigationGrid'

const BUILDINGS: Record<string, BuildingDefinition> = {
  shelf: { type: 'shelf', width: 1, height: 3, price: 100 },
  checkout: { type: 'checkout', width: 1, height: 2, price: 300 },
  wall: { type: 'wall', width: 1, height: 1, price: 20 },
  door: { type: 'door', width: 1, height: 1, price: 150 },
}

export class StoreScene extends Phaser.Scene {
  private grid = new GridManager(16, 16, 64, 32, 700, 80)
  private navigation = new NavigationGrid(this.grid)
  private gridLayer!: Phaser.GameObjects.Graphics
  private pathLayer!: Phaser.GameObjects.Graphics
  private buildingsLayer!: Phaser.GameObjects.Graphics
  private previewLayer!: Phaser.GameObjects.Graphics
  private hovered = { x: -1, y: -1 }
  private direction: Direction = 0
  private selected: BuildingDefinition = BUILDINGS.shelf
  private selectedLabel!: Phaser.GameObjects.Text
  private statusLabel!: Phaser.GameObjects.Text
  private isDragging = false
  private lastDragKey = ''
  private customer?: CustomerAgent
  private customerRunning = false

  constructor() { super('StoreScene') }

  create() {
    this.gridLayer = this.add.graphics()
    this.pathLayer = this.add.graphics().setDepth(20)
    this.buildingsLayer = this.add.graphics().setDepth(30)
    this.previewLayer = this.add.graphics().setDepth(40)
    this.selectedLabel = this.add.text(18, 18, '', {
      fontFamily: 'Arial', fontSize: '18px', color: '#fff', backgroundColor: '#111827dd', padding: { x: 10, y: 8 },
    }).setScrollFactor(0).setDepth(1000)
    this.statusLabel = this.add.text(18, 62, 'Construisez un rayon et une caisse, puis appuyez sur C.', {
      fontFamily: 'Arial', fontSize: '15px', color: '#cbd5e1', backgroundColor: '#111827cc', padding: { x: 10, y: 7 },
    }).setScrollFactor(0).setDepth(1000)

    this.updateSelectedLabel()
    this.drawGrid()
    this.input.mouse?.disableContextMenu()

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2
      this.hovered = this.grid.screenToGrid(world.x, world.y)
      if (this.isDragging && pointer.leftButtonDown() && this.selected.type === 'wall') this.placeDraggedWall()
      this.drawPreview()
    })

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.grid.isInside(this.hovered.x, this.hovered.y)) return
      if (pointer.rightButtonDown()) {
        this.grid.removeAt(this.hovered.x, this.hovered.y, this.direction)
      } else {
        this.isDragging = true
        this.lastDragKey = ''
        this.placeSelected()
      }
      this.drawBuildings()
      this.drawPreview()
    })

    this.input.on('pointerup', () => {
      this.isDragging = false
      this.lastDragKey = ''
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
    this.input.keyboard?.on('keydown-C', () => void this.runCustomerCycle())
    this.input.keyboard?.on('keydown-ESC', () => {
      this.previewLayer.clear()
      this.hovered = { x: -1, y: -1 }
    })
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom - dy * 0.001, .5, 2))
    })
  }

  private placeSelected() {
    this.grid.place(this.selected, this.hovered.x, this.hovered.y, this.direction)
  }

  private placeDraggedWall() {
    const key = `${this.hovered.x}:${this.hovered.y}:${this.direction % 2}`
    if (key === this.lastDragKey || !this.grid.isInside(this.hovered.x, this.hovered.y)) return
    this.lastDragKey = key
    if (this.grid.place(this.selected, this.hovered.x, this.hovered.y, this.direction)) this.drawBuildings()
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

  private async runCustomerCycle() {
    if (this.customerRunning) return
    const shelf = this.grid.getBuildings('shelf')[0]
    const checkout = this.grid.getBuildings('checkout')[0]
    if (!shelf || !checkout) {
      this.setStatus('Il faut au moins un rayon et une caisse pour accueillir un client.', '#fbbf24')
      return
    }

    const entry: GridCell = { x: 0, y: 0 }
    const shelfPath = this.navigation.findPathToAny(entry, this.grid.getAdjacentWalkableCells(shelf))
    if (shelfPath.length === 0) {
      this.setStatus('Le rayon est inaccessible depuis l’entrée.', '#f87171')
      return
    }
    const checkoutPath = this.navigation.findPathToAny(
      shelfPath.at(-1)!,
      this.grid.getAdjacentWalkableCells(checkout),
    )
    if (checkoutPath.length === 0) {
      this.setStatus('La caisse est inaccessible depuis le rayon.', '#f87171')
      return
    }
    const exitPath = this.navigation.findPath(checkoutPath.at(-1)!, entry)
    if (exitPath.length === 0) {
      this.setStatus('Le client ne peut pas rejoindre la sortie.', '#f87171')
      return
    }

    this.customerRunning = true
    this.customer?.destroy()
    this.customer = new CustomerAgent(this, this.grid, entry)

    try {
      this.setStatus('Le client se dirige vers le rayon…')
      this.drawPath(shelfPath)
      await this.customer.follow(shelfPath)
      await this.wait(650)

      this.setStatus('Produit trouvé. Direction la caisse…')
      this.drawPath(checkoutPath)
      await this.customer.follow(checkoutPath)
      await this.wait(850)

      this.setStatus('Paiement effectué. Le client quitte le magasin…')
      this.drawPath(exitPath)
      await this.customer.follow(exitPath)
      await this.wait(300)

      this.customer.destroy()
      this.customer = undefined
      this.pathLayer.clear()
      this.setStatus('Cycle terminé : entrée → rayon → caisse → sortie.', '#86efac')
    } finally {
      this.customerRunning = false
    }
  }

  private wait(duration: number) {
    return new Promise<void>(resolve => this.time.delayedCall(duration, resolve))
  }

  private setStatus(message: string, color = '#cbd5e1') {
    this.statusLabel.setText(message).setColor(color)
  }

  private drawPath(path: GridCell[]) {
    this.pathLayer.clear()
    if (path.length < 2) return
    this.pathLayer.lineStyle(4, 0x38bdf8, .65).beginPath()
    path.forEach((cell, index) => {
      const p = this.grid.gridToScreen(cell.x, cell.y)
      if (index === 0) this.pathLayer.moveTo(p.x, p.y + 16)
      else this.pathLayer.lineTo(p.x, p.y + 16)
    })
    this.pathLayer.strokePath()
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
    for (const building of this.grid.getBuildings().sort((a, b) => a.gridX + a.gridY - b.gridX - b.gridY)) this.drawBuilding(building)
    for (const edge of this.grid.getEdges().sort((a, b) => a.gridX + a.gridY - b.gridX - b.gridY)) this.drawEdge(edge)
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
    const w = this.grid.tileWidth / 2, h = this.grid.tileHeight / 2
    return direction % 2 === 0
      ? { start: { x, y }, end: { x: x + w, y: y + h } }
      : { start: { x, y }, end: { x: x - w, y: y + h } }
  }

  private drawEdgePreview(x: number, y: number, direction: Direction, color: number) {
    const { start, end } = this.edgeEndpoints(x, y, direction)
    this.previewLayer.lineStyle(7, color, .8).beginPath().moveTo(start.x, start.y).lineTo(end.x, end.y).strokePath()
  }

  private wall(x: number, y: number, direction: Direction) {
    const g = this.buildingsLayer
    const { start, end } = this.edgeEndpoints(x, y, direction)
    const height = 46
    g.fillStyle(0xcbd5e1, 1).beginPath().moveTo(start.x, start.y).lineTo(end.x, end.y)
      .lineTo(end.x, end.y - height).lineTo(start.x, start.y - height).closePath().fillPath()
    g.lineStyle(2, 0x64748b, 1).strokePath()
  }

  private door(x: number, y: number, direction: Direction) {
    const g = this.buildingsLayer
    const { start, end } = this.edgeEndpoints(x, y, direction)
    const height = 46, dx = end.x - start.x, dy = end.y - start.y
    const left = { x: start.x + dx * .18, y: start.y + dy * .18 }
    const right = { x: start.x + dx * .82, y: start.y + dy * .82 }
    g.lineStyle(5, 0xcbd5e1, 1).beginPath()
      .moveTo(start.x, start.y - height).lineTo(left.x, left.y - height)
      .moveTo(right.x, right.y - height).lineTo(end.x, end.y - height).strokePath()
    g.lineStyle(3, 0x64748b, 1).beginPath()
      .moveTo(start.x, start.y).lineTo(start.x, start.y - height)
      .moveTo(end.x, end.y).lineTo(end.x, end.y - height).strokePath()
    g.fillStyle(0x7c3aed, 1).beginPath().moveTo(left.x, left.y).lineTo(right.x, right.y)
      .lineTo(right.x, right.y - height + 8).lineTo(left.x, left.y - height + 8).closePath().fillPath()
    g.fillStyle(0xfacc15, 1).fillCircle(right.x - dx * .12, right.y - dy * .12 - 18, 2)
  }
}
