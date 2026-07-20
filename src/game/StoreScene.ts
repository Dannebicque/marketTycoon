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
import { StoreSimulation } from './StoreSimulation'

const BUILDINGS: Record<string, BuildingDefinition> = {
  shelf: { type: 'shelf', width: 1, height: 3, price: 100 },
  checkout: { type: 'checkout', width: 1, height: 2, price: 300 },
  wall: { type: 'wall', width: 1, height: 1, price: 20 },
  door: { type: 'door', width: 1, height: 1, price: 150 },
}

export class StoreScene extends Phaser.Scene {
  private grid = new GridManager(16, 16, 64, 32, 700, 80)
  private navigation = new NavigationGrid(this.grid)
  private simulation = new StoreSimulation()
  private gridLayer!: Phaser.GameObjects.Graphics
  private pathLayer!: Phaser.GameObjects.Graphics
  private buildingsLayer!: Phaser.GameObjects.Graphics
  private previewLayer!: Phaser.GameObjects.Graphics
  private hovered = { x: -1, y: -1 }
  private direction: Direction = 0
  private selected: BuildingDefinition = BUILDINGS.shelf
  private selectedLabel!: Phaser.GameObjects.Text
  private statusLabel!: Phaser.GameObjects.Text
  private metricsLabel!: Phaser.GameObjects.Text
  private isDragging = false
  private lastDragKey = ''
  private customers = new Map<string, CustomerAgent>()
  private nextCustomer = 1
  private autoSpawn = false
  private spawnTimer?: Phaser.Time.TimerEvent

  constructor() { super('StoreScene') }

