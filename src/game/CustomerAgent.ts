import Phaser from 'phaser'
import { GridManager, type GridCell } from './GridManager'

export class CustomerAgent {
  private sprite: Phaser.GameObjects.Container
  private body: Phaser.GameObjects.Arc
  private current: GridCell

  constructor(
    private scene: Phaser.Scene,
    private grid: GridManager,
    public readonly id: string,
    start: GridCell,
    color = 0xf97316,
  ) {
    this.current = start
    const p = this.grid.gridToScreen(start.x, start.y)
    const shadow = scene.add.ellipse(0, 10, 22, 10, 0x000000, .25)
    this.body = scene.add.circle(0, -2, 9, color)
    const head = scene.add.circle(0, -17, 6, 0xf5c2a8)
    const label = scene.add.text(0, -34, id, { fontSize: '10px', color: '#ffffff', backgroundColor: '#111827cc', padding: { x: 3, y: 1 } }).setOrigin(.5)
    this.sprite = scene.add.container(p.x, p.y + 10, [shadow, this.body, head, label]).setDepth(100)
  }

  get position() { return this.current }

  async follow(path: GridCell[], onStep?: (cell: GridCell) => void) {
    for (const cell of path.slice(1)) {
      if (this.grid.isMovementBlocked(this.current, cell) || !this.grid.isWalkable(cell.x, cell.y)) {
        throw new Error('path-blocked')
      }
      await this.moveTo(cell)
      this.current = cell
      onStep?.(cell)
    }
  }

  setMood(level: number) {
    const color = level >= 65 ? 0x22c55e : level >= 35 ? 0xeab308 : 0xef4444
    this.body.setFillStyle(color)
  }

  moveInstantly(cell: GridCell) {
    this.current = cell
    const p = this.grid.gridToScreen(cell.x, cell.y)
    this.sprite.setPosition(p.x, p.y + 10)
  }

  destroy() { this.sprite.destroy(true) }

  private moveTo(cell: GridCell) {
    const p = this.grid.gridToScreen(cell.x, cell.y)
    return new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: this.sprite,
        x: p.x,
        y: p.y + 10,
        duration: 230,
        ease: 'Linear',
        onComplete: () => resolve(),
      })
    })
  }
}
