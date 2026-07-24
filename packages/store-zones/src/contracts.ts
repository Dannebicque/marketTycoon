export interface ZoneCostDefinition {
  electricityPerCell: number
  cleaningPerCell: number
  maintenancePerCell: number
  heatingPerCell?: number
  securityPerCell?: number
}

export interface ZoneConstraints {
  indoor?: boolean
  requiresWalls?: boolean
  requiresDoor?: boolean
  minimumArea?: number
}

export interface ZoneDefinition {
  key: string
  name: string
  description: string
  icon: string
  color: number
  order: number
  costs: ZoneCostDefinition
  constraints?: ZoneConstraints
  allowedBuildingCategories?: string[]
  requiredUnlockKey?: string
  unlockVisibility?: 'locked-visible' | 'hidden'
}

export interface ZoneCell { x: number; y: number; zoneKey: string }
export interface ZoneSummary {
  key: string
  name: string
  icon: string
  color: number
  area: number
  costs: ZoneCostDefinition & { total: number }
}

export function defineZone<T extends ZoneDefinition>(definition: T): T { return definition }
