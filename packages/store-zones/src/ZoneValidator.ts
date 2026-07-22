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
  const visited = new Set<string>()
  const components: ZoneComponentValidation[] = []
  const issues: ZoneValidationIssue[] = []
  const invalidCellKeys = new Set<string>()

  for (const seed of cells) {
    const seedKey = key(seed.x, seed.y)
    if (visited.has(seedKey)) continue
    const definition = definitions.find(item => item.key === seed.zoneKey)
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
    let enclosed = true
    let doorCount = 0
    for (const cell of componentCells) {
      for (const direction of directions) {
        const next = { x: cell.x + direction.x, y: cell.y + direction.y }
        const sameZone = byCell.get(key(next.x, next.y))?.zoneKey === seed.zoneKey
        if (sameZone) continue

        const outsideGrid = next.x < 0 || next.y < 0 || next.x >= grid.columns || next.y >= grid.rows
        // The edge of the buildable map is the parcel boundary. It closes an indoor
        // space but does not count as a door. This also allows stores built against
        // the edge of the terrain to be validated correctly.
        if (outsideGrid) continue

        const edge = grid.getEdgeBetween(cell, next)
        if (edge?.type === 'door') doorCount += 1
        if (definition.constraints?.requiresWalls && !edge) enclosed = false
      }
    }

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
    if (openPerimeter) addIssue('open-perimeter', `${definition.name} : l’espace doit être entièrement fermé par des murs ou des portes.`)
    if (missingDoor) addIssue('missing-door', `${definition.name} : ajoutez au moins une porte pour rendre l’espace accessible.`)
  }

  return { valid: issues.length === 0, issues, components, invalidCellKeys: [...invalidCellKeys] }
}
