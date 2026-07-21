import type { EmployeeState } from '../employees/employeeTypes'
import type { Direction } from '../GridManager'
import type { PurchaseOrder } from '../logistics/PurchaseOrderManager'
import type { ReserveStockLine } from '../logistics/ReserveManager'
import type { StoreProductPricing } from '../pricing/StorePricingManager'
import type { StoreMetrics } from '../StoreSimulation'

export const SAVE_GAME_VERSION = 1
export const SAVE_GAME_STORAGE_KEY = 'market-tycoon.save.v1'

export interface SavedBuildingState {
  oldId: string
  definitionKey: string
  gridX: number
  gridY: number
  direction: Direction
  compartments?: Array<{ id: string; productKey: string | null; quantity: number; capacity: number }>
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

export function storeSaveGame(save: SaveGameV1) {
  localStorage.setItem(SAVE_GAME_STORAGE_KEY, JSON.stringify(save))
}

export function readSaveGame(): SaveGameV1 | null {
  const raw = localStorage.getItem(SAVE_GAME_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SaveGameV1
    return parsed.version === SAVE_GAME_VERSION ? parsed : null
  } catch {
    return null
  }
}

export function deleteSaveGame() { localStorage.removeItem(SAVE_GAME_STORAGE_KEY) }
export function hasSaveGame() { return Boolean(localStorage.getItem(SAVE_GAME_STORAGE_KEY)) }
