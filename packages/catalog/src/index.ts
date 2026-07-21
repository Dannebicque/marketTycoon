export { CatalogRegistry } from './CatalogRegistry'
export {
  defineBuilding,
  defineEmployeeRole,
  defineProduct,
  getProductStorageType,
  isCheckoutDefinition,
  isEdgeDefinition,
  isShelfDefinition,
  isStorageDefinition,
} from './contracts'
export type {
  BaseBuildingDefinition,
  BuildingCategory,
  BuildingDefinition,
  BuildingKey,
  BuildingToolbarDefinition,
  CheckoutDefinition,
  CompartmentType,
  DoorDefinition,
  EmployeeRoleDefinition,
  EmployeeRoleKey,
  EquipmentLayoutDefinition,
  PaymentMethod,
  ProductCatalogReader,
  ProductCategory,
  ProductDefinition,
  ShelfDefinition,
  StorageDefinition,
  StorageType,
  SupplierCatalogReader,
  SupplierDefinition,
  WallDefinition,
} from './contracts'
export {
  BUILDINGS,
  BUILDING_CATALOG,
  BUILDING_REGISTRY,
  CHECKOUT_BUILDINGS,
  SHELF_BUILDINGS,
  STORAGE_BUILDINGS,
  getBuildingDefinition,
  requireBuildingDefinition,
} from './catalog/buildings'
export {
  PRODUCTS,
  PRODUCT_CATALOG,
  getProductDefinition,
  getProductsForCategories,
  requireProductDefinition,
} from './catalog/products'
export { SUPPLIERS, getSupplier } from './catalog/suppliers'
export { EMPLOYEE_ROLES, getEmployeeRole } from './catalog/employees'
export { productCatalogReader, supplierCatalogReader } from './catalog/readers'
