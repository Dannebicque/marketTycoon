import type {
  ProductCatalogReader,
  SupplierCatalogReader,
} from '@market-tycoon/catalog'
import { ReserveManager, type StorageBuilding } from './ReserveManager'

export interface PurchaseOrderLine {
  productKey: string
  quantity: number
  unitPrice: number
}

export type PurchaseOrderStatus =
  | 'ordered'
  | 'delivered'
  | 'partially-delivered'
  | 'cancelled'

export interface PurchaseOrder {
  id: string
  supplierKey: string
  orderedDay: number
  expectedDay: number
  status: PurchaseOrderStatus
  lines: PurchaseOrderLine[]
  deliveryFee: number
  orderedTotal: number
  deliveredTotal: number
  rejectedLines: PurchaseOrderLine[]
}

export interface PurchaseOrderState {
  nextOrder?: number
  orders?: PurchaseOrder[]
}

interface DeliveryPlanLine extends PurchaseOrderLine {
  deliveredQuantity: number
  deliveredMerchandiseValue: number
}

export class PurchaseOrderManager {
  private orders: PurchaseOrder[] = []
  private nextOrder = 1

  constructor(
    private readonly products: ProductCatalogReader,
    private readonly suppliers: SupplierCatalogReader,
  ) {}

  createOrder(
    supplierKey: string,
    requestedLines: Array<{ productKey: string; quantity: number }>,
    day: number,
  ) {
    const supplier = this.suppliers.getSupplier(supplierKey)
    if (!supplier) return null

    const lines = requestedLines.flatMap(line => {
      const product = this.products.getProduct(line.productKey)
      if (!product || line.quantity <= 0 || !supplier.productKeys.includes(product.key)) {
        return []
      }
      return [{
        productKey: product.key,
        quantity: Math.floor(line.quantity),
        unitPrice: product.purchasePrice * supplier.priceMultiplier,
      }]
    })

    const merchandiseTotal = lines.reduce(
      (total, line) => total + line.quantity * line.unitPrice,
      0,
    )
    if (!lines.length || merchandiseTotal < supplier.minimumOrderAmount) return null

    const order: PurchaseOrder = {
      id: `PO-${this.nextOrder++}`,
      supplierKey,
      orderedDay: day,
      expectedDay: day + supplier.leadTimeDays,
      status: 'ordered',
      lines,
      deliveryFee: supplier.deliveryFee,
      orderedTotal: merchandiseTotal + supplier.deliveryFee,
      deliveredTotal: 0,
      rejectedLines: [],
    }
    this.orders.push(order)
    return this.cloneOrder(order)
  }

  process(
    day: number,
    buildings: readonly StorageBuilding[],
    reserve: ReserveManager,
  ) {
    for (const order of this.orders) {
      if (order.status !== 'ordered' || order.expectedDay > day) continue

      const plan: DeliveryPlanLine[] = order.lines.map(line => {
        const deliveredQuantity = reserve.previewAccepted(line.productKey, line.quantity, buildings)
        return {
          ...line,
          deliveredQuantity,
          deliveredMerchandiseValue: deliveredQuantity * line.unitPrice,
        }
      })
      const deliveredMerchandiseTotal = plan.reduce((total, line) => total + line.deliveredMerchandiseValue, 0)

      order.deliveredTotal = deliveredMerchandiseTotal > 0 ? order.deliveryFee : 0
      order.rejectedLines = []

      for (const line of plan) {
        const feeShare = deliveredMerchandiseTotal > 0
          ? order.deliveryFee * (line.deliveredMerchandiseValue / deliveredMerchandiseTotal)
          : 0
        const landedUnitCost = line.deliveredQuantity > 0
          ? line.unitPrice + feeShare / line.deliveredQuantity
          : line.unitPrice
        const delivered = reserve.add(
          line.productKey,
          line.deliveredQuantity,
          buildings,
          landedUnitCost,
        )
        order.deliveredTotal += delivered * line.unitPrice
        if (delivered < line.quantity) {
          order.rejectedLines.push({
            productKey: line.productKey,
            quantity: line.quantity - delivered,
            unitPrice: line.unitPrice,
          })
        }
      }

      order.status = order.rejectedLines.length
        ? 'partially-delivered'
        : 'delivered'
    }
  }

  cancel(orderId: string) {
    const order = this.orders.find(item => item.id === orderId)
    if (!order || order.status !== 'ordered') return false
    order.status = 'cancelled'
    return true
  }

  getOrders() {
    return this.orders.map(order => this.cloneOrder(order))
  }

  exportState(): PurchaseOrderState {
    return { nextOrder: this.nextOrder, orders: this.getOrders() }
  }

  importState(state: PurchaseOrderState) {
    this.nextOrder = Math.max(1, state.nextOrder ?? 1)
    this.orders = (state.orders ?? []).map(order => this.cloneOrder(order))
  }

  private cloneOrder(order: PurchaseOrder): PurchaseOrder {
    return {
      ...order,
      lines: order.lines.map(line => ({ ...line })),
      rejectedLines: order.rejectedLines.map(line => ({ ...line })),
    }
  }
}
