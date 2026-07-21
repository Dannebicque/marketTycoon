import type {
  ProductCatalogReader,
  SupplierCatalogReader,
} from '@market-tycoon/catalog'
import { PRODUCTS, getProductDefinition } from './products'
import { SUPPLIERS, getSupplier } from './suppliers'

export const productCatalogReader: ProductCatalogReader = {
  getProduct: getProductDefinition,
  getProducts: () => PRODUCTS,
}

export const supplierCatalogReader: SupplierCatalogReader = {
  getSupplier,
  getSuppliers: () => SUPPLIERS,
}
