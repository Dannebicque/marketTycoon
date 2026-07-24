import type { MapPoint, MapRect, ParcelDefinition, WorldBuildingDefinition, WorldMapDefinition } from './contracts'

export interface ParcelRuntimeState {
  id: string
  access: ParcelDefinition['access']
  owned: boolean
  unlocked: boolean
}

export interface BuildingRuntimeState {
  id: string
  interiorAreas: MapRect[]
  facadeStyle?: string
}

const EXTENSION_COST_PER_TILE = 350

function contains(rect: MapRect, point: MapPoint) {
  return point.x >= rect.x
    && point.y >= rect.y
    && point.x < rect.x + rect.width
    && point.y < rect.y + rect.height
}

function sameRect(a: MapRect, b: MapRect) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
}

export class WorldMapRuntime {
  private readonly parcelStates = new Map<string, ParcelRuntimeState>()
  private readonly buildingStates = new Map<string, BuildingRuntimeState>()

  constructor(public readonly definition: WorldMapDefinition) {
    for (const parcel of definition.parcels) {
      this.parcelStates.set(parcel.id, {
        id: parcel.id,
        access: parcel.access,
        owned: parcel.access === 'owned',
        unlocked: parcel.access !== 'locked' && parcel.access !== 'reserved',
      })
    }

    for (const building of definition.buildings) {
      this.buildingStates.set(building.id, {
        id: building.id,
        interiorAreas: [{ ...building.bounds }],
        facadeStyle: building.facadeStyle,
      })
    }
  }

  getParcel(id: string) {
    return this.definition.parcels.find(parcel => parcel.id === id)
  }

  getParcels() {
    return this.definition.parcels.map(parcel => ({
      ...parcel,
      access: this.parcelStates.get(parcel.id)?.access ?? parcel.access,
    }))
  }

  getParcelState(id: string) {
    return this.parcelStates.get(id)
  }

  getParcelAt(point: MapPoint) {
    return this.definition.parcels.find(parcel => contains(parcel.bounds, point))
  }

  getOwnedParcels() {
    return this.definition.parcels.filter(parcel => this.parcelStates.get(parcel.id)?.owned)
  }

  getPurchasableParcels() {
    return this.definition.parcels.filter(parcel => {
      const state = this.parcelStates.get(parcel.id)
      return parcel.access === 'for-sale' && state?.unlocked && !state.owned
    })
  }

  getBuilding(id: string) {
    return this.definition.buildings.find(building => building.id === id)
  }

  getBuildingState(id: string) {
    return this.buildingStates.get(id)
  }

  getPlayerBuilding(): WorldBuildingDefinition | undefined {
    return this.getBuilding(this.definition.initialStore.buildingId)
  }

  getPlayerBuildingState() {
    return this.getBuildingState(this.definition.initialStore.buildingId)
  }

  isStoreInterior(point: MapPoint) {
    return this.getPlayerBuildingState()?.interiorAreas.some(area => contains(area, point)) ?? false
  }

  isBuildable(point: MapPoint) {
    const parcel = this.getParcelAt(point)
    if (!parcel?.buildable) return false
    return this.parcelStates.get(parcel.id)?.owned === true
  }

  canPurchase(parcelId: string) {
    const parcel = this.getParcel(parcelId)
    const state = this.parcelStates.get(parcelId)
    return Boolean(parcel && state && parcel.access === 'for-sale' && state.unlocked && !state.owned)
  }

  purchase(parcelId: string) {
    if (!this.canPurchase(parcelId)) return false
    const state = this.parcelStates.get(parcelId)
    if (!state) return false
    state.owned = true
    state.access = 'owned'
    return true
  }

  getExtensionCost(parcelId: string) {
    const parcel = this.getParcel(parcelId)
    return parcel ? parcel.bounds.width * parcel.bounds.height * EXTENSION_COST_PER_TILE : 0
  }

  canExpandPlayerBuildingInto(parcelId: string) {
    const parcel = this.getParcel(parcelId)
    const parcelState = this.parcelStates.get(parcelId)
    const buildingState = this.getPlayerBuildingState()
    if (!parcel || !parcelState?.owned || !parcel.buildable || !buildingState) return false
    if (!['store', 'commercial', 'service'].includes(parcel.usage)) return false
    return !buildingState.interiorAreas.some(area => sameRect(area, parcel.bounds))
  }

  expandPlayerBuildingInto(parcelId: string) {
    if (!this.canExpandPlayerBuildingInto(parcelId)) return false
    const parcel = this.getParcel(parcelId)
    const buildingState = this.getPlayerBuildingState()
    if (!parcel || !buildingState) return false
    buildingState.interiorAreas.push({ ...parcel.bounds })
    return true
  }

  unlock(parcelId: string) {
    const state = this.parcelStates.get(parcelId)
    if (!state) return false
    state.unlocked = true
    if (state.access === 'locked' || state.access === 'reserved') state.access = 'for-sale'
    return true
  }

  snapshot() {
    return {
      mapId: this.definition.id,
      parcels: [...this.parcelStates.values()].map(state => ({ ...state })),
      buildings: [...this.buildingStates.values()].map(state => ({
        ...state,
        interiorAreas: state.interiorAreas.map(area => ({ ...area })),
      })),
    }
  }
}
