export interface MapSize {
  columns: number
  rows: number
}

export interface MapPoint {
  x: number
  y: number
}

export interface MapRect extends MapPoint {
  width: number
  height: number
}

export type ParcelAccess = 'owned' | 'for-sale' | 'locked' | 'public' | 'reserved' | 'unavailable'
export type ParcelUsage = 'store' | 'parking' | 'service' | 'commercial' | 'landscape' | 'infrastructure'

export interface ParcelDefinition {
  id: string
  name: string
  bounds: MapRect
  access: ParcelAccess
  usage: ParcelUsage
  price?: number
  unlockCondition?: string
  buildable: boolean
}

export type WorldBuildingOwner = 'player' | 'city' | 'competitor' | 'neutral'

export interface WorldBuildingDefinition {
  id: string
  name: string
  kind: string
  bounds: MapRect
  owner: WorldBuildingOwner
  dynamic: boolean
  facadeStyle?: string
  entrances?: MapPoint[]
  metadata?: Record<string, string | number | boolean>
}

export interface RoadDefinition {
  id: string
  points: MapPoint[]
  width: number
  kind: 'road' | 'service-road' | 'pedestrian'
}

export interface SpawnPointDefinition extends MapPoint {
  id: string
  kind: 'customer' | 'employee' | 'delivery' | 'vehicle'
  direction?: 0 | 1 | 2 | 3
}

export interface InitialEquipmentDefinition extends MapPoint {
  id: string
  definitionKey: string
  direction: 0 | 1 | 2 | 3
}

export interface InitialEdgeDefinition extends MapPoint {
  id: string
  definitionKey: 'wall' | 'door'
  direction: 0 | 1 | 2 | 3
}

export interface StoreSeedDefinition {
  parcelId: string
  buildingId: string
  equipment: InitialEquipmentDefinition[]
  edges: InitialEdgeDefinition[]
}

export interface WorldMapDefinition {
  schemaVersion: 1
  id: string
  name: string
  description: string
  size: MapSize
  tile: {
    width: number
    height: number
  }
  theme: string
  parcels: ParcelDefinition[]
  buildings: WorldBuildingDefinition[]
  roads: RoadDefinition[]
  spawnPoints: SpawnPointDefinition[]
  initialStore: StoreSeedDefinition
}
