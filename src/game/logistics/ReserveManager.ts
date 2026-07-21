import { getProductDefinition } from '../catalog/products'
import { getProductStorageType, isStorageDefinition, type StorageType } from '../definitions'
import type { PlacedBuilding } from '../GridManager'

export interface ReserveStockLine { productKey: string; quantity: number }

export class ReserveManager {
  private stock = new Map<string, number>()

  getCapacity(buildings: PlacedBuilding[], type: StorageType): number {
    return buildings.reduce((total, building) => {
      if (!isStorageDefinition(building.definition)) return total
      return building.definition.storageType === type ? total + building.definition.capacity : total
    }, 0)
  }

  getUsed(type: StorageType): number {
    let used = 0
    for (const [productKey, quantity] of this.stock) {
      const product = getProductDefinition(productKey)
      if (product && getProductStorageType(product) === type) used += quantity
    }
    return used
  }

  getFree(buildings: PlacedBuilding[], type: StorageType): number { return Math.max(0, this.getCapacity(buildings, type) - this.getUsed(type)) }
  getQuantity(productKey: string): number { return this.stock.get(productKey) ?? 0 }
  getLines(): ReserveStockLine[] { return [...this.stock.entries()].filter(([, quantity]) => quantity > 0).map(([productKey, quantity]) => ({ productKey, quantity })) }

  add(productKey: string, quantity: number, buildings: PlacedBuilding[]): number {
    const product = getProductDefinition(productKey)
    if (!product || quantity <= 0) return 0
    const accepted = Math.min(Math.floor(quantity), this.getFree(buildings, getProductStorageType(product)))
    if (accepted > 0) this.stock.set(productKey, this.getQuantity(productKey) + accepted)
    return accepted
  }

  withdraw(productKey: string, quantity: number): number {
    const accepted = Math.min(Math.floor(Math.max(0, quantity)), this.getQuantity(productKey))
    this.stock.set(productKey, this.getQuantity(productKey) - accepted)
    return accepted
  }

  exportState() { return this.getLines() }
  importState(lines: ReserveStockLine[]) {
    this.stock.clear()
    for (const line of lines) if (line.quantity > 0 && getProductDefinition(line.productKey)) this.stock.set(line.productKey, Math.floor(line.quantity))
  }
}
