import Phaser from 'phaser'
import { GridManager, type GridCell } from './GridManager'

export class CustomerAgent {
  private sprite: Phaser.GameObjects.Container
  private current: GridCell

  constructor(
    private scene: Phaser.Scene,
    private grid: GridManager,
    readonly id: string,
    start: GridCell,
    color: number,
  ) {
    this.current = start
    const p = this.grid.gridToScreen(start.x, start.y)
    const shadow = scene.add.ellipse(0, 10, 22, 10, 0x000000, .25)
    const body = scene.add.circle(0, -2, 9, color)
    const head = scene.add.circle(0, -17, 6, 0xf5c2a8)
    const label = scene.add.text(0, -32, id.slice(-2), { fontSize: '9px', color: '#ffffff' }).setOrigin(.5)
    this.sprite = scene.add.container(p.x, p.y + 10, [shadow, body, head, label]).setDepth(100)
  }

  get position() {
    return this.current
  }

  async follow(path: GridCell[], onStep?: (cell: GridCell) => void) {
    for (const cell of path.slice(1)) {
      await this.moveTo(cell)
      this.current = cell
      onStep?.(cell)
    }
  }

  destroy() {
    this.sprite.destroy(true)
  }

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