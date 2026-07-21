import Phaser from 'phaser'
import { BUILDING_CATALOG, getBuildingDefinition } from '@market-tycoon/catalog'
import type { BuildingDefinition, BuildingKey, PaymentMethod } from '@market-tycoon/catalog'
import { isCheckoutDefinition } from '@market-tycoon/catalog'
import { CustomerAgent } from './CustomerAgent'
import { GridManager, NavigationGrid, StoreSimulation, type BasketLine, type Direction, type GridCell, type PlacedBuilding, type PlacedEdge, type ShoppingPlanItem } from '@market-tycoon/simulation-engine'
import { getProductDefinition } from '@market-tycoon/catalog'

const MAX_QUEUE_WAIT_MS = 18_000
const OPENING_MINUTES = 8 * 60
const CLOSING_MINUTES = 20 * 60
const CLOCK_STEP_MINUTES = 10
const CLOCK_STEP_MS = 750
const CAMERA_SPEED = 520

interface CustomerRoute { entry: GridCell; firstPath: GridCell[] }

export class StoreScene extends Phaser.Scene {
  public grid = new GridManager(16, 16, 64, 32, 700, 80)
  public simulation = new StoreSimulation()
  public customers = new Map<string, CustomerAgent>()
  public autoSpawn = false
  public day = 1
  public currentMinutes = OPENING_MINUTES
  public selectedBuildingId: string | null = null

  private navigation = new NavigationGrid(this.grid)
  private selected: BuildingDefinition = BUILDING_CATALOG.standardShelf
  private direction: Direction = 0
  private hovered = { x: -1, y: -1 }
  private nextCustomer = 1
  private storeOpen = true

  private gridLayer!: Phaser.GameObjects.Graphics
  private pathLayer!: Phaser.GameObjects.Graphics
  private buildingsLayer!: Phaser.GameObjects.Graphics
  private queueLayer!: Phaser.GameObjects.Graphics
  private previewLayer!: Phaser.GameObjects.Graphics
  private selectionLayer!: Phaser.GameObjects.Graphics
  private statusLabel!: Phaser.GameObjects.Text
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
  private spawnTimer?: Phaser.Time.TimerEvent
  private clockTimer?: Phaser.Time.TimerEvent

  constructor() { super('StoreScene') }

  create() {
    this.gridLayer = this.add.graphics()
    this.pathLayer = this.add.graphics().setDepth(20)
    this.buildingsLayer = this.add.graphics().setDepth(30)
    this.queueLayer = this.add.graphics().setDepth(32)
    this.selectionLayer = this.add.graphics().setDepth(38)
    this.previewLayer = this.add.graphics().setDepth(40)
    this.statusLabel = this.add.text(18, 18, 'Construisez un rayon puis cliquez dessus pour le configurer.', this.textStyle(14)).setScrollFactor(0).setDepth(1000)

    this.cursors = this.input.keyboard?.createCursorKeys()
    if (this.input.keyboard) {
      this.cameraKeys = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      }
    }

