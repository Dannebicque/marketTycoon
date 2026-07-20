import Phaser from 'phaser'
import { GridManager, type BuildingDefinition, type Direction } from './GridManager'

const SHELF: BuildingDefinition = { type: 'shelf', width: 1, height: 3, price: 100 }

export class StoreScene extends Phaser.Scene {
  private grid = new GridManager(16, 16, 64, 32, 700, 80)
  private gridLayer!: Phaser.GameObjects.Graphics
  private buildingsLayer!: Phaser.GameObjects.Graphics
  private previewLayer!: Phaser.GameObjects.Graphics
  private hovered = { x: -1, y: -1 }
  private direction: Direction = 0

  constructor() { super('StoreScene') }

  create() {
    this.gridLayer = this.add.graphics()
    this.buildingsLayer = this.add.graphics()
    this.previewLayer = this.add.graphics()
    this.drawGrid()

    this.input.mouse?.disableContextMenu()
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2
      this.hovered = this.grid.screenToGrid(world.x, world.y)
      this.drawPreview()
    })
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.grid.isInside(this.hovered.x, this.hovered.y)) return
      if (pointer.rightButtonDown()) this.grid.removeAt(this.hovered.x, this.hovered.y)
      else this.grid.place(SHELF, this.hovered.x, this.hovered.y, this.direction)
      this.drawBuildings()
      this.drawPreview()
    })
    this.input.keyboard?.on('keydown-R', () => {
      this.direction = ((this.direction + 1) % 4) as Direction
      this.drawPreview()
    })
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom - dy * 0.001, .5, 2))
    })
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
    const valid = this.grid.canPlace(SHELF, this.hovered.x, this.hovered.y, this.direction)
    const color = valid ? 0x22c55e : 0xef4444
    for (const cell of this.grid.getFootprint(SHELF, this.hovered.x, this.hovered.y, this.direction)) {
      const p = this.grid.gridToScreen(cell.x, cell.y)
      this.diamond(this.previewLayer, p.x, p.y, color, .5, color)
    }
  }

  private drawBuildings() {
    this.buildingsLayer.clear()
    for (const building of this.grid.getBuildings().sort((a, b) => a.gridX + a.gridY - b.gridX - b.gridY)) {
      for (const cell of this.grid.getFootprint(building.definition, building.gridX, building.gridY, building.direction)) {
        const p = this.grid.gridToScreen(cell.x, cell.y)
        this.box(p.x, p.y, 44)
      }
    }
  }

  private diamond(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, alpha: number, line: number) {
    const w = this.grid.tileWidth / 2, h = this.grid.tileHeight / 2
    g.fillStyle(color, alpha).lineStyle(1, line, .8).beginPath()
    g.moveTo(x, y).lineTo(x + w, y + h).lineTo(x, y + h * 2).lineTo(x - w, y + h).closePath().fillPath().strokePath()
  }

  private box(x: number, y: number, height: number) {
    const g = this.buildingsLayer, w = 25, d = 12
    g.fillStyle(0x6b4226).beginPath().moveTo(x - w, y + d).lineTo(x, y + d * 2).lineTo(x, y + d * 2 - height).lineTo(x - w, y + d - height).closePath().fillPath()
    g.fillStyle(0x815432).beginPath().moveTo(x, y + d * 2).lineTo(x + w, y + d).lineTo(x + w, y + d - height).lineTo(x, y + d * 2 - height).closePath().fillPath()
    g.fillStyle(0xb07a4f).beginPath().moveTo(x, y - height).lineTo(x + w, y + d - height).lineTo(x, y + d * 2 - height).lineTo(x - w, y + d - height).closePath().fillPath()
  }
}
