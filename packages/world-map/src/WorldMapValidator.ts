import type { MapRect, WorldMapDefinition } from './contracts'

export interface WorldMapValidationResult {
  valid: boolean
  errors: string[]
}

function isPositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0
}

function isInsideMap(rect: MapRect, map: WorldMapDefinition) {
  return rect.x >= 0
    && rect.y >= 0
    && rect.width > 0
    && rect.height > 0
    && rect.x + rect.width <= map.size.columns
    && rect.y + rect.height <= map.size.rows
}

export function validateWorldMap(map: WorldMapDefinition): WorldMapValidationResult {
  const errors: string[] = []

  if (map.schemaVersion !== 1) errors.push(`Unsupported map schema version: ${map.schemaVersion}`)
  if (!map.id.trim()) errors.push('Map id is required')
  if (!map.name.trim()) errors.push('Map name is required')
  if (!isPositiveInteger(map.size.columns) || !isPositiveInteger(map.size.rows)) errors.push('Map dimensions must be positive integers')
  if (!isPositiveInteger(map.tile.width) || !isPositiveInteger(map.tile.height)) errors.push('Tile dimensions must be positive integers')

  const parcelIds = new Set<string>()
  for (const parcel of map.parcels) {
    if (parcelIds.has(parcel.id)) errors.push(`Duplicate parcel id: ${parcel.id}`)
    parcelIds.add(parcel.id)
    if (!isInsideMap(parcel.bounds, map)) errors.push(`Parcel ${parcel.id} is outside the map`)
    if (parcel.access === 'for-sale' && (!parcel.price || parcel.price <= 0)) errors.push(`Parcel ${parcel.id} must have a positive sale price`)
  }

  const buildingIds = new Set<string>()
  for (const building of map.buildings) {
    if (buildingIds.has(building.id)) errors.push(`Duplicate building id: ${building.id}`)
    buildingIds.add(building.id)
    if (!isInsideMap(building.bounds, map)) errors.push(`Building ${building.id} is outside the map`)
  }

  const spawnIds = new Set<string>()
  for (const spawn of map.spawnPoints) {
    if (spawnIds.has(spawn.id)) errors.push(`Duplicate spawn point id: ${spawn.id}`)
    spawnIds.add(spawn.id)
    if (spawn.x < 0 || spawn.y < 0 || spawn.x >= map.size.columns || spawn.y >= map.size.rows) errors.push(`Spawn point ${spawn.id} is outside the map`)
  }

  if (!parcelIds.has(map.initialStore.parcelId)) errors.push(`Initial store parcel does not exist: ${map.initialStore.parcelId}`)
  if (!buildingIds.has(map.initialStore.buildingId)) errors.push(`Initial store building does not exist: ${map.initialStore.buildingId}`)

  return { valid: errors.length === 0, errors }
}

export function requireValidWorldMap(map: WorldMapDefinition) {
  const result = validateWorldMap(map)
  if (!result.valid) throw new Error(`Invalid world map ${map.id}:\n${result.errors.join('\n')}`)
  return map
}