    this.drawGrid()
    this.simulation.startDay()
    this.startClock()
    this.input.mouse?.disableContextMenu()
    this.bindPointerControls()
    this.bindKeyboardControls()
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom - dy * .001, .5, 2))
    })
  }

  update(_time: number, delta: number) {
    const camera = this.cameras.main
    const amount = CAMERA_SPEED * (delta / 1000) / camera.zoom
    if (this.cursors?.up.isDown || this.cameraKeys?.up.isDown) camera.scrollY -= amount
    if (this.cursors?.down.isDown || this.cameraKeys?.down.isDown) camera.scrollY += amount
    if (this.cursors?.left.isDown || this.cameraKeys?.left.isDown) camera.scrollX -= amount
    if (this.cursors?.right.isDown || this.cameraKeys?.right.isDown) camera.scrollX += amount
  }

  public select(key: BuildingKey | string) {
    const definition = getBuildingDefinition(key)
    if (!definition) return
    this.selected = definition
    this.direction = 0
    this.drawPreview()
    this.setStatus(`${definition.name} sélectionné · ${definition.price} €`)
  }

  public selectBuilding(buildingId: string | null) {
    this.selectedBuildingId = buildingId
    this.drawSelection()
  }

  public configureCompartment(buildingId: string, compartmentId: string, productKey: string | null) {
    const changed = this.simulation.assignProductToCompartment(buildingId, compartmentId, productKey)
    if (changed) {
      this.setStatus(productKey ? 'Produit affecté à l’emplacement.' : 'Emplacement vidé.', '#86efac')
      this.drawBuildings()
    }
    return changed
  }

  public restockCompartment(buildingId: string, compartmentId: string) {
    const restocked = this.simulation.restockCompartment(buildingId, compartmentId)
    this.setStatus(restocked ? 'Emplacement réapprovisionné.' : 'Réapprovisionnement impossible.', restocked ? '#86efac' : '#f87171')
    this.drawBuildings()
    return restocked
  }

  public restockEquipment(buildingId: string) {
    const restocked = this.simulation.restockEquipment(buildingId)
    this.setStatus(restocked ? 'Équipement réapprovisionné.' : 'Réapprovisionnement impossible.', restocked ? '#86efac' : '#f87171')
    this.drawBuildings()
    return restocked
  }

  public rotateScene(step: -1 | 1) {
    if (this.customers.size > 0) return this.setStatus('Attendez le départ des clients avant de tourner la scène.', '#fbbf24')
    this.grid.rotateView(step)
    this.hovered = { x: -1, y: -1 }
    this.pathLayer.clear()
    this.previewLayer.clear()
    this.drawGrid()
    this.drawBuildings()
  }

  public toggleAutoSpawn() {
    if (!this.storeOpen) return this.setStatus('Le magasin est fermé.', '#f87171')
    this.autoSpawn = !this.autoSpawn
    this.spawnTimer?.destroy()
    this.spawnTimer = undefined
    if (this.autoSpawn) this.spawnTimer = this.time.addEvent({ delay: 2_000, loop: true, callback: () => void this.spawnCustomer() })
    this.setStatus(`Arrivées automatiques ${this.autoSpawn ? 'activées' : 'désactivées'}.`, this.autoSpawn ? '#86efac' : '#cbd5e1')
  }

  public restock() {
    const restocked = this.simulation.restockAll()
    this.setStatus(restocked ? 'Tous les emplacements ont été réapprovisionnés.' : 'Budget insuffisant pour réapprovisionner.', restocked ? '#86efac' : '#f87171')
    this.drawBuildings()
  }

  public async spawnCustomer() {
    if (!this.storeOpen) return this.setStatus('Le magasin est fermé.', '#f87171')
    this.syncSimulation()
    const shoppingPlan = this.simulation.createShoppingPlan(this.grid.getBuildings('shelf'))
    const route = shoppingPlan[0] ? this.findCustomerEntry(shoppingPlan[0].shelf) : undefined
    if (!shoppingPlan.length || !route || !this.grid.getBuildings('checkout').length) {
      this.simulation.metrics.lostCustomers += 1
      this.setStatus('Il faut un emplacement approvisionné, une caisse et une entrée accessible.', '#fbbf24')
      return
    }
    const id = `C${this.nextCustomer++}`
    const colors = [0xf97316, 0x22c55e, 0x3b82f6, 0xa855f7, 0xec4899, 0xeab308]
    const customer = new CustomerAgent(this, this.grid, id, route.entry, colors[this.nextCustomer % colors.length])
    this.customers.set(id, customer)
    void this.runCustomerCycle(customer, shoppingPlan, route)
  }

  public startNextDay() {
    if (this.storeOpen || this.customers.size > 0) return
    this.day += 1
    this.currentMinutes = OPENING_MINUTES
    this.storeOpen = true
    this.summaryLabel?.destroy()
    this.summaryLabel = undefined
    this.simulation.startDay()
  }

  private bindPointerControls() {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isPanning) {
        const zoom = this.cameras.main.zoom
        this.cameras.main.setScroll(this.panScroll.x - (pointer.x - this.panPointer.x) / zoom, this.panScroll.y - (pointer.y - this.panPointer.y) / zoom)
        return
      }
      const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2
      this.hovered = this.grid.screenToGrid(world.x, world.y)
      if (this.isDragging && pointer.leftButtonDown() && this.selected.category === 'wall') this.placeDraggedWall()
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
      const existing = this.grid.getBuildingAt(this.hovered.x, this.hovered.y)
      if (pointer.rightButtonDown()) {
        if (existing?.id === this.selectedBuildingId) this.selectedBuildingId = null
        this.grid.removeAt(this.hovered.x, this.hovered.y, this.direction)
        this.syncSimulation()
      } else if (existing && this.selected.category !== 'wall' && this.selected.category !== 'door') {
        this.selectBuilding(existing.id)
        this.setStatus(`${existing.definition.name} sélectionné · configurez son contenu dans le panneau.`)
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
      this.isPanning = false
      this.lastDragKey = ''
    })
  }

  private bindKeyboardControls() {
    this.input.keyboard?.on('keydown-R', () => { this.direction = ((this.direction + 1) % 4) as Direction; this.drawPreview() })
    this.input.keyboard?.on('keydown-ONE', () => this.select('standard-shelf'))
    this.input.keyboard?.on('keydown-TWO', () => this.select('standard-checkout'))
    this.input.keyboard?.on('keydown-THREE', () => this.select('wall'))
    this.input.keyboard?.on('keydown-FOUR', () => this.select('door'))
    this.input.keyboard?.on('keydown-C', () => void this.spawnCustomer())
    this.input.keyboard?.on('keydown-N', () => this.startNextDay())
  }

  private startClock() {
    this.clockTimer?.destroy()
    this.clockTimer = this.time.addEvent({ delay: CLOCK_STEP_MS, loop: true, callback: () => {
      if (!this.storeOpen) return
      this.currentMinutes += CLOCK_STEP_MINUTES
      if (this.currentMinutes >= CLOSING_MINUTES) this.closeStore()
    } })
  }

  private closeStore() {
    if (!this.storeOpen) return
    this.storeOpen = false
    this.currentMinutes = CLOSING_MINUTES
    this.autoSpawn = false
    this.spawnTimer?.destroy()
    const snapshot = this.simulation.closeDay(this.day, this.grid.getBuildings())
    this.summaryLabel?.destroy()
    this.summaryLabel = this.add.text(this.scale.width - 20, 20,
      `Bilan jour ${snapshot.day}\nCA : ${snapshot.revenue.toFixed(0)} €\nConstruction : ${snapshot.constructionExpenses.toFixed(0)} €\nMarchandises : ${snapshot.merchandiseExpenses.toFixed(0)} €\nÉlectricité : ${snapshot.operatingExpenses.toFixed(0)} €\nBénéfice : ${snapshot.profit.toFixed(0)} €\nClients servis : ${snapshot.servedCustomers}\nClients perdus : ${snapshot.lostCustomers}\n\nN : jour suivant`,
      this.textStyle(15, '#fef3c7'),
    ).setOrigin(1, 0).setScrollFactor(0).setDepth(1200)
  }

  private placeSelected() {
    if (!this.simulation.canSpend(this.selected.price)) return this.setStatus('Budget insuffisant.', '#f87171')
    const placed = this.grid.place(this.selected, this.hovered.x, this.hovered.y, this.direction)
    if (placed) {
      this.simulation.spend(this.selected.price)
      this.syncSimulation()
      if ('definition' in placed) this.selectedBuildingId = placed.id
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
    }
  }

  private syncSimulation() { this.simulation.syncBuildings(this.grid.getBuildings()) }
  private findCustomerEntry(firstShelf: PlacedBuilding): CustomerRoute | undefined {
    const goals = this.grid.getAdjacentWalkableCells(firstShelf)
    return this.grid.getBorderWalkableCells().map(entry => ({ entry, firstPath: this.navigation.findPathToAny(entry, goals) })).filter(route => route.firstPath.length > 0).sort((a, b) => a.firstPath.length - b.firstPath.length)[0]
  }

  private async runCustomerCycle(customer: CustomerAgent, shoppingPlan: ShoppingPlanItem[], route: CustomerRoute) {
    let queuedCheckout: PlacedBuilding | undefined
    let satisfaction = 100
    const basketLines: BasketLine[] = []
    try {
      for (let index = 0; index < shoppingPlan.length; index++) {
        const planned = shoppingPlan[index]
        const path = index === 0 ? route.firstPath : this.navigation.findPathToAny(customer.position, this.grid.getAdjacentWalkableCells(planned.shelf))
        if (!path.length) continue
        this.drawPath(path)
        await customer.follow(path)
        await this.wait(this.simulation.getPickupTimeMs(planned.shelf))
        const line = this.simulation.takeItems(planned.shelf.id, planned.compartmentId, planned.requestedQuantity)
        if (line) basketLines.push(line)
        customer.setBasketCount(this.simulation.summarizeBasket(basketLines).articleCount)
        this.drawBuildings()
      }
      const basket = this.simulation.summarizeBasket(basketLines)
      if (!basket.articleCount) throw new Error('empty-basket')
      const checkouts = this.grid.getBuildings('checkout')
      let payment = this.simulation.choosePaymentMethod()
      let checkout = this.simulation.chooseCheckout(checkouts, basket, payment)
      if (!checkout) {
        checkout = this.simulation.chooseCheckout(checkouts, basket)
        if (!checkout || !isCheckoutDefinition(checkout.definition)) throw new Error('no-compatible-checkout')
        payment = this.simulation.choosePaymentMethod(checkout.definition.acceptedPayments)
      }
      queuedCheckout = checkout
      const checkoutPath = this.navigation.findPathToAny(customer.position, this.grid.getAdjacentWalkableCells(checkout))
      if (!checkoutPath.length) throw new Error('checkout-blocked')
      this.simulation.enqueue(checkout.id, customer.id)
      await customer.follow(checkoutPath)
      await this.repositionQueue(checkout)
      const queueStartedAt = performance.now()
      while (!this.simulation.isFirst(checkout.id, customer.id)) {
        const queueTime = performance.now() - queueStartedAt
        satisfaction = Math.max(0, 100 - Math.round(queueTime / 180))
        customer.setMood(satisfaction)
        if (queueTime >= MAX_QUEUE_WAIT_MS) throw new Error('impatient')
        await this.wait(350)
      }
      const queueTimeMs = performance.now() - queueStartedAt
      const timing = this.simulation.getCheckoutTiming(checkout, basket.articleCount, payment)
      satisfaction = Math.max(15, satisfaction - Math.round(timing.durationMs / 900) - (timing.incident ? 15 : 0))
      customer.setMood(satisfaction)
      this.simulation.startCheckout(checkout.id)
      await this.moveCustomerToCheckout(customer, checkout)
      this.setStatus(`${customer.id} · ${checkout.definition.name} · ${this.paymentLabel(payment)}${timing.incident ? ' · assistance requise' : ''}`)
      await this.wait(timing.durationMs)
      this.simulation.finishCheckout(checkout.id, customer.id, basket, payment, queueTimeMs, satisfaction)
      queuedCheckout = undefined
      await this.repositionQueue(checkout)
      const exitPath = this.navigation.findPath(customer.position, route.entry)
      if (!exitPath.length) throw new Error('exit-blocked')
      await customer.follow(exitPath)
    } catch {
      this.simulation.abandon(queuedCheckout?.id, customer.id, satisfaction)
      this.setStatus(`${customer.id} quitte le magasin sans finaliser ses achats.`, '#f87171')
      if (queuedCheckout) await this.repositionQueue(queuedCheckout)
    } finally {
      customer.destroy()
      this.customers.delete(customer.id)
      this.pathLayer.clear()
      this.drawQueues()
      this.drawBuildings()
    }
  }

  private paymentLabel(payment: PaymentMethod) { return payment === 'contactless' ? 'sans contact' : payment === 'card' ? 'carte' : 'espèces' }
  private async repositionQueue(checkout: PlacedBuilding) {
    const queue = this.simulation.getQueue(checkout.id)
    const adjacent = this.grid.getAdjacentWalkableCells(checkout)[0]
    if (!adjacent) return
    const base = this.grid.gridToScreen(adjacent.x, adjacent.y)
    await Promise.all(queue.map((customerId, index) => {
      const customer = this.customers.get(customerId)
      return customer ? customer.moveVisualTo(base.x - index * 24, base.y + 26 + index * 14, 220) : Promise.resolve()
    }))
    this.drawQueues()
  }
  private async moveCustomerToCheckout(customer: CustomerAgent, checkout: PlacedBuilding) {
    const adjacent = this.grid.getAdjacentWalkableCells(checkout)[0]
    if (!adjacent) return
    const p = this.grid.gridToScreen(adjacent.x, adjacent.y)
    await customer.moveVisualTo(p.x + 8, p.y + 18, 180)
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
    const isEdgeTool = this.selected.category === 'wall' || this.selected.category === 'door'
    if (!isEdgeTool && this.grid.getBuildingAt(this.hovered.x, this.hovered.y)) return
    const valid = this.grid.canPlace(this.selected, this.hovered.x, this.hovered.y, this.direction) && this.simulation.canSpend(this.selected.price)
    const color = valid ? 0x22c55e : 0xef4444
    if (isEdgeTool) {
      const p = this.grid.gridToScreen(this.hovered.x, this.hovered.y)
      this.drawEdgePreview(p.x, p.y, this.direction, color)
      return
    }
    for (const cell of this.grid.getFootprint(this.selected, this.hovered.x, this.hovered.y, this.direction)) {
      const p = this.grid.gridToScreen(cell.x, cell.y)
      this.diamond(this.previewLayer, p.x, p.y, color, .5, color)
    }
  }

  public drawBuildings() {
    this.buildingsLayer.clear()
    this.shelfLabels.forEach(label => label.destroy())
    this.shelfLabels = []
    const buildings = [...this.grid.getBuildings()].sort((a, b) => this.grid.gridToScreen(a.gridX, a.gridY).y - this.grid.gridToScreen(b.gridX, b.gridY).y)
    buildings.forEach(building => this.drawBuilding(building))
    this.grid.getEdges().forEach(edge => this.drawEdge(edge))
    this.drawSelection()
    this.drawQueues()
  }
  private drawBuilding(building: PlacedBuilding) {
    const renderer = building.definition.renderer
    if (renderer === 'fruit-shelf') return this.drawShelfBoxes(building, 26, 0x84cc16, true)
    if (renderer === 'refrigerated-shelf') return this.drawColdShelf(building, false)
    if (renderer === 'freezer') return this.drawColdShelf(building, true)
    if (renderer === 'bakery-shelf') return this.drawShelfBoxes(building, 32, 0xc08457, true)
    if (renderer === 'self-checkout') return this.drawCheckout(building, 20, 0x06b6d4)
    if (renderer === 'express-checkout') return this.drawCheckout(building, 22, 0xf59e0b)
    if (renderer === 'standard-checkout') return this.drawCheckout(building, 28, 0x2563eb)
    this.drawShelfBoxes(building, 44, building.definition.color)
  }
  private drawColdShelf(building: PlacedBuilding, frozen: boolean) {
    this.drawShelfBoxes(building, 38, frozen ? 0x38bdf8 : 0x22c55e)
    for (const cell of this.grid.getFootprint(building.definition, building.gridX, building.gridY, building.direction)) {
      const p = this.grid.gridToScreen(cell.x, cell.y)
      this.buildingsLayer.lineStyle(2, 0xe0f2fe, .9).strokeRoundedRect(p.x - 20, p.y - 35, 40, 24, 4)
    }
  }
  private drawShelfBoxes(building: PlacedBuilding, height: number, color: number, open = false) {
    const inventory = this.simulation.getEquipmentInventory(building.id)
    const totalStock = inventory?.compartments.reduce((total, slot) => total + slot.quantity, 0) ?? 0
    for (const cell of this.grid.getFootprint(building.definition, building.gridX, building.gridY, building.direction)) {
      const p = this.grid.gridToScreen(cell.x, cell.y)
      this.box(p.x, p.y, height, totalStock > 0 ? color : 0x64748b)
      if (open) this.buildingsLayer.fillStyle(0xfef3c7, .65).fillEllipse(p.x, p.y - height + 8, 28, 12)
    }
    if (inventory) {
      const configured = inventory.compartments.filter(slot => slot.productKey)
      const products = [...new Set(configured.map(slot => getProductDefinition(slot.productKey!)?.shortName).filter(Boolean))]
      const capacity = configured.reduce((total, slot) => total + slot.capacity, 0)
      const p = this.grid.gridToScreen(building.gridX, building.gridY)
      const label = this.add.text(p.x, p.y - height - 18, `${products.slice(0, 3).join(' · ') || 'VIDE'} ${totalStock}/${capacity}`, { fontSize: '9px', color: '#111827', backgroundColor: '#ffffffdd', padding: { x: 3, y: 2 } }).setOrigin(.5).setDepth(35)
      this.shelfLabels.push(label)
    }
  }
  private drawCheckout(building: PlacedBuilding, height: number, color: number) {
    for (const cell of this.grid.getFootprint(building.definition, building.gridX, building.gridY, building.direction)) {
      const p = this.grid.gridToScreen(cell.x, cell.y)
      this.box(p.x, p.y, height, color)
    }
  }
  private drawSelection() {
    this.selectionLayer.clear()
    if (!this.selectedBuildingId) return
    const building = this.grid.getBuildings().find(item => item.id === this.selectedBuildingId)
    if (!building) return
    for (const cell of this.grid.getFootprint(building.definition, building.gridX, building.gridY, building.direction)) {
      const p = this.grid.gridToScreen(cell.x, cell.y)
      this.diamond(this.selectionLayer, p.x, p.y, 0xfacc15, .12, 0xfacc15)
    }
  }
  private drawQueues() {
    this.queueLayer.clear()
    this.queueLabels.forEach(label => label.destroy())
    this.queueLabels = []
    for (const checkout of this.grid.getBuildings('checkout')) {
      const adjacent = this.grid.getAdjacentWalkableCells(checkout)[0]
      if (!adjacent) continue
      const p = this.grid.gridToScreen(adjacent.x, adjacent.y)
      this.simulation.getQueue(checkout.id).forEach((_id, index) => {
        const x = p.x - index * 24, y = p.y + 26 + index * 14
        this.queueLayer.lineStyle(2, 0x38bdf8, .7).strokeCircle(x, y, 10)
        this.queueLabels.push(this.add.text(x, y + 14, `${index + 1}`, { fontSize: '9px', color: '#bae6fd' }).setOrigin(.5).setDepth(34))
      })
    }
  }
  private drawEdge(edge: PlacedEdge) {
    const p = this.grid.gridToScreen(edge.gridX, edge.gridY)
    const direction = this.grid.getViewDirection(edge.direction)
    const { start, end } = this.edgeEndpoints(p.x, p.y, direction)
    if (edge.type === 'wall') this.buildingsLayer.fillStyle(0xcbd5e1).beginPath().moveTo(start.x, start.y).lineTo(end.x, end.y).lineTo(end.x, end.y - 46).lineTo(start.x, start.y - 46).closePath().fillPath()
    else this.buildingsLayer.lineStyle(5, 0x7c3aed).beginPath().moveTo(start.x, start.y).lineTo(start.x, start.y - 42).moveTo(end.x, end.y).lineTo(end.x, end.y - 42).strokePath()
  }
  private diamond(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, alpha: number, line: number) {
    const w = this.grid.tileWidth / 2, h = this.grid.tileHeight / 2
    g.fillStyle(color, alpha).lineStyle(1, line, .8).beginPath().moveTo(x, y).lineTo(x + w, y + h).lineTo(x, y + h * 2).lineTo(x - w, y + h).closePath().fillPath().strokePath()
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
    return direction % 2 === 0 ? { start: { x, y }, end: { x: x + w, y: y + h } } : { start: { x, y }, end: { x: x - w, y: y + h } }
  }
  private drawEdgePreview(x: number, y: number, direction: Direction, color: number) {
    const { start, end } = this.edgeEndpoints(x, y, this.grid.getViewDirection(direction))
    this.previewLayer.lineStyle(7, color, .8).beginPath().moveTo(start.x, start.y).lineTo(end.x, end.y).strokePath()
  }
  private wait(duration: number) { return new Promise<void>(resolve => this.time.delayedCall(duration, resolve)) }
  private setStatus(message: string, color = '#cbd5e1') { this.statusLabel.setText(message).setColor(color) }
  private textStyle(fontSize: number, color = '#ffffff'): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontFamily: 'Arial', fontSize: `${fontSize}px`, color, backgroundColor: '#111827dd', padding: { x: 10, y: 7 } }
  }
}
