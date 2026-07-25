export interface ConstructionPoint { x: number; y: number }

export interface ConstructionRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ConstructionPreview {
  kind: 'room' | 'floor' | 'fill' | 'blueprint'
  bounds: ConstructionRect
  cells: ConstructionPoint[]
  valid: boolean
  message?: string
  materialKey?: string
  materialCost: number
  structuralCost: number
  totalCost: number
}

export function createRectangleBounds(start: ConstructionPoint, end: ConstructionPoint): ConstructionRect {
  const x = Math.min(start.x, end.x)
  const y = Math.min(start.y, end.y)
  return {
    x,
    y,
    width: Math.abs(end.x - start.x) + 1,
    height: Math.abs(end.y - start.y) + 1,
  }
}

export function getRectangleCells(bounds: ConstructionRect): ConstructionPoint[] {
  const cells: ConstructionPoint[] = []
  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) cells.push({ x, y })
  }
  return cells
}

export function getRectanglePerimeterUnits(bounds: ConstructionRect) {
  if (bounds.width <= 0 || bounds.height <= 0) return 0
  if (bounds.width === 1) return bounds.height * 2
  if (bounds.height === 1) return bounds.width * 2
  return (bounds.width + bounds.height) * 2
}
