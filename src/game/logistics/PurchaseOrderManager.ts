import { PurchaseOrderManager as CorePurchaseOrderManager } from '@market-tycoon/economy'
import {
  productCatalogReader,
  supplierCatalogReader,
} from '../catalog/readers'

/**
 * Adaptateur temporaire conservant le constructeur historique sans argument.
 * Les nouveaux consommateurs doivent importer PurchaseOrderManager depuis
 * @market-tycoon/economy et injecter explicitement leurs catalogues.
 */
export class PurchaseOrderManager extends CorePurchaseOrderManager {
  constructor() {
    super(productCatalogReader, supplierCatalogReader)
  }
}

export type {
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderState,
  PurchaseOrderStatus,
} from '@market-tycoon/economy'
