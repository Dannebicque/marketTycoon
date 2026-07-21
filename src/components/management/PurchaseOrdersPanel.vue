<template>
  <div class="management-content orders-layout">
    <section class="order-form-card">
      <h2>Nouveau bon de commande</h2>
      <label class="field-label">Fournisseur</label>
      <select v-model="cart.supplierKey.value">
        <option v-for="supplier in suppliers" :key="supplier.key" :value="supplier.key">{{ supplier.name }}</option>
      </select>

      <div v-if="cart.supplier.value" class="supplier-info">
        <span>Livraison J+{{ cart.supplier.value.leadTimeDays }}</span>
        <span>Minimum {{ money(cart.supplier.value.minimumOrderAmount) }}</span>
        <span>Frais {{ money(cart.supplier.value.deliveryFee) }}</span>
      </div>

      <div class="order-add-line">
        <div><label class="field-label">Produit</label><select v-model="cart.selectedProductKey.value"><option v-for="product in cart.availableProducts.value" :key="product.key" :value="product.key">{{ product.name }}</option></select></div>
        <div><label class="field-label">Quantité</label><input v-model.number="cart.selectedQuantity.value" type="number" min="1" step="1" /></div>
        <button class="panel-action" type="button" @click="cart.addLine">Ajouter au panier</button>
      </div>

      <h3>Panier fournisseur</h3>
      <div v-if="!cart.detailedLines.value.length" class="empty-state">Le bon de commande est vide.</div>
      <article v-for="line in cart.detailedLines.value" :key="line.productKey" class="cart-line">
        <div class="cart-product"><strong>{{ line.product.name }}</strong><small>{{ money(line.unitPrice) }} / unité · {{ storageLabel(line.storageType) }}</small></div>
        <input :value="line.quantity" type="number" min="1" step="1" @change="cart.updateQuantity(line.productKey, Number(($event.target as HTMLInputElement).value))" />
        <strong>{{ money(line.lineTotal) }}</strong>
        <button class="cart-remove" type="button" title="Supprimer" @click="cart.removeLine(line.productKey)">×</button>
      </article>

      <div class="order-preview">
        <div><span>Marchandises</span><strong>{{ money(cart.merchandiseTotal.value) }}</strong></div>
        <div><span>Frais de livraison</span><strong>{{ money(cart.lines.value.length ? cart.supplier.value?.deliveryFee ?? 0 : 0) }}</strong></div>
        <div class="total"><span>Total débité</span><strong>{{ money(cart.orderTotal.value) }}</strong></div>
        <div v-for="type in storageTypes" :key="type"><span>Réception {{ storageLabel(type) }}</span><strong>{{ cart.requiredByStorage.value[type] }} unité(s)</strong></div>
      </div>

      <div v-for="error in cart.validationErrors.value" :key="error" class="form-error">{{ error }}</div>
      <div class="cart-actions">
        <button type="button" class="secondary-action" :disabled="!cart.lines.value.length" @click="cart.clear">Vider le panier</button>
        <button type="button" class="panel-action" :disabled="cart.validationErrors.value.length > 0" @click="submitOrder">Valider le bon de commande</button>
      </div>
      <p v-if="message" :class="messageType === 'success' ? 'form-success' : 'form-error'">{{ message }}</p>
    </section>

    <section>
      <h2>Historique des commandes</h2>
      <div v-if="!orders.length" class="empty-state">Aucune commande enregistrée.</div>
      <article v-for="order in orders" :key="order.id" class="order-card">
        <div><strong>{{ order.id }}</strong><span>{{ orderStatusLabel(order.status) }}</span></div>
        <small>{{ supplierName(order.supplierKey) }} · livraison jour {{ order.expectedDay }} · {{ money(order.orderedTotal) }}</small>
        <ul class="order-lines"><li v-for="line in order.lines" :key="line.productKey">{{ productName(line.productKey) }} × {{ line.quantity }}</li></ul>
        <small v-if="order.rejectedLines.length">{{ order.rejectedLines.reduce((sum: number, line: any) => sum + line.quantity, 0) }} unité(s) refusée(s) faute de place.</small>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import type { ProductDefinition, StorageType } from '../../game/definitions'
import { usePurchaseOrderCart } from '../../composables/usePurchaseOrderCart'

const props = defineProps<{ suppliers: any[]; products: ProductDefinition[]; storageCapacities: any[]; cash: number; orders: any[]; message: string; messageType: 'success' | 'error' }>()
const emit = defineEmits<{ submit: [supplierKey: string, lines: Array<{ productKey: string; quantity: number }>] }>()
const storageTypes: StorageType[] = ['ambient', 'cold', 'frozen']
const cart = usePurchaseOrderCart({ suppliers: toRef(props, 'suppliers'), products: toRef(props, 'products'), storageCapacities: toRef(props, 'storageCapacities'), cash: toRef(props, 'cash') })

function submitOrder() {
  if (cart.validationErrors.value.length || !cart.supplier.value) return
  emit('submit', cart.supplier.value.key, cart.lines.value.map(line => ({ ...line })))
  cart.clear()
}
function supplierName(key: string) { return props.suppliers.find(item => item.key === key)?.name ?? key }
function productName(key: string) { return props.products.find(item => item.key === key)?.name ?? key }
function orderStatusLabel(status: string) { return status === 'ordered' ? 'En attente' : status === 'delivered' ? 'Livrée' : status === 'partially-delivered' ? 'Partielle' : 'Annulée' }
function storageLabel(type: StorageType) { return type === 'ambient' ? 'Ambiante' : type === 'cold' ? 'Froide' : 'Surgelée' }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value || 0) }
</script>
