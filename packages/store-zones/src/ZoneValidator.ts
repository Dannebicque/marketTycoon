import type { ZoneCell, ZoneDefinition } from './contracts'

export type ZoneValidationIssueCode = 'minimum-area' | 'open-perimeter' | 'missing-door'

export interface ZoneBoundaryEdge { type: 'wall' | 'door' }
export interface ZoneValidationGrid {
  columns: number
  rows: number
  getEdgeBetween(from: { x: number; y: number }, to: { x: number; y: number }): ZoneBoundaryEdge | undefined
}

export interface ZoneValidationIssue {
  code: ZoneValidationIssueCode
  zoneKey: string
  zoneName: string
  component: number
  area: number
  message: string
  cells: Array<{ x: number; y: number }>
}

export interface ZoneComponentValidation {
  zoneKey: string
  zoneName: string
  component: number
  area: number
  enclosed: boolean
  doorCount: number
  valid: boolean
  cells: Array<{ x: number; y: number }>
}

export interface ZoneValidationReport {
  valid: boolean
  issues: ZoneValidationIssue[]
  components: ZoneComponentValidation[]
  invalidCellKeys: string[]
}

const directions = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
]
const key = (x: number, y: number) => `${x}:${y}`

export function validateZones(cells: readonly ZoneCell[], definitions: readonly ZoneDefinition[], grid: ZoneValidationGrid): ZoneValidationReport {
  const byCell = new Map(cells.map(cell => [key(cell.x, cell.y), cell]))
  const definitionsByKey = new Map(definitions.map(definition => [definition.key, definition]))
  const visited = new Set<string>()
  const components: ZoneComponentValidation[] = []
  const issues: ZoneValidationIssue[] = []
  const invalidCellKeys = new Set<string>()

  for (const seed of cells) {
    const seedKey = key(seed.x, seed.y)
    if (visited.has(seedKey)) continue
    const definition = definitionsByKey.get(seed.zoneKey)
    if (!definition) continue

    const componentCells: ZoneCell[] = []
    const queue = [seed]
    visited.add(seedKey)
    while (queue.length) {
      const current = queue.shift()!
      componentCells.push(current)
      for (const direction of directions) {
        const next = byCell.get(key(current.x + direction.x, current.y + direction.y))
        if (!next || next.zoneKey !== seed.zoneKey || visited.has(key(next.x, next.y))) continue
        visited.add(key(next.x, next.y))
        queue.push(next)
      }
    }

    const componentNumber = components.filter(item => item.zoneKey === seed.zoneKey).length + 1
    const enclosed = definition.constraints?.requiresWalls
      ? !canReachExterior(componentCells, byCell, definitionsByKey, grid)
      : true
    const doorCount = countBoundaryDoors(componentCells, grid)
    const area = componentCells.length
    const minimumArea = definition.constraints?.minimumArea ?? 0
    const missingArea = area < minimumArea
    const missingDoor = Boolean(definition.constraints?.requiresDoor && doorCount === 0)
    const openPerimeter = Boolean(definition.constraints?.requiresWalls && !enclosed)
    const valid = !missingArea && !missingDoor && !openPerimeter
    const plainCells = componentCells.map(cell => ({ x: cell.x, y: cell.y }))

    components.push({ zoneKey: seed.zoneKey, zoneName: definition.name, component: componentNumber, area, enclosed, doorCount, valid, cells: plainCells })

    const addIssue = (code: ZoneValidationIssueCode, message: string) => {
      issues.push({ code, zoneKey: seed.zoneKey, zoneName: definition.name, component: componentNumber, area, message, cells: plainCells })
      plainCells.forEach(cell => invalidCellKeys.add(key(cell.x, cell.y)))
    }
    if (missingArea) addIssue('minimum-area', `${definition.name} : surface minimale de ${minimumArea} cases requise (${area} actuellement).`)
    if (openPerimeter) addIssue('open-perimeter', `${definition.name} : cet espace communique encore avec l’extérieur sans mur ou porte.`)
    if (missingDoor) addIssue('missing-door', `${definition.name} : ajoutez au moins une porte sur le contour de cette zone.`)
  }

  return { valid: issues.length === 0, issues, components, invalidCellKeys: [...invalidCellKeys] }
}

function canReachExterior(
  starts: readonly ZoneCell[],
  byCell: ReadonlyMap<string, ZoneCell>,
  definitionsByKey: ReadonlyMap<string, ZoneDefinition>,
  grid: ZoneValidationGrid,
) {
  const queue = starts.map(cell => ({ x: cell.x, y: cell.y }))
  const visited = new Set(queue.map(cell => key(cell.x, cell.y)))

  while (queue.length) {
    const current = queue.shift()!
    for (const direction of directions) {
      const next = { x: current.x + direction.x, y: current.y + direction.y }
      const outsideGrid = next.x < 0 || next.y < 0 || next.x >= grid.columns || next.y >= grid.rows
      const edge = outsideGrid ? undefined : grid.getEdgeBetween(current, next)

      if (edge?.type === 'wall' || edge?.type === 'door') continue
      if (outsideGrid) return true

      const nextZone = byCell.get(key(next.x, next.y))
      const nextDefinition = nextZone ? definitionsByKey.get(nextZone.zoneKey) : undefined
      if (nextDefinition?.constraints?.indoor === false || nextZone?.zoneKey === 'outdoor' || nextZone?.zoneKey === 'parking' || nextZone?.zoneKey === 'delivery') return true

      const nextKey = key(next.x, next.y)
      if (visited.has(nextKey)) continue
      visited.add(nextKey)
      queue.push(next)
    }
  }

  return false
}

function countBoundaryDoors(componentCells: readonly ZoneCell[], grid: ZoneValidationGrid) {
  const componentKeys = new Set(componentCells.map(cell => key(cell.x, cell.y)))
  const doors = new Set<string>()
  for (const cell of componentCells) {
    for (const direction of directions) {
      const next = { x: cell.x + direction.x, y: cell.y + direction.y }
      if (componentKeys.has(key(next.x, next.y))) continue
      if (next.x < 0 || next.y < 0 || next.x >= grid.columns || next.y >= grid.rows) continue
      if (grid.getEdgeBetween(cell, next)?.type === 'door') doors.add(`${cell.x}:${cell.y}:${next.x}:${next.y}`)
    }
  }
  return doors.size
}
