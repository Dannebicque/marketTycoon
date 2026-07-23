<template>
  <div class="management-content orders-layout">
    <section class="order-form-card">
      <div class="panel-heading"><div><span class="eyebrow">Approvisionnement</span><h2>Nouveau bon de commande</h2></div><strong>{{ money(cash) }}</strong></div>
      <label class="field-label">Fournisseur</label>
      <select v-model="cart.supplierKey.value" class="full-control"><option v-for="supplier in suppliers" :key="supplier.key" :value="supplier.key">{{ supplier.name }}</option></select>

      <div v-if="cart.supplier.value" class="supplier-info">
        <span>Livraison J+{{ cart.supplier.value.leadTimeDays }}</span><span>Minimum {{ money(cart.supplier.value.minimumOrderAmount) }}</span><span>Frais {{ money(cart.supplier.value.deliveryFee) }}</span>
      </div>

      <div class="order-add-line">
        <label>Produit<select v-model="cart.selectedProductKey.value"><option v-for="product in cart.availableProducts.value" :key="product.key" :value="product.key">{{ product.name }}</option></select></label>
        <label>Quantité<input v-model.number="cart.selectedQuantity.value" type="number" min="1" step="1" /></label>
        <button class="panel-action" type="button" @click="cart.addLine">Ajouter</button>
      </div>

      <h3>Panier fournisseur</h3>
      <div v-if="!cart.detailedLines.value.length" class="empty-state">Le bon de commande est vide.</div>
      <div v-else class="cart-table">
        <div class="cart-head"><span>Produit</span><span>Quantité</span><span>Sous-total</span><span /></div>
        <article v-for="line in cart.detailedLines.value" :key="line.productKey" class="cart-line">
          <div class="cart-product"><strong>{{ line.product.name }}</strong><small>{{ money(line.unitPrice) }} / unité · {{ storageLabel(line.storageType) }}</small></div>
          <input :value="line.quantity" type="number" min="1" step="1" @change="onQuantityChange(line.productKey, $event)" />
          <strong class="line-total">{{ money(line.lineTotal) }}</strong>
          <button class="cart-remove" type="button" title="Supprimer" @click="cart.removeLine(line.productKey)">×</button>
        </article>
      </div>

      <div class="order-preview">
        <div><span>Marchandises</span><strong>{{ money(cart.merchandiseTotal.value) }}</strong></div>
        <div><span>Frais de livraison</span><strong>{{ money(cart.lines.value.length ? cart.supplier.value?.deliveryFee ?? 0 : 0) }}</strong></div>
        <div class="total"><span>Total débité</span><strong>{{ money(cart.orderTotal.value) }}</strong></div>
        <div v-for="type in storageTypes" :key="type"><span>Réception {{ storageLabel(type) }}</span><strong>{{ cart.requiredByStorage.value[type] }} unité(s)</strong></div>
      </div>

      <div v-for="error in cart.validationErrors.value" :key="error" class="form-error">{{ error }}</div>
      <div class="cart-actions"><button type="button" class="secondary-action" :disabled="!cart.lines.value.length" @click="cart.clear">Vider</button><button type="button" class="panel-action" :disabled="cart.validationErrors.value.length > 0" @click="submitOrder">Valider le bon</button></div>
      <p v-if="message" :class="messageType === 'success' ? 'form-success' : 'form-error'">{{ message }}</p>
    </section>

    <section class="orders-history">
      <h2>Historique des commandes</h2>
      <div v-if="!orders.length" class="empty-state">Aucune commande enregistrée.</div>
      <article v-for="order in orders" :key="order.id" class="order-card"><div><strong>{{ order.id }}</strong><span>{{ orderStatusLabel(order.status) }}</span></div><small>{{ supplierName(order.supplierKey) }} · livraison jour {{ order.expectedDay }} · {{ money(order.orderedTotal) }}</small><ul class="order-lines"><li v-for="line in order.lines" :key="line.productKey">{{ productName(line.productKey) }} × {{ line.quantity }}</li></ul><small v-if="order.rejectedLines.length">{{ order.rejectedLines.reduce((sum:number,line:any)=>sum+line.quantity,0) }} unité(s) refusée(s) faute de place.</small></article>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ProductDefinition, StorageType } from '@market-tycoon/catalog'
