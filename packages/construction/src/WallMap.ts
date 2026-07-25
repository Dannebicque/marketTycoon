import type { ConstructionPoint, ConstructionRect } from './ConstructionPreview'

export type WallSegmentKind = 'wall' | 'door' | 'window' | 'storefront'
export type WallOrientation = 'north' | 'east' | 'south' | 'west'

export interface WallSegment {
  id: string
  x: number
  y: number
  orientation: WallOrientation
  kind: WallSegmentKind
  materialKey: string
}

export interface WallMapSnapshot {
  segments: WallSegment[]
}

export class WallMap {
  private readonly segments = new Map<string, WallSegment>()
  private nextId = 1

  add(input: Omit<WallSegment, 'id'>) {
    const key = segmentKey(input.x, input.y, input.orientation)
    if (this.segments.has(key)) return undefined
    const segment: WallSegment = { ...input, id: `wall-${this.nextId++}` }
    this.segments.set(key, segment)
    return segment
  }

  remove(x: number, y: number, orientation: WallOrientation) {
    return this.segments.delete(segmentKey(x, y, orientation))
  }

  get(x: number, y: number, orientation: WallOrientation) {
    return this.segments.get(segmentKey(x, y, orientation))
  }

  entries() {
    return [...this.segments.values()].map(segment => ({ ...segment }))
  }

  snapshot(): WallMapSnapshot {
    return { segments: this.entries() }
  }

  restore(snapshot: WallMapSnapshot) {
    this.segments.clear()
    let largestId = 0
    for (const segment of snapshot.segments) {
      this.segments.set(segmentKey(segment.x, segment.y, segment.orientation), { ...segment })
      const numericId = Number(segment.id.replace('wall-', ''))
      if (Number.isFinite(numericId)) largestId = Math.max(largestId, numericId)
    }
    this.nextId = largestId + 1
  }

  addRectangle(bounds: ConstructionRect, materialKey: string, kind: WallSegmentKind = 'wall') {
    const added: WallSegment[] = []
    for (const candidate of rectangleWallSegments(bounds, materialKey, kind)) {
      const segment = this.add(candidate)
      if (segment) added.push(segment)
    }
    return added
  }
}

export function rectangleWallSegments(bounds: ConstructionRect, materialKey: string, kind: WallSegmentKind = 'wall'): Array<Omit<WallSegment, 'id'>> {
  const result: Array<Omit<WallSegment, 'id'>> = []
  const maxX = bounds.x + bounds.width - 1
  const maxY = bounds.y + bounds.height - 1
  for (let x = bounds.x; x <= maxX; x++) {
    result.push({ x, y: bounds.y, orientation: 'north', kind, materialKey })
    result.push({ x, y: maxY, orientation: 'south', kind, materialKey })
  }
  for (let y = bounds.y; y <= maxY; y++) {
    result.push({ x: bounds.x, y, orientation: 'west', kind, materialKey })
    result.push({ x: maxX, y, orientation: 'east', kind, materialKey })
  }
  return result
}

export function wallSegmentPoint(segment: WallSegment): ConstructionPoint {
  return { x: segment.x, y: segment.y }
}

function segmentKey(x: number, y: number, orientation: WallOrientation) {
  return `${x}:${y}:${orientation}`
}
