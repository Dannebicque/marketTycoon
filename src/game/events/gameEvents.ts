import type { PaymentMethod, StorageType } from '../definitions'
import type { PurchaseDecision } from '../commerce/MarketDemandManager'
import { GameEventBus } from './GameEventBus'

export interface ProductSoldEvent { day: number; productKey: string; quantity: number; unitSalePrice: number; unitCost: number; checkoutId: string }
export interface ProductRejectedForPriceEvent { day: number; productKey: string; requestedQuantity: number; salePrice: number; marketPrice: number; customerProfileKey?: string }
export interface ProductPurchaseDecisionEvent {
  day: number
  customerId: string
  productKey: string
  requestedQuantity: number
  acceptedQuantity: number
  decision: PurchaseDecision
  salePrice: number
  marketPrice: number
  priceRatio: number
  satisfactionDelta: number
}
export interface StockReceivedEvent { day: number; orderId: string; supplierKey: string; productKey: string; quantity: number; unitCost: number; allocatedDeliveryCost: number; storageType: StorageType }
export interface StockOutEvent { day: number; productKey: string; shelfId?: string }
export interface EmployeeTaskCompletedEvent { day: number; employeeId: string; roleKey: string; taskType: string; targetBuildingId?: string; durationMs?: number }
export interface CheckoutBreakdownEvent { day: number; checkoutId: string; repairedByEmployeeId?: string; durationMs: number }
export interface CheckoutCompletedEvent { day: number; checkoutId: string; customerId: string; articleCount: number; total: number; paymentMethod: PaymentMethod; satisfaction: number }
export interface StoreDayClosedEvent { day: number; revenue: number; profit: number; servedCustomers: number; lostCustomers: number; averageSatisfaction: number }

export interface MarketTycoonEvents {
  'product:sold': ProductSoldEvent
  'product:rejected-for-price': ProductRejectedForPriceEvent
  'product:purchase-decision': ProductPurchaseDecisionEvent
  'stock:received': StockReceivedEvent
  'stock:out': StockOutEvent
  'employee:task-completed': EmployeeTaskCompletedEvent
  'checkout:breakdown': CheckoutBreakdownEvent
  'checkout:completed': CheckoutCompletedEvent
  'store:day-closed': StoreDayClosedEvent
}

export const gameEvents = new GameEventBus<MarketTycoonEvents>()
