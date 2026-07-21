<template>
  <div class="management-overlay" @click.self="$emit('close')">
    <section class="management-window">
      <header class="management-header"><div><span class="eyebrow">Pilotage du magasin</span><h1>Gestion et suivi</h1></div><button class="close-button" @click="$emit('close')">×</button></header>
      <nav class="management-nav"><button v-for="item in tabs" :key="item.key" :class="{ active: tab === item.key }" @click="$emit('update:tab', item.key)">{{ item.label }}</button></nav>

      <div v-if="tab === 'dashboard'" class="management-content">
        <div class="kpi-grid"><article><span>Trésorerie</span><strong>{{ money(ui.cash) }}</strong></article><article><span>CA du jour</span><strong>{{ money(ui.dayRevenue) }}</strong></article><article><span>Bénéfice</span><strong :class="ui.dayProfit >= 0 ? 'positive-text' : 'negative-text'">{{ money(ui.dayProfit) }}</strong></article><article><span>Clients</span><strong>{{ ui.customers }}</strong></article><article><span>Stock en rayon</span><strong>{{ ui.shelfStock }}</strong></article><article><span>Stock en réserve</span><strong>{{ ui.reserveStock }}</strong></article></div>
        <h2>Alertes</h2><div v-if="!alerts.length" class="success-state">Aucune alerte logistique.</div><div v-for="alert in alerts" :key="alert" class="alert-card">{{ alert }}</div>
        <h2>Commandes en cours</h2><div v-if="!pendingOrders.length" class="empty-state">Aucune livraison en attente.</div><article v-for="order in pendingOrders" :key="order.id" class="order-card"><div><strong>{{ order.id }}</strong><span>Jour {{ order.expectedDay }}</span></div><small>{{ supplierName(order.supplierKey) }} · {{ money(order.orderedTotal) }}</small></article>
      </div>

      <div v-else-if="tab === 'finances'" class="management-content">
        <div class="finance-summary"><article><span>Revenus</span><strong>{{ money(ui.dayRevenue) }}</strong></article><article><span>Charges</span><strong>{{ money(ui.dayExpenses) }}</strong></article><article><span>Résultat</span><strong>{{ money(ui.dayProfit) }}</strong></article></div>
        <dl class="finance-list"><div><dt>Construction</dt><dd>{{ money(ui.dayConstructionCost) }}</dd></div><div><dt>Achats de marchandises</dt><dd>{{ money(ui.dayMerchandiseCost) }}</dd></div><div><dt>Électricité et fonctionnement</dt><dd>{{ money(ui.dayOperatingCost) }}</dd></div><div class="total"><dt>Total des charges</dt><dd>{{ money(ui.dayExpenses) }}</dd></div></dl>
      </div>

      <div v-else-if="tab === 'reserve'" class="management-content">
        <div class="capacity-grid"><article v-for="capacity in storageCapacities" :key="capacity.type" class="capacity-card"><div><strong>{{ storageLabel(capacity.type) }}</strong><span>{{ capacity.used }}/{{ capacity.capacity }}</span></div><div class="stock-meter"><span :style="{ width: `${capacity.ratio * 100}%` }" /></div><small v-if="capacity.capacity === 0">Aucune zone construite.</small></article></div>
        <h2>Produits stockés</h2><div v-if="!reserveLines.length" class="empty-state">La réserve est vide.</div><div v-for="line in reserveLines" :key="line.productKey" class="reserve-line"><span>{{ line.productName }}</span><strong>{{ line.quantity }}</strong></div>
      </div>

      <PurchaseOrdersPanel v-else :suppliers="suppliers" :products="products" :storage-capacities="storageCapacities" :cash="ui.cash" :orders="orders" :message="orderMessage" :message-type="orderMessageType" @submit="(supplierKey, lines) => $emit('submit-order', supplierKey, lines)" />
    </section>
  </div>
</template>

<script lang="ts">
export type ManagementTab = 'dashboard' | 'finances' | 'reserve' | 'orders'
</script>

<script setup lang="ts">
import type { ProductDefinition, StorageType } from '../../game/definitions'
import PurchaseOrdersPanel from './PurchaseOrdersPanel.vue'

const props = defineProps<{ tab: ManagementTab; ui: any; alerts: string[]; pendingOrders: any[]; suppliers: any[]; storageCapacities: any[]; reserveLines: any[]; orders: any[]; products: ProductDefinition[]; orderMessage: string; orderMessageType: 'success' | 'error' }>()
defineEmits<{ close: []; 'update:tab': [tab: ManagementTab]; 'submit-order': [supplierKey: string, lines: Array<{ productKey: string; quantity: number }>] }>()
const tabs: Array<{ key: ManagementTab; label: string }> = [{ key: 'dashboard', label: 'Tableau de bord' }, { key: 'finances', label: 'Finances' }, { key: 'reserve', label: 'Réserve' }, { key: 'orders', label: 'Commandes' }]
function supplierName(key: string) { return props.suppliers.find(item => item.key === key)?.name ?? key }
function storageLabel(type: StorageType) { return type === 'ambient' ? 'Ambiante' : type === 'cold' ? 'Froide' : 'Surgelée' }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value || 0) }
</script>
