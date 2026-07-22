import { GameEventBus } from './GameEventBus'

export type PaymentMethod = 'contactless' | 'card' | 'cash'
export type StorageType = 'ambient' | 'cold' | 'frozen'
export type PurchaseDecision = 'accept' | 'reduce' | 'reject'
export type CustomerAbandonReason = 'empty-basket' | 'queue-too-long' | 'checkout-unavailable' | 'store-closed' | 'other'

export interface CustomerEnteredStoreEvent { day: number; customerId: string; profileKey: string; budget: number; occurredAt: number }
export interface CustomerPickedProductEvent { day: number; customerId: string; productKey: string; quantity: number; unitSalePrice: number; shelfId?: string }
export interface CustomerAbandonedVisitEvent { day: number; customerId: string; reason: CustomerAbandonReason; articleCount: number; potentialSaleTotal: number; queueTimeMs: number; satisfaction: number; visitDurationMs: number }
export interface CustomerVisitCompletedEvent { day: number; customerId: string; articleCount: number; saleTotal: number; paymentMethod: PaymentMethod; queueTimeMs: number; satisfaction: number; visitDurationMs: number }
export interface ProductSoldEvent { day: number; productKey: string; quantity: number; unitSalePrice: number; unitCost: number; checkoutId: string }
export interface ProductRejectedForPriceEvent { day: number; productKey: string; requestedQuantity: number; salePrice: number; marketPrice: number; customerProfileKey?: string }
export interface ProductPurchaseDecisionEvent { day: number; customerId: string; productKey: string; requestedQuantity: number; acceptedQuantity: number; decision: PurchaseDecision; salePrice: number; marketPrice: number; priceRatio: number; satisfactionDelta: number }
export interface StockReceivedEvent { day: number; orderId: string; supplierKey: string; productKey: string; quantity: number; unitCost: number; allocatedDeliveryCost: number; storageType: StorageType }
export interface StockOutEvent { day: number; productKey: string; shelfId?: string }
export interface EmployeeHiredEvent { day: number; employeeId: string; roleKey: string; dailySalary: number }
export interface EmployeeAssignedEvent { day: number; employeeId: string; roleKey: string; targetBuildingId?: string }
export interface EmployeeTaskCompletedEvent { day: number; employeeId: string; roleKey: string; taskType: string; targetBuildingId?: string; durationMs?: number }
export interface BuildingPlacedEvent { day: number; buildingId: string; definitionKey: string; category: string; price: number; gridX: number; gridY: number }
export interface BuildingRemovedEvent { day: number; buildingId: string; definitionKey: string; category: string; gridX: number; gridY: number }
export interface CheckoutBreakdownEvent { day: number; checkoutId: string; repairedByEmployeeId?: string; durationMs: number }
export interface CheckoutCompletedEvent { day: number; checkoutId: string; customerId: string; articleCount: number; total: number; paymentMethod: PaymentMethod; satisfaction: number }
export interface StoreDayStartedEvent { day: number; cash: number }
export interface StoreDayClosedEvent { day: number; revenue: number; profit: number; servedCustomers: number; lostCustomers: number; averageSatisfaction: number }

export interface MarketTycoonEvents {
  'customer:entered-store': CustomerEnteredStoreEvent
  'customer:picked-product': CustomerPickedProductEvent
  'customer:abandoned-visit': CustomerAbandonedVisitEvent
  'customer:visit-completed': CustomerVisitCompletedEvent
  'product:sold': ProductSoldEvent
  'product:rejected-for-price': ProductRejectedForPriceEvent
  'product:purchase-decision': ProductPurchaseDecisionEvent
  'stock:received': StockReceivedEvent
  'stock:out': StockOutEvent
  'employee:hired': EmployeeHiredEvent
  'employee:assigned': EmployeeAssignedEvent
  'employee:task-completed': EmployeeTaskCompletedEvent
  'building:placed': BuildingPlacedEvent
  'building:removed': BuildingRemovedEvent
  'checkout:breakdown': CheckoutBreakdownEvent
  'checkout:completed': CheckoutCompletedEvent
  'store:day-started': StoreDayStartedEvent
  'store:day-closed': StoreDayClosedEvent
}

export const gameEvents = new GameEventBus<MarketTycoonEvents>()
