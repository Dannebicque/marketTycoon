import type { ProductCatalogReader, ProductDefinition, StorageType } from '@market-tycoon/catalog'

export interface ReserveStockLine {
  productKey: string
  quantity: number
  averageUnitCost?: number
  stockValue?: number
}

export interface StockWithdrawal {
  productKey: string
  quantity: number
  averageUnitCost: number
  totalCost: number
}

export interface StorageBuilding {
  definition: {
    category: string
    storageType?: StorageType
    capacity?: number
  }
}

interface ValuedStock {
  quantity: number
  averageUnitCost: number
}

export function getProductStorageType(product: ProductDefinition): StorageType {
  if (product.requiresFreezing) return 'frozen'
  if (product.requiresRefrigeration) return 'cold'
  return 'ambient'
}

export class ReserveManager {
  private readonly stock = new Map<string, ValuedStock>()

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
    for (const [productKey, stock] of this.stock) {
      const product = this.products.getProduct(productKey)
      if (product && getProductStorageType(product) === type) used += stock.quantity
    }
    return used
  }

  getFree(buildings: readonly StorageBuilding[], type: StorageType): number {
    return Math.max(0, this.getCapacity(buildings, type) - this.getUsed(type))
  }

  getQuantity(productKey: string): number {
    return this.stock.get(productKey)?.quantity ?? 0
  }

  getAverageUnitCost(productKey: string): number {
    const product = this.products.getProduct(productKey)
    return this.stock.get(productKey)?.averageUnitCost ?? product?.purchasePrice ?? 0
  }

  getStockValue(productKey?: string): number {
    if (productKey) {
      const stock = this.stock.get(productKey)
      return stock ? stock.quantity * stock.averageUnitCost : 0
    }
    return [...this.stock.values()].reduce((total, stock) => total + stock.quantity * stock.averageUnitCost, 0)
  }

  getLines(): ReserveStockLine[] {
    return [...this.stock.entries()]
      .filter(([, stock]) => stock.quantity > 0)
      .map(([productKey, stock]) => ({
        productKey,
        quantity: stock.quantity,
        averageUnitCost: stock.averageUnitCost,
        stockValue: stock.quantity * stock.averageUnitCost,
      }))
  }

  previewAccepted(productKey: string, quantity: number, buildings: readonly StorageBuilding[]): number {
    const product = this.products.getProduct(productKey)
    if (!product || quantity <= 0) return 0
    return Math.min(
      Math.floor(quantity),
      this.getFree(buildings, getProductStorageType(product)),
    )
  }

  add(productKey: string, quantity: number, buildings: readonly StorageBuilding[], unitCost?: number): number {
    const product = this.products.getProduct(productKey)
    if (!product || quantity <= 0) return 0

    const accepted = this.previewAccepted(productKey, quantity, buildings)
    if (accepted <= 0) return 0

    const current = this.stock.get(productKey) ?? { quantity: 0, averageUnitCost: product.purchasePrice }
    const acceptedUnitCost = Math.max(0, unitCost ?? product.purchasePrice)
    const totalQuantity = current.quantity + accepted
    const totalValue = current.quantity * current.averageUnitCost + accepted * acceptedUnitCost

    this.stock.set(productKey, {
      quantity: totalQuantity,
      averageUnitCost: totalQuantity > 0 ? totalValue / totalQuantity : acceptedUnitCost,
    })
    return accepted
  }

  withdrawValued(productKey: string, quantity: number): StockWithdrawal {
    const current = this.stock.get(productKey)
    const accepted = Math.min(
      Math.floor(Math.max(0, quantity)),
      current?.quantity ?? 0,
    )
    const averageUnitCost = current?.averageUnitCost ?? this.products.getProduct(productKey)?.purchasePrice ?? 0
    if (current) {
      current.quantity -= accepted
      if (current.quantity <= 0) this.stock.delete(productKey)
      else this.stock.set(productKey, current)
    }
    return { productKey, quantity: accepted, averageUnitCost, totalCost: accepted * averageUnitCost }
  }

  withdraw(productKey: string, quantity: number): number {
    return this.withdrawValued(productKey, quantity).quantity
  }

  exportState(): ReserveStockLine[] {
    return this.getLines()
  }

  importState(lines: readonly ReserveStockLine[]) {
    this.stock.clear()
    for (const line of lines) {
      const product = this.products.getProduct(line.productKey)
      if (line.quantity > 0 && product) {
        this.stock.set(line.productKey, {
          quantity: Math.floor(line.quantity),
          averageUnitCost: Math.max(0, line.averageUnitCost ?? product.purchasePrice),
        })
      }
    }
  }
}
