export interface BuildSurfaceCell {
  x: number
  y: number
  style: string
}

export interface BuildSurfaceSnapshot {
  cells: BuildSurfaceCell[]
}

export class BuildSurfaceMap {
  private readonly cells = new Map<string, string>()

  get(x: number, y: number) { return this.cells.get(key(x, y)) }

  set(x: number, y: number, style: string) {
    if (!style.trim()) return false
    this.cells.set(key(x, y), style.trim())
    return true
  }

  clear(x: number, y: number) { return this.cells.delete(key(x, y)) }

  paint(cells: Array<{ x: number; y: number }>, style: string) {
    for (const cell of cells) this.set(cell.x, cell.y, style)
  }

  entries(): BuildSurfaceCell[] {
    return [...this.cells.entries()].map(([position, style]) => {
      const [x, y] = position.split(':').map(Number)
      return { x, y, style }
    })
  }

  snapshot(): BuildSurfaceSnapshot { return { cells: this.entries() } }

  restore(snapshot: BuildSurfaceSnapshot) {
    this.cells.clear()
    for (const cell of snapshot.cells) this.cells.set(key(cell.x, cell.y), cell.style)
  }
}

export function rectangleCells(start: { x: number; y: number }, end: { x: number; y: number }) {
  const minX = Math.min(start.x, end.x)
  const maxX = Math.max(start.x, end.x)
  const minY = Math.min(start.y, end.y)
  const maxY = Math.max(start.y, end.y)
  const cells: Array<{ x: number; y: number }> = []
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) cells.push({ x, y })
  return cells
}

export function floodFillCells(
  start: { x: number; y: number },
  canVisit: (cell: { x: number; y: number }) => boolean,
  columns: number,
  rows: number,
) {
  const result: Array<{ x: number; y: number }> = []
  const visited = new Set<string>()
  const queue = [start]
  while (queue.length) {
    const cell = queue.shift()!
    const id = key(cell.x, cell.y)
    if (visited.has(id) || cell.x < 0 || cell.y < 0 || cell.x >= columns || cell.y >= rows || !canVisit(cell)) continue
    visited.add(id)
    result.push(cell)
    queue.push({ x: cell.x + 1, y: cell.y }, { x: cell.x - 1, y: cell.y }, { x: cell.x, y: cell.y + 1 }, { x: cell.x, y: cell.y - 1 })
  }
  return result
}

function key(x: number, y: number) { return `${x}:${y}` }