  create() {
    this.gridLayer = this.add.graphics()
    this.pathLayer = this.add.graphics().setDepth(20)
    this.buildingsLayer = this.add.graphics().setDepth(30)
    this.previewLayer = this.add.graphics().setDepth(40)
    this.selectedLabel = this.add.text(18, 18, '', this.textStyle(18)).setScrollFactor(0).setDepth(1000)
    this.statusLabel = this.add.text(18, 62, 'Placez au moins un rayon et une caisse.', this.textStyle(15, '#cbd5e1')).setScrollFactor(0).setDepth(1000)
    this.metricsLabel = this.add.text(18, 106, '', this.textStyle(14, '#bfdbfe')).setScrollFactor(0).setDepth(1000)

    this.updateSelectedLabel()
    this.updateMetrics()
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
        this.syncSimulation()
      } else {
        this.isDragging = true
        this.lastDragKey = ''
        this.placeSelected()
      }
      this.drawBuildings()
      this.drawPreview()
      this.updateMetrics()
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
    this.input.keyboard?.on('keydown-C', () => void this.spawnCustomer())
    this.input.keyboard?.on('keydown-S', () => this.toggleAutoSpawn())
    this.input.keyboard?.on('keydown-A', () => this.restock())
    this.input.keyboard?.on('keydown-ESC', () => {
      this.previewLayer.clear()
      this.hovered = { x: -1, y: -1 }
    })
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom - dy * .001, .5, 2))
    })
  }

  private textStyle(fontSize: number, color = '#ffffff'): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontFamily: 'Arial', fontSize: `${fontSize}px`, color, backgroundColor: '#111827dd', padding: { x: 10, y: 7 } }
  }

  private placeSelected() {
    if (!this.simulation.canSpend(this.selected.price)) {
      this.setStatus('Trésorerie insuffisante pour construire cet élément.', '#f87171')
      return
    }
    if (this.grid.place(this.selected, this.hovered.x, this.hovered.y, this.direction)) {
      this.simulation.spend(this.selected.price)
      this.syncSimulation()
    }
  }

  private placeDraggedWall() {
    const key = `${this.hovered.x}:${this.hovered.y}:${this.direction % 2}`
    if (key === this.lastDragKey || !this.grid.isInside(this.hovered.x, this.hovered.y)) return
    this.lastDragKey = key
    if (!this.simulation.canSpend(this.selected.price)) return
    if (this.grid.place(this.selected, this.hovered.x, this.hovered.y, this.direction)) {
      this.simulation.spend(this.selected.price)
      this.drawBuildings()
      this.updateMetrics()
    }
  }

  private syncSimulation() {
    this.simulation.syncBuildings(this.grid.getBuildings())
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
    this.selectedLabel.setText(`${names[this.selected.type]} · ${orientation} · ${this.selected.price} €`)
  }

  private toggleAutoSpawn() {
    this.autoSpawn = !this.autoSpawn
    this.spawnTimer?.destroy()
    this.spawnTimer = undefined
    if (this.autoSpawn) {
      this.spawnTimer = this.time.addEvent({ delay: 2600, loop: true, callback: () => void this.spawnCustomer() })
      this.setStatus('Arrivées automatiques activées.', '#86efac')
    } else {
      this.setStatus('Arrivées automatiques désactivées.')
    }
    this.updateMetrics()
  }

  private restock() {
    if (this.simulation.restockAll()) this.setStatus('Tous les rayons ont été réapprovisionnés.', '#86efac')
    else this.setStatus('Trésorerie insuffisante pour réapprovisionner.', '#f87171')
    this.updateMetrics()
    this.drawBuildings()
  }

  private async spawnCustomer() {
    this.syncSimulation()
    const shelves = this.grid.getBuildings('shelf')
    const checkouts = this.grid.getBuildings('checkout')
    const shelf = this.simulation.getAvailableShelf(shelves)
    const checkout = this.simulation.chooseCheckout(checkouts)
    if (!shelf || !checkout) {
      this.simulation.metrics.lostCustomers += 1
      this.setStatus(!shelf ? 'Aucun rayon approvisionné disponible.' : 'Aucune caisse disponible.', '#fbbf24')
      this.updateMetrics()
      return
    }

    const id = `C${this.nextCustomer++}`
    const entry: GridCell = { x: 0, y: 0 }
    const shelfPath = this.navigation.findPathToAny(entry, this.grid.getAdjacentWalkableCells(shelf))
    const checkoutPath = shelfPath.length
      ? this.navigation.findPathToAny(shelfPath.at(-1)!, this.grid.getAdjacentWalkableCells(checkout))
      : []
    const exitPath = checkoutPath.length ? this.navigation.findPath(checkoutPath.at(-1)!, entry) : []
    if (!shelfPath.length || !checkoutPath.length || !exitPath.length) {
      this.simulation.metrics.lostCustomers += 1
      this.setStatus(`Le client ${id} ne trouve pas de parcours complet.`, '#f87171')
      this.updateMetrics()
      return
    }

    const colors = [0xf97316, 0x22c55e, 0x3b82f6, 0xa855f7, 0xec4899, 0xeab308]
    const customer = new CustomerAgent(this, this.grid, id, entry, colors[this.nextCustomer % colors.length])
    this.customers.set(id, customer)
    void this.runCustomerCycle(customer, shelf, checkout, shelfPath, checkoutPath, exitPath)
    this.updateMetrics()
  }

  private async runCustomerCycle(
    customer: CustomerAgent,
    shelf: PlacedBuilding,
    checkout: PlacedBuilding,
    shelfPath: GridCell[],
    checkoutPath: GridCell[],
    exitPath: GridCell[],
  ) {
    let queued = false
    try {
      this.setStatus(`${customer.id} se dirige vers un rayon…`)
      this.drawPath(shelfPath)
      await customer.follow(shelfPath)
      await this.wait(450)
      const product = this.simulation.takeProduct(shelf.id)
      if (!product) throw new Error('stock')

      const position = this.simulation.enqueue(checkout.id, customer.id)
      queued = true
      this.setStatus(`${customer.id} rejoint la caisse · position ${position + 1}.`)
      this.drawPath(checkoutPath)
      await customer.follow(checkoutPath)

      while (!this.simulation.isFirst(checkout.id, customer.id)) await this.wait(250)
      this.simulation.startCheckout(checkout.id)
      this.setStatus(`${customer.id} est en cours d’encaissement…`)
      await this.wait(900)
      this.simulation.finishCheckout(checkout.id, customer.id, product.salePrice, product.purchasePrice)
      queued = false

      this.drawPath(exitPath)
      await customer.follow(exitPath)
      this.setStatus(`${customer.id} a terminé ses achats.`, '#86efac')
    } catch {
      this.simulation.abandon(queued ? checkout.id : undefined, customer.id)
      this.setStatus(`${customer.id} quitte le magasin sans achat.`, '#f87171')
    } finally {
      customer.destroy()
      this.customers.delete(customer.id)
      this.pathLayer.clear()
      this.updateMetrics()
      this.drawBuildings()
    }
  }

  private wait(duration: number) {
    return new Promise<void>(resolve => this.time.delayedCall(duration, resolve))
  }

  private setStatus(message: string, color = '#cbd5e1') {
    this.statusLabel.setText(message).setColor(color)
  }

  private updateMetrics() {
    const m = this.simulation.metrics
    this.metricsLabel.setText(
      `Trésorerie ${m.cash.toFixed(0)} € · CA ${m.revenue.toFixed(0)} € · Résultat ${m.profit.toFixed(0)} €\n` +
      `Clients ${this.customers.size} · Servis ${m.servedCustomers} · Perdus ${m.lostCustomers} · Stock ${this.simulation.getTotalStock()} · Auto ${this.autoSpawn ? 'ON' : 'OFF'}`,
    )
  }

  private drawPath(path: GridCell[]) {
    this.pathLayer.clear()
    if (path.length < 2) return
    this.pathLayer.lineStyle(4, 0x38bdf8, .5).beginPath()
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
      && this.simulation.canSpend(this.selected.price)
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
    const shelfState = building.definition.type === 'shelf' ? this.simulation.getShelfState(building.id) : undefined
    for (const cell of this.grid.getFootprint(building.definition, building.gridX, building.gridY, building.direction)) {
      const p = this.grid.gridToScreen(cell.x, cell.y)
      if (building.definition.type === 'shelf') this.box(p.x, p.y, 44, shelfState?.stock ? 0xb07a4f : 0x64748b)
      if (building.definition.type === 'checkout') this.box(p.x, p.y, 24, 0x2563eb)
    }
    if (shelfState) {
      const p = this.grid.gridToScreen(building.gridX, building.gridY)
      this.buildingsLayer.fillStyle(0xffffff, .9).fillRect(p.x - 12, p.y - 62, 24, 12)
      this.add.text(p.x, p.y - 56, `${shelfState.stock}`, { fontSize: '10px', color: '#111827' }).setOrigin(.5).setDepth(35)
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