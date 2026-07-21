import type { ProductCatalogReader, ProductDefinition, StorageType } from '@market-tycoon/catalog'

export interface ReserveStockLine {
  productKey: string
  quantity: number
}

export interface StorageBuilding {
  definition: {
    category: string
    storageType?: StorageType
    capacity?: number
  }
}

export function getProductStorageType(product: ProductDefinition): StorageType {
  if (product.requiresFreezing) return 'frozen'
  if (product.requiresRefrigeration) return 'cold'
  return 'ambient'
}

export class ReserveManager {
  private readonly stock = new Map<string, number>()

  constructor(private readonly products: ProductCatalogReader) {}

  getCapacity(buildings: readonly StorageBuilding[], type: StorageType): number {
    return buildings.reduce((total, building) => {
      const definition = building.definition
      if (definition.category !== 'storage' || definition.storageType !== type) return total
      return total + Math.max(0, definition.capacity ?? 0)
    }, 0)
  }

  getUsed(type: StorageType): number {
    let used = 0
    for (const [productKey, quantity] of this.stock) {
      const product = this.products.getProduct(productKey)
      if (product && getProductStorageType(product) === type) used += quantity
    }
    return used
  }

  getFree(buildings: readonly StorageBuilding[], type: StorageType): number {
    return Math.max(0, this.getCapacity(buildings, type) - this.getUsed(type))
  }

  getQuantity(productKey: string): number {
    return this.stock.get(productKey) ?? 0
  }

  getLines(): ReserveStockLine[] {
    return [...this.stock.entries()]
      .filter(([, quantity]) => quantity > 0)
      .map(([productKey, quantity]) => ({ productKey, quantity }))
  }

  add(productKey: string, quantity: number, buildings: readonly StorageBuilding[]): number {
    const product = this.products.getProduct(productKey)
    if (!product || quantity <= 0) return 0

    const accepted = Math.min(
      Math.floor(quantity),
      this.getFree(buildings, getProductStorageType(product)),
    )

    if (accepted > 0) {
      this.stock.set(productKey, this.getQuantity(productKey) + accepted)
    }
    return accepted
  }

  withdraw(productKey: string, quantity: number): number {
    const accepted = Math.min(
      Math.floor(Math.max(0, quantity)),
      this.getQuantity(productKey),
    )
    this.stock.set(productKey, this.getQuantity(productKey) - accepted)
    return accepted
  }

  exportState(): ReserveStockLine[] {
    return this.getLines()
  }

  importState(lines: readonly ReserveStockLine[]) {
    this.stock.clear()
    for (const line of lines) {
      if (line.quantity > 0 && this.products.getProduct(line.productKey)) {
        this.stock.set(line.productKey, Math.floor(line.quantity))
      }
    }
  }
}
