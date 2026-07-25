import type { ConstructionPoint } from './ConstructionPreview'
import type { WallOrientation, WallSegment, WallSegmentKind } from './WallMap'

export interface WallSegmentProperties {
  transparent: boolean
  blocksMovement: boolean
  daylightFactor: number
  visibilityFactor: number
  facadeOnly: boolean
}

export interface BuildingEnvelopeMetrics {
  segmentCount: number
  exteriorSegmentCount: number
  glazedSegmentCount: number
  storefrontCount: number
  daylightScore: number
  visibilityScore: number
  glazedFacadeRatio: number
}

const PROPERTIES: Record<WallSegmentKind, WallSegmentProperties> = {
  wall: { transparent: false, blocksMovement: true, daylightFactor: 0, visibilityFactor: 0, facadeOnly: false },
  door: { transparent: false, blocksMovement: false, daylightFactor: 0.05, visibilityFactor: 0.1, facadeOnly: false },
  window: { transparent: true, blocksMovement: true, daylightFactor: 0.65, visibilityFactor: 0.45, facadeOnly: true },
  storefront: { transparent: true, blocksMovement: true, daylightFactor: 0.9, visibilityFactor: 1, facadeOnly: true },
}

export function getWallSegmentProperties(kind: WallSegmentKind): WallSegmentProperties {
  return { ...PROPERTIES[kind] }
}

export function adjacentCellForSegment(segment: Pick<WallSegment, 'x' | 'y' | 'orientation'>): ConstructionPoint {
  if (segment.orientation === 'north') return { x: segment.x, y: segment.y - 1 }
  if (segment.orientation === 'east') return { x: segment.x + 1, y: segment.y }
  if (segment.orientation === 'south') return { x: segment.x, y: segment.y + 1 }
  return { x: segment.x - 1, y: segment.y }
}

export function isExteriorSegment(
  segment: Pick<WallSegment, 'x' | 'y' | 'orientation'>,
  isInterior: (point: ConstructionPoint) => boolean,
) {
  return !isInterior(adjacentCellForSegment(segment))
}

export function analyzeBuildingEnvelope(
  segments: readonly WallSegment[],
  isInterior: (point: ConstructionPoint) => boolean,
): BuildingEnvelopeMetrics {
  const exterior = segments.filter(segment => isExteriorSegment(segment, isInterior))
  const glazed = exterior.filter(segment => getWallSegmentProperties(segment.kind).transparent)
  const daylight = exterior.reduce((total, segment) => total + getWallSegmentProperties(segment.kind).daylightFactor, 0)
  const visibility = exterior.reduce((total, segment) => total + getWallSegmentProperties(segment.kind).visibilityFactor, 0)
  const divisor = Math.max(1, exterior.length)

  return {
    segmentCount: segments.length,
    exteriorSegmentCount: exterior.length,
    glazedSegmentCount: glazed.length,
    storefrontCount: exterior.filter(segment => segment.kind === 'storefront').length,
    daylightScore: Math.round((daylight / divisor) * 100),
    visibilityScore: Math.round((visibility / divisor) * 100),
    glazedFacadeRatio: Math.round((glazed.length / divisor) * 100),
  }
}

export function orientationLabel(orientation: WallOrientation) {
  return orientation === 'north' ? 'nord' : orientation === 'east' ? 'est' : orientation === 'south' ? 'sud' : 'ouest'
}
