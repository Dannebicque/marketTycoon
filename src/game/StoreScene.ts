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
import { StoreSimulation, type BasketLine, type PaymentMethod } from './StoreSimulation'

const BUILDINGS: Record<string, BuildingDefinition> = {
  shelf: { type: 'shelf', width: 1, height: 3, price: 100 },
  checkout: { type: 'checkout', width: 1, height: 2, price: 300 },
  wall: { type: 'wall', width: 1, height: 1, price: 20 },
  door: { type: 'door', width: 1, height: 1, price: 150 },
}

const MAX_QUEUE_WAIT_MS = 18_000
const OPENING_MINUTES = 8 * 60
const CLOSING_MINUTES = 20 * 60
const CLOCK_STEP_MINUTES = 10
const CLOCK_STEP_MS = 750
const CAMERA_SPEED = 520

interface CustomerRoute {
  entry: GridCell
  firstPath: GridCell[]
}

export class StoreScene extends Phaser.Scene {
  private grid = new GridManager(16, 16, 64, 32, 700, 80)
  private navigation = new NavigationGrid(this.grid)
  private simulation = new StoreSimulation()

  private gridLayer!: Phaser.GameObjects.Graphics
  private pathLayer!: Phaser.GameObjects.Graphics
  private buildingsLayer!: Phaser.GameObjects.Graphics
  private queueLayer!: Phaser.GameObjects.Graphics
  private previewLayer!: Phaser.GameObjects.Graphics

  private hovered = { x: -1, y: -1 }
  private direction: Direction = 0
  private selected: BuildingDefinition = BUILDINGS.shelf
  private selectedLabel!: Phaser.GameObjects.Text
  private statusLabel!: Phaser.GameObjects.Text
  private metricsLabel!: Phaser.GameObjects.Text
  private clockLabel!: Phaser.GameObjects.Text
  private summaryLabel?: Phaser.GameObjects.Text
  private shelfLabels: Phaser.GameObjects.Text[] = []
  private queueLabels: Phaser.GameObjects.Text[] = []

  private isDragging = false
  private lastDragKey = ''
  private isPanning = false
  private panPointer = { x: 0, y: 0 }
  private panScroll = { x: 0, y: 0 }

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private cameraKeys?: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>

  private customers = new Map<string, CustomerAgent>()
  private nextCustomer = 1
  private autoSpawn = false
  private spawnTimer?: Phaser.Time.TimerEvent
  private clockTimer?: Phaser.Time.TimerEvent
  private day = 1
  private currentMinutes = OPENING_MINUTES
  private storeOpen = true

  constructor() { super('StoreScene') }

  create() {
    this.gridLayer = this.add.graphics()
    this.pathLayer = this.add.graphics().setDepth(20)
    this.buildingsLayer = this.add.graphics().setDepth(30)
    this.queueLayer = this.add.graphics().setDepth(32)
    this.previewLayer = this.add.graphics().setDepth(40)

    this.selectedLabel = this.add.text(18, 18, '', this.textStyle(18)).setScrollFactor(0).setDepth(1000)
    this.statusLabel = this.add.text(18, 62, 'Placez au moins un rayon et une caisse.', this.textStyle(15, '#cbd5e1')).setScrollFactor(0).setDepth(1000)
    this.metricsLabel = this.add.text(18, 106, '', this.textStyle(14, '#bfdbfe')).setScrollFactor(0).setDepth(1000)
    this.clockLabel = this.add.text(18, 178, '', this.textStyle(16, '#fde68a')).setScrollFactor(0).setDepth(1000)

    this.cursors = this.input.keyboard?.createCursorKeys()
    if (this.input.keyboard) {
      this.cameraKeys = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      }
    }

