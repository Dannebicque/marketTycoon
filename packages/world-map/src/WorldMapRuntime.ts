import type { MapPoint, MapRect, ParcelDefinition, WorldMapDefinition } from './contracts'

export interface ParcelRuntimeState {
  id: string
  access: ParcelDefinition['access']
  owned: boolean
  unlocked: boolean
}

function contains(rect: MapRect, point: MapPoint) {
  return point.x >= rect.x
    && point.y >= rect.y
    && point.x < rect.x + rect.width
    && point.y < rect.y + rect.height
}

export class WorldMapRuntime {
  private readonly parcelStates = new Map<string, ParcelRuntimeState>()

  constructor(public readonly definition: WorldMapDefinition) {
    for (const parcel of definition.parcels) {
      this.parcelStates.set(parcel.id, {
        id: parcel.id,
        access: parcel.access,
        owned: parcel.access === 'owned',
        unlocked: parcel.access !== 'locked' && parcel.access !== 'reserved',
      })
    }
  }

  getParcel(id: string) {
    return this.definition.parcels.find(parcel => parcel.id === id)
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
    }
  }
}
