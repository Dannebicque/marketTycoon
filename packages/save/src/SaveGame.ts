import type { PurchaseOrder, ReserveStockLine, StoreProductPricing } from '@market-tycoon/economy'
import type { EmployeeState } from '@market-tycoon/employees'
import type { Direction, StoreMetrics } from '@market-tycoon/simulation-engine'

export const SAVE_GAME_VERSION = 1
export const SAVE_GAME_STORAGE_KEY = 'market-tycoon.save.v1'

export interface SavedBuildingState {
  oldId: string
  definitionKey: string
  gridX: number
  gridY: number
  direction: Direction
  compartments?: Array<{ id: string; productKey: string | null; quantity: number; capacity: number; averageUnitCost?: number }>
}

export interface SavedEdgeState {
  definitionKey: 'wall' | 'door'
  gridX: number
  gridY: number
  direction: Direction
}

export interface SaveGameV1 {
  version: 1
  savedAt: string
  day: number
  currentMinutes: number
  metrics: StoreMetrics
  buildings: SavedBuildingState[]
  edges: SavedEdgeState[]
  reserve: ReserveStockLine[]
  purchaseOrders: { nextOrder?: number; orders: PurchaseOrder[] }
  employees: { employees: EmployeeState[]; candidates: EmployeeState[] }
  pricing?: StoreProductPricing[]
}

export function parseSaveGame(raw: string): SaveGameV1 | null {
  try {
    const parsed = JSON.parse(raw) as SaveGameV1
    return parsed.version === SAVE_GAME_VERSION ? parsed : null
  } catch {
    return null
  }
}

export function serializeSaveGame(save: SaveGameV1): string {
  return JSON.stringify(save)
}
