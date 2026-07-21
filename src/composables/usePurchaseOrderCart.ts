import { computed, ref, watch, type Ref } from 'vue'
import type { ProductDefinition, StorageType } from '../game/definitions'

export interface PurchaseCartLine {
  productKey: string
  quantity: number
}

interface SupplierLike {
  key: string
  name: string
  productKeys: string[]
  minimumOrderAmount: number
  deliveryFee: number
  leadTimeDays: number
  priceMultiplier: number
}

interface StorageCapacityLike {
  type: StorageType
  capacity: number
  used: number
}

interface UsePurchaseOrderCartOptions {
  suppliers: Ref<SupplierLike[]>
  products: Ref<ProductDefinition[]>
  storageCapacities: Ref<StorageCapacityLike[]>
  cash: Ref<number>
}

function productStorageType(product: ProductDefinition): StorageType {
  if (product.requiresFreezing) return 'frozen'
  if (product.requiresRefrigeration) return 'cold'
  return 'ambient'
}

export function usePurchaseOrderCart(options: UsePurchaseOrderCartOptions) {
  const supplierKey = ref('metro-market')
  const selectedProductKey = ref('')
  const selectedQuantity = ref(1)
  const lines = ref<PurchaseCartLine[]>([])

  const supplier = computed(() => options.suppliers.value.find(item => item.key === supplierKey.value))
  const availableProducts = computed(() => options.products.value.filter(product => supplier.value?.productKeys.includes(product.key)))

  watch(supplierKey, () => {
    lines.value = []
    selectedProductKey.value = availableProducts.value[0]?.key ?? ''
    selectedQuantity.value = 1
  })

  watch(availableProducts, products => {
    if (!products.some(product => product.key === selectedProductKey.value)) selectedProductKey.value = products[0]?.key ?? ''
  }, { immediate: true })

  const detailedLines = computed(() => lines.value.flatMap(line => {
    const product = options.products.value.find(item => item.key === line.productKey)
    if (!product || !supplier.value) return []
    const unitPrice = product.purchasePrice * supplier.value.priceMultiplier
    return [{ ...line, product, unitPrice, lineTotal: unitPrice * line.quantity, storageType: productStorageType(product) }]
  }))

  const merchandiseTotal = computed(() => detailedLines.value.reduce((total, line) => total + line.lineTotal, 0))
  const orderTotal = computed(() => merchandiseTotal.value + (lines.value.length ? supplier.value?.deliveryFee ?? 0 : 0))

  const requiredByStorage = computed(() => {
    const result: Record<StorageType, number> = { ambient: 0, cold: 0, frozen: 0 }
    detailedLines.value.forEach(line => { result[line.storageType] += line.quantity })
    return result
  })

  const validationErrors = computed(() => {
    const errors: string[] = []
    if (!supplier.value) errors.push('Sélectionnez un fournisseur valide.')
    if (!lines.value.length) errors.push('Ajoutez au moins un produit au bon de commande.')
    if (supplier.value && merchandiseTotal.value < supplier.value.minimumOrderAmount) {
      errors.push(`Minimum fournisseur non atteint : il manque ${(supplier.value.minimumOrderAmount - merchandiseTotal.value).toFixed(2)} € de marchandises.`)
    }
    if (orderTotal.value > options.cash.value) errors.push(`Budget insuffisant : il manque ${(orderTotal.value - options.cash.value).toFixed(2)} €.`)

    for (const type of ['ambient', 'cold', 'frozen'] as StorageType[]) {
      const required = requiredByStorage.value[type]
      if (!required) continue
      const storage = options.storageCapacities.value.find(item => item.type === type)
      const free = storage ? Math.max(0, storage.capacity - storage.used) : 0
      if (!storage || storage.capacity === 0) errors.push(`Aucune réserve ${type === 'ambient' ? 'ambiante' : type === 'cold' ? 'froide' : 'surgelée'} n’est construite.`)
      else if (required > free) errors.push(`Capacité ${type === 'ambient' ? 'ambiante' : type === 'cold' ? 'froide' : 'surgelée'} insuffisante : ${required} unité(s) prévues pour ${free} place(s) libres.`)
    }
    return errors
  })

  function addLine() {
    const quantity = Math.max(1, Math.floor(Number(selectedQuantity.value) || 1))
    const product = availableProducts.value.find(item => item.key === selectedProductKey.value)
    if (!product) return false
    const existing = lines.value.find(line => line.productKey === product.key)
    if (existing) existing.quantity += quantity
    else lines.value.push({ productKey: product.key, quantity })
    selectedQuantity.value = 1
    return true
  }

  function updateQuantity(productKey: string, quantity: number) {
    const line = lines.value.find(item => item.productKey === productKey)
    if (!line) return
    const normalized = Math.floor(Number(quantity) || 0)
    if (normalized <= 0) removeLine(productKey)
    else line.quantity = normalized
  }

  function removeLine(productKey: string) {
    lines.value = lines.value.filter(line => line.productKey !== productKey)
  }

  function clear() { lines.value = [] }

  return {
    supplierKey, selectedProductKey, selectedQuantity, lines,
    supplier, availableProducts, detailedLines,
    merchandiseTotal, orderTotal, requiredByStorage, validationErrors,
    addLine, updateQuantity, removeLine, clear,
  }
}