    this.updateSelectedLabel()
    this.updateMetrics()
    this.updateClockLabel()
    this.drawGrid()
    this.simulation.startDay()
    this.startClock()
    this.input.mouse?.disableContextMenu()

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isPanning) {
        const zoom = this.cameras.main.zoom
        this.cameras.main.setScroll(
          this.panScroll.x - (pointer.x - this.panPointer.x) / zoom,
          this.panScroll.y - (pointer.y - this.panPointer.y) / zoom,
        )
        return
      }
      const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2
      this.hovered = this.grid.screenToGrid(world.x, world.y)
      if (this.isDragging && pointer.leftButtonDown() && this.selected.type === 'wall') this.placeDraggedWall()
      this.drawPreview()
    })

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonDown()) {
        this.isPanning = true
        this.panPointer = { x: pointer.x, y: pointer.y }
        this.panScroll = { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY }
        return
      }
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
      this.isPanning = false
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
    this.input.keyboard?.on('keydown-SHIFT-S', () => this.toggleAutoSpawn())
    this.input.keyboard?.on('keydown-A', () => this.restock())
    this.input.keyboard?.on('keydown-N', () => this.startNextDay())
    this.input.keyboard?.on('keydown-Q', () => this.rotateScene(-1))
    this.input.keyboard?.on('keydown-E', () => this.rotateScene(1))
    this.input.keyboard?.on('keydown-ESC', () => {
      this.previewLayer.clear()
      this.hovered = { x: -1, y: -1 }
    })
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom - dy * .001, .5, 2))
    })
  }

  update(_time: number, delta: number) {
    const camera = this.cameras.main
    const amount = CAMERA_SPEED * (delta / 1000) / camera.zoom
    const up = this.cursors?.up.isDown || this.cameraKeys?.up.isDown
    const down = this.cursors?.down.isDown || this.cameraKeys?.down.isDown
    const left = this.cursors?.left.isDown || this.cameraKeys?.left.isDown
    const right = this.cursors?.right.isDown || this.cameraKeys?.right.isDown
    if (up) camera.scrollY -= amount
    if (down) camera.scrollY += amount
    if (left) camera.scrollX -= amount
    if (right) camera.scrollX += amount
  }

  private textStyle(fontSize: number, color = '#ffffff'): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontFamily: 'Arial', fontSize: `${fontSize}px`, color, backgroundColor: '#111827dd', padding: { x: 10, y: 7 } }
  }

  private rotateScene(step: -1 | 1) {
    if (this.customers.size > 0) {
      this.setStatus('La rotation est disponible lorsque les clients ont quitté la scène.', '#fbbf24')
      return
    }
    this.grid.rotateView(step)
    this.hovered = { x: -1, y: -1 }
    this.pathLayer.clear()
    this.previewLayer.clear()
    this.drawGrid()
    this.drawBuildings()
    this.setStatus(`Vue tournée à ${this.grid.rotation * 90}°.`, '#86efac')
  }

  private startClock() {
    this.clockTimer?.destroy()
    this.clockTimer = this.time.addEvent({
      delay: CLOCK_STEP_MS,
      loop: true,
      callback: () => {
        if (!this.storeOpen) return
        this.currentMinutes += CLOCK_STEP_MINUTES
        if (this.currentMinutes >= CLOSING_MINUTES) this.closeStore()
        this.updateClockLabel()
      },
    })
  }

  private closeStore() {
    if (!this.storeOpen) return
    this.storeOpen = false
    this.currentMinutes = CLOSING_MINUTES
    this.autoSpawn = false
    this.spawnTimer?.destroy()
    this.spawnTimer = undefined
    const snapshot = this.simulation.closeDay(this.day)
    this.showDaySummary(snapshot)
    this.setStatus('Magasin fermé. Les clients présents terminent leurs achats.', '#fbbf24')
    this.updateMetrics()
  }

  private showDaySummary(snapshot: ReturnType<StoreSimulation['closeDay']>) {
    this.summaryLabel?.destroy()
    this.summaryLabel = this.add.text(this.scale.width - 20, 20,
      `Bilan jour ${snapshot.day}\n` +
      `CA : ${snapshot.revenue.toFixed(0)} €\n` +
      `Résultat : ${snapshot.profit.toFixed(0)} €\n` +
      `Clients servis : ${snapshot.servedCustomers}\n` +
      `Clients perdus : ${snapshot.lostCustomers}\n` +
      `Articles vendus : ${snapshot.articlesSold}\n` +
      `Satisfaction : ${snapshot.averageSatisfaction.toFixed(0)} %\n` +
      `Attente : ${snapshot.averageQueueSeconds.toFixed(1)} s\n\n` +
      `Appuyez sur N pour le jour suivant`,
      this.textStyle(15, '#fef3c7'),
    ).setOrigin(1, 0).setScrollFactor(0).setDepth(1200)
  }

  private startNextDay() {
    if (this.storeOpen || this.customers.size > 0) {
      this.setStatus(this.storeOpen ? 'La journée est déjà en cours.' : 'Attendez le départ des derniers clients.', '#fbbf24')
      return
    }
    this.day += 1
    this.currentMinutes = OPENING_MINUTES
    this.storeOpen = true
    this.summaryLabel?.destroy()
    this.summaryLabel = undefined
    this.simulation.startDay()
    this.setStatus(`Jour ${this.day} ouvert.`, '#86efac')
    this.updateClockLabel()
    this.updateMetrics()
  }

  private updateClockLabel() {
    const hours = Math.floor(this.currentMinutes / 60)
    const minutes = this.currentMinutes % 60
    this.clockLabel.setText(`Jour ${this.day} · ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} · ${this.storeOpen ? 'OUVERT' : 'FERMÉ'}`)
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

  private syncSimulation() { this.simulation.syncBuildings(this.grid.getBuildings()) }

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
    if (!this.storeOpen) {
      this.setStatus('Le magasin est fermé.', '#f87171')
      return
    }
    this.autoSpawn = !this.autoSpawn
    this.spawnTimer?.destroy()
    this.spawnTimer = undefined
    if (this.autoSpawn) {
      this.spawnTimer = this.time.addEvent({ delay: 2_000, loop: true, callback: () => void this.spawnCustomer() })
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

  private findCustomerEntry(firstShelf: PlacedBuilding): CustomerRoute | undefined {
    const goals = this.grid.getAdjacentWalkableCells(firstShelf)
    if (!goals.length) return undefined
    const candidates = this.grid.getBorderWalkableCells()
      .map(entry => ({ entry, firstPath: this.navigation.findPathToAny(entry, goals) }))
      .filter(route => route.firstPath.length > 0)
      .sort((a, b) => a.firstPath.length - b.firstPath.length)
    return candidates[0]
  }

  private async spawnCustomer() {
    if (!this.storeOpen) {
      this.setStatus('Le magasin est fermé.', '#f87171')
      return
    }
    this.syncSimulation()
    const shelves = this.grid.getBuildings('shelf')
    const checkouts = this.grid.getBuildings('checkout')
    const shoppingPlan = this.simulation.createShoppingPlan(shelves)
    const checkout = this.simulation.chooseCheckout(checkouts)
    const route = shoppingPlan[0] ? this.findCustomerEntry(shoppingPlan[0].shelf) : undefined

    if (!shoppingPlan.length || !checkout || !route) {
      this.simulation.metrics.lostCustomers += 1
      const reason = !shoppingPlan.length
        ? 'Aucun rayon approvisionné disponible.'
        : !checkout
          ? 'Aucune caisse disponible.'
          : 'Aucune entrée ne permet de rejoindre le premier rayon sans traverser un mur.'
      this.setStatus(reason, '#fbbf24')
      this.updateMetrics()
      return
    }

    const id = `C${this.nextCustomer++}`
    const colors = [0xf97316, 0x22c55e, 0x3b82f6, 0xa855f7, 0xec4899, 0xeab308]
    const customer = new CustomerAgent(this, this.grid, id, route.entry, colors[this.nextCustomer % colors.length])
    this.customers.set(id, customer)
    void this.runCustomerCycle(customer, shoppingPlan, checkout, route)
    this.updateMetrics()
  }

  private async runCustomerCycle(
    customer: CustomerAgent,
    shoppingPlan: Array<{ shelf: PlacedBuilding; requestedQuantity: number }>,
    checkout: PlacedBuilding,
    route: CustomerRoute,
  ) {
    let queued = false
    let satisfaction = 100
    const basketLines: BasketLine[] = []
    try {
      for (let index = 0; index < shoppingPlan.length; index++) {
        const planned = shoppingPlan[index]
        const path = index === 0
          ? route.firstPath
          : this.navigation.findPathToAny(customer.position, this.grid.getAdjacentWalkableCells(planned.shelf))
        if (!path.length) continue
        this.setStatus(`${customer.id} cherche ${this.simulation.getShelfState(planned.shelf.id)?.product.name ?? 'un produit'}…`)
        this.drawPath(path)
        await customer.follow(path)
        await this.wait(650)
        const line = this.simulation.takeItems(planned.shelf.id, planned.requestedQuantity)
        if (line) basketLines.push(line)
        const basket = this.simulation.summarizeBasket(basketLines)
        customer.setBasketCount(basket.articleCount)
        this.drawBuildings()
        this.updateMetrics()
      }

      const basket = this.simulation.summarizeBasket(basketLines)
      if (basket.articleCount === 0) throw new Error('empty-basket')

      const checkoutPath = this.navigation.findPathToAny(customer.position, this.grid.getAdjacentWalkableCells(checkout))
      if (!checkoutPath.length) throw new Error('checkout-blocked')
      const position = this.simulation.enqueue(checkout.id, customer.id)
      queued = true
      this.setStatus(`${customer.id} rejoint la caisse avec ${basket.articleCount} article(s) · position ${position + 1}.`)
      this.drawPath(checkoutPath)
      await customer.follow(checkoutPath)
      await this.repositionQueue(checkout)

      const queueStartedAt = performance.now()
      while (!this.simulation.isFirst(checkout.id, customer.id)) {
        const queueTime = performance.now() - queueStartedAt
        satisfaction = Math.max(0, 100 - Math.round(queueTime / 180))
        customer.setMood(satisfaction)
        await this.repositionQueue(checkout)
        this.updateMetrics()
        if (queueTime >= MAX_QUEUE_WAIT_MS) throw new Error('impatient')
        await this.wait(350)
      }

      const queueTimeMs = performance.now() - queueStartedAt
      const payment = this.simulation.choosePaymentMethod()
      const checkoutDuration = this.simulation.getCheckoutDurationMs(basket.articleCount, payment)
      satisfaction = Math.max(15, 100 - Math.round(queueTimeMs / 180) - Math.round(checkoutDuration / 800))
      customer.setMood(satisfaction)
      this.simulation.startCheckout(checkout.id)
      await this.moveCustomerToCheckout(customer, checkout)
      this.setStatus(`${customer.id} : ${basket.articleCount} article(s), paiement ${this.paymentLabel(payment)} · ${(checkoutDuration / 1000).toFixed(1)} s.`)
      await this.wait(checkoutDuration)
      this.simulation.finishCheckout(checkout.id, customer.id, basket, payment, queueTimeMs, satisfaction)
      queued = false
      await this.repositionQueue(checkout)

      const exitPath = this.navigation.findPath(customer.position, route.entry)
      if (!exitPath.length) throw new Error('exit-blocked')
      this.drawPath(exitPath)
      await customer.follow(exitPath)
      this.setStatus(`${customer.id} a payé ${basket.saleTotal.toFixed(0)} € · satisfaction ${satisfaction} %.`, '#86efac')
    } catch (error) {
      this.simulation.abandon(queued ? checkout.id : undefined, customer.id, satisfaction)
      const reason = error instanceof Error && error.message === 'impatient'
        ? 'a perdu patience dans la file.'
        : error instanceof Error && error.message === 'path-blocked'
          ? 'est bloqué par une modification des murs.'
          : 'quitte le magasin sans finaliser ses achats.'
      this.setStatus(`${customer.id} ${reason}`, '#f87171')
      await this.repositionQueue(checkout)
    } finally {
      customer.destroy()
      this.customers.delete(customer.id)
      this.pathLayer.clear()
      this.drawQueues()
      this.updateMetrics()
      this.drawBuildings()
    }
  }

  private paymentLabel(payment: PaymentMethod) {
    return payment === 'contactless' ? 'sans contact' : payment === 'card' ? 'carte' : 'espèces'
  }

  private async repositionQueue(checkout: PlacedBuilding) {
    const queue = this.simulation.getQueue(checkout.id)
    const adjacent = this.grid.getAdjacentWalkableCells(checkout)[0]
    if (!adjacent) return
    const base = this.grid.gridToScreen(adjacent.x, adjacent.y)
    const moves = queue.map((customerId, index) => {
      const customer = this.customers.get(customerId)
      if (!customer) return Promise.resolve()
      return customer.moveVisualTo(base.x - index * 24, base.y + 26 + index * 14, 220)
    })
    await Promise.all(moves)
    this.drawQueues()
  }

  private async moveCustomerToCheckout(customer: CustomerAgent, checkout: PlacedBuilding) {
    const adjacent = this.grid.getAdjacentWalkableCells(checkout)[0]
    if (!adjacent) return
    const p = this.grid.gridToScreen(adjacent.x, adjacent.y)
    await customer.moveVisualTo(p.x + 8, p.y + 18, 180)
  }

  private wait(duration: number) {
    return new Promise<void>(resolve => this.time.delayedCall(duration, resolve))
  }

  private setStatus(message: string, color = '#cbd5e1') { this.statusLabel.setText(message).setColor(color) }

  private updateMetrics() {
    const m = this.simulation.metrics
    this.metricsLabel.setText(
      `Trésorerie ${m.cash.toFixed(0)} € · CA ${m.revenue.toFixed(0)} € · Résultat ${m.profit.toFixed(0)} €\n` +
      `Clients ${this.customers.size} · Servis ${m.servedCustomers} · Perdus ${m.lostCustomers} · Articles ${m.articlesSold} · Stock ${this.simulation.getTotalStock()}\n` +
      `Satisfaction ${this.simulation.getAverageSatisfaction().toFixed(0)} % · Attente ${this.simulation.getAverageQueueSeconds().toFixed(1)} s · Auto ${this.autoSpawn ? 'ON' : 'OFF'}\n` +
      `Paiements : sans contact ${m.contactlessPayments} · carte ${m.cardPayments} · espèces ${m.cashPayments}`,
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
    this.gridLayer.clear()
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
    this.shelfLabels.forEach(label => label.destroy())
    this.shelfLabels = []
    const buildings = [...this.grid.getBuildings()].sort((a, b) => {
      const pa = this.grid.gridToScreen(a.gridX, a.gridY)
      const pb = this.grid.gridToScreen(b.gridX, b.gridY)
      return pa.y - pb.y
    })
    const edges = [...this.grid.getEdges()].sort((a, b) => {
      const pa = this.grid.gridToScreen(a.gridX, a.gridY)
      const pb = this.grid.gridToScreen(b.gridX, b.gridY)
      return pa.y - pb.y
    })
    buildings.forEach(building => this.drawBuilding(building))
    edges.forEach(edge => this.drawEdge(edge))
    this.drawQueues()
  }

  private drawBuilding(building: PlacedBuilding) {
    const shelfState = building.definition.type === 'shelf' ? this.simulation.getShelfState(building.id) : undefined
    for (const cell of this.grid.getFootprint(building.definition, building.gridX, building.gridY, building.direction)) {
      const p = this.grid.gridToScreen(cell.x, cell.y)
      if (building.definition.type === 'shelf') this.box(p.x, p.y, 44, shelfState?.stock ? shelfState.product.color : 0x64748b)
      if (building.definition.type === 'checkout') this.box(p.x, p.y, 24, 0x2563eb)
    }
    if (shelfState) {
      const p = this.grid.gridToScreen(building.gridX, building.gridY)
      this.buildingsLayer.fillStyle(0xffffff, .95).fillRoundedRect(p.x - 24, p.y - 70, 48, 20, 4)
      const label = this.add.text(p.x, p.y - 60, `${shelfState.product.shortName} ${shelfState.stock}/${shelfState.capacity}`, {
        fontSize: '9px', color: '#111827', fontStyle: 'bold',
      }).setOrigin(.5).setDepth(35)
      this.shelfLabels.push(label)
    }
  }

  private drawQueues() {
    this.queueLayer.clear()
    this.queueLabels.forEach(label => label.destroy())
    this.queueLabels = []
    for (const checkout of this.grid.getBuildings('checkout')) {
      const queue = this.simulation.getQueue(checkout.id)
      const adjacent = this.grid.getAdjacentWalkableCells(checkout)[0]
      if (!adjacent) continue
      const p = this.grid.gridToScreen(adjacent.x, adjacent.y)
      queue.forEach((_customerId, index) => {
        const x = p.x - index * 24
        const y = p.y + 26 + index * 14
        this.queueLayer.lineStyle(2, 0x38bdf8, .7).strokeCircle(x, y, 10)
        const label = this.add.text(x, y + 14, `${index + 1}`, { fontSize: '9px', color: '#bae6fd' }).setOrigin(.5).setDepth(34)
        this.queueLabels.push(label)
      })
    }
  }

  private drawEdge(edge: PlacedEdge) {
    const p = this.grid.gridToScreen(edge.gridX, edge.gridY)
    const viewDirection = this.grid.getViewDirection(edge.direction)
    if (edge.type === 'wall') this.wall(p.x, p.y, viewDirection)
    else this.door(p.x, p.y, viewDirection)
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
    const viewDirection = this.grid.getViewDirection(direction)
    const { start, end } = this.edgeEndpoints(x, y, viewDirection)
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