import { toRef } from 'vue'
import { usePurchaseOrderCart } from '../../composables/usePurchaseOrderCart'
const props=defineProps<{suppliers:any[];products:ProductDefinition[];storageCapacities:any[];cash:number;orders:any[];message:string;messageType:'success'|'error'}>()
const emit=defineEmits<{submit:[supplierKey:string,lines:Array<{productKey:string;quantity:number}>]}>()
const storageTypes:StorageType[]=['ambient','cold','frozen']
const cart=usePurchaseOrderCart({suppliers:toRef(props,'suppliers'),products:toRef(props,'products'),storageCapacities:toRef(props,'storageCapacities'),cash:toRef(props,'cash')})
function onQuantityChange(productKey:string,event:Event){cart.updateQuantity(productKey,Number((event.target as HTMLInputElement).value))}
function submitOrder(){if(cart.validationErrors.value.length||!cart.supplier.value)return;emit('submit',cart.supplier.value.key,cart.lines.value.map(line=>({...line})));cart.clear()}
function supplierName(key:string){return props.suppliers.find(item=>item.key===key)?.name??key}
function productName(key:string){return props.products.find(item=>item.key===key)?.name??key}
function orderStatusLabel(status:string){return status==='ordered'?'En attente':status==='delivered'?'Livrée':status==='partially-delivered'?'Partielle':'Annulée'}
function storageLabel(type:StorageType){return type==='ambient'?'Ambiante':type==='cold'?'Froide':'Surgelée'}
function money(value:number){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(value||0)}
</script>

<style scoped>
.orders-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);gap:20px;align-items:start}.order-form-card,.orders-history{min-width:0}.full-control,.order-add-line select,.order-add-line input{width:100%;box-sizing:border-box;padding:9px;border:1px solid #334155;border-radius:8px;background:#020617;color:#e2e8f0}.supplier-info{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.supplier-info span{padding:6px 8px;border-radius:999px;background:#1e293b;color:#cbd5e1;font-size:10px}.order-add-line{display:grid;grid-template-columns:minmax(0,1fr) 110px auto;gap:10px;align-items:end;margin:16px 0}.order-add-line label{display:flex;flex-direction:column;gap:6px;color:#94a3b8;font-size:10px}.cart-table{overflow:hidden;border:1px solid #1e293b;border-radius:10px}.cart-head,.cart-line{display:grid;grid-template-columns:minmax(180px,1fr) 90px 110px 36px;gap:10px;align-items:center}.cart-head{padding:8px 12px;background:#020617;color:#64748b;font-size:10px;text-transform:uppercase}.cart-line{padding:10px 12px;border-top:1px solid #1e293b;background:#0f172a}.cart-product{min-width:0;display:flex;flex-direction:column;gap:3px}.cart-product strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cart-product small{color:#94a3b8;font-size:10px}.cart-line input{width:100%;box-sizing:border-box;padding:7px;border:1px solid #334155;border-radius:7px;background:#020617;color:#e2e8f0}.line-total{text-align:right}.cart-remove{width:30px;height:30px;border:1px solid #7f1d1d;border-radius:7px;background:rgba(127,29,29,.2);color:#fecaca;cursor:pointer}.order-preview{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0}.order-preview>div{display:flex;justify-content:space-between;gap:12px;padding:9px 10px;border-radius:8px;background:#020617}.order-preview .total{grid-column:1/-1;border:1px solid #166534;background:rgba(22,101,52,.15)}.cart-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}.orders-history{max-height:70vh;overflow:auto}@media(max-width:1000px){.orders-layout{grid-template-columns:1fr}.orders-history{max-height:none}}@media(max-width:650px){.order-add-line{grid-template-columns:1fr}.cart-head{display:none}.cart-line{grid-template-columns:1fr 80px 90px 34px}.order-preview{grid-template-columns:1fr}.order-preview .total{grid-column:auto}}@media(max-width:480px){.cart-line{grid-template-columns:1fr 70px 32px}.line-total{grid-column:1/3;text-align:left}.cart-remove{grid-column:3;grid-row:1/3}.cart-actions>*{flex:1}}
</style>
