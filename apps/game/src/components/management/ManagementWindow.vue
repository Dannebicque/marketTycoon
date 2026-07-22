<template>
  <div class="management-overlay" @click.self="$emit('close')">
    <section class="management-window">
      <header class="management-header"><div><span class="eyebrow">{{ t('management.eyebrow') }}</span><h1>{{ t('management.title') }}</h1></div><button class="close-button" @click="$emit('close')">×</button></header>
      <nav class="management-nav"><button v-for="item in tabs" :key="item.key" :class="{ active: tab === item.key }" @click="$emit('update:tab', item.key)">{{ item.label }}</button></nav>

      <div v-if="tab === 'dashboard'" class="management-content">
        <div class="kpi-grid"><article><span>Trésorerie</span><strong>{{ money(ui.cash) }}</strong></article><article><span>CA du jour</span><strong>{{ money(ui.dayRevenue) }}</strong></article><article><span>Bénéfice</span><strong :class="ui.dayProfit >= 0 ? 'positive-text' : 'negative-text'">{{ money(ui.dayProfit) }}</strong></article><article><span>Clients</span><strong>{{ ui.customers }}</strong></article><article><span>Stock en rayon</span><strong>{{ ui.shelfStock }}</strong></article><article><span>Masse salariale</span><strong>{{ money(payroll) }}/j</strong></article></div>
        <div class="save-actions"><button class="panel-action" @click="$emit('save-game')">Sauvegarder</button><button class="secondary-action" :disabled="!hasSave" @click="$emit('load-game')">Charger</button><button class="danger-action" :disabled="!hasSave" @click="$emit('delete-save')">Supprimer</button></div>
        <p v-if="saveMessage" class="form-success">{{ saveMessage }}</p>
        <h2>Alertes</h2><div v-if="!alerts.length" class="success-state">Aucune alerte logistique.</div><div v-for="alert in alerts" :key="alert" class="alert-card">{{ alert }}</div>
        <h2>Commandes en cours</h2><div v-if="!pendingOrders.length" class="empty-state">Aucune livraison en attente.</div><article v-for="order in pendingOrders" :key="order.id" class="order-card"><div><strong>{{ order.id }}</strong><span>Jour {{ order.expectedDay }}</span></div><small>{{ supplierName(order.supplierKey) }} · {{ money(order.orderedTotal) }}</small></article>
      </div>

      <div v-else-if="tab === 'finances'" class="management-content">
        <div class="finance-summary"><article><span>Revenus</span><strong>{{ money(ui.dayRevenue) }}</strong></article><article><span>Charges</span><strong>{{ money(ui.dayExpenses) }}</strong></article><article><span>Résultat</span><strong>{{ money(ui.dayProfit) }}</strong></article></div>
        <dl class="finance-list"><div><dt>Construction</dt><dd>{{ money(ui.dayConstructionCost) }}</dd></div><div><dt>Achats de marchandises</dt><dd>{{ money(ui.dayMerchandiseCost) }}</dd></div><div><dt>Exploitation du magasin</dt><dd>{{ money(ui.dayOperatingCost) }}</dd></div><div><dt>Salaires prévus</dt><dd>{{ money(payroll) }}</dd></div><div class="total"><dt>Total des charges</dt><dd>{{ money(ui.dayExpenses) }}</dd></div></dl>
      </div>

      <div v-else-if="tab === 'reserve'" class="management-content">
        <div class="capacity-grid"><article v-for="capacity in storageCapacities" :key="capacity.type" class="capacity-card"><div><strong>{{ storageLabel(capacity.type) }}</strong><span>{{ capacity.used }}/{{ capacity.capacity }}</span></div><div class="stock-meter"><span :style="{ width: `${capacity.ratio * 100}%` }" /></div><small v-if="capacity.capacity === 0">Aucune zone construite.</small></article></div>
        <h2>Produits stockés</h2><div v-if="!reserveLines.length" class="empty-state">La réserve est vide.</div><div v-for="line in reserveLines" :key="line.productKey" class="reserve-line"><span>{{ line.productName }}</span><strong>{{ line.quantity }}</strong></div>
      </div>

      <StoreNeedsPanel v-else-if="tab === 'needs'" :report="storeNeedsReport" :history="storeNeedsHistory" />
      <CustomerAnalyticsPanel v-else-if="tab === 'customers'" v-bind="customerAnalytics" />
      <PricingPanel v-else-if="tab === 'pricing'" :lines="pricingLines" @update-price="(productKey, salePrice) => $emit('update-price', productKey, salePrice)" @apply-markup="$emit('apply-markup', $event)" />
      <EmployeesPanel v-else-if="tab === 'employees'" :employees="employees" :candidates="candidates" :roles="employeeRoles" :locked-role-keys="lockedRoleKeys" :checkouts="checkouts" :payroll="payroll" @hire="$emit('hire', $event)" @dismiss="$emit('dismiss', $event)" @assign="(employeeId, buildingId) => $emit('assign', employeeId, buildingId)" @refresh-candidates="$emit('refresh-candidates')" />
      <PurchaseOrdersPanel v-else-if="tab === 'orders'" :suppliers="suppliers" :products="products" :storage-capacities="storageCapacities" :cash="ui.cash" :orders="orders" :message="orderMessage" :message-type="orderMessageType" @submit="(supplierKey, lines) => $emit('submit-order', supplierKey, lines)" />
      <SettingsPanel v-else-if="tab === 'settings'" />
    </section>
  </div>
</template>

<script lang="ts">export type ManagementTab = 'dashboard' | 'finances' | 'needs' | 'reserve' | 'customers' | 'pricing' | 'employees' | 'orders' | 'settings'</script>
<script setup lang="ts">
import type { CustomerAnalyticsSummary, CustomerPurchaseObservation, ProductCustomerAnalytics } from '@market-tycoon/analytics'
import type { EmployeeRoleDefinition, ProductDefinition, StorageType } from '@market-tycoon/catalog'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EmployeeState } from '../../game/employees/employeeTypes'
import type { StoreNeedsReport } from '../../simulation/StoreNeedsManager'
import CustomerAnalyticsPanel from './CustomerAnalyticsPanel.vue'
import EmployeesPanel from './EmployeesPanel.vue'
import PricingPanel from './PricingPanel.vue'
import PurchaseOrdersPanel from './PurchaseOrdersPanel.vue'
import SettingsPanel from './SettingsPanel.vue'
import StoreNeedsPanel from './StoreNeedsPanel.vue'

interface CustomerAnalyticsViewModel {
  day: number
  daySummary: CustomerAnalyticsSummary
  allSummary: CustomerAnalyticsSummary
  dayProducts: ProductCustomerAnalytics[]
  allProducts: ProductCustomerAnalytics[]
  recent: CustomerPurchaseObservation[]
}

const props = defineProps<{ tab: ManagementTab; ui: any; alerts: string[]; pendingOrders: any[]; suppliers: any[]; storageCapacities: any[]; reserveLines: any[]; orders: any[]; products: ProductDefinition[]; pricingLines: any[]; customerAnalytics: CustomerAnalyticsViewModel; orderMessage: string; orderMessageType: 'success' | 'error'; employees: EmployeeState[]; candidates: EmployeeState[]; employeeRoles: EmployeeRoleDefinition[]; lockedRoleKeys: string[]; checkouts: any[]; payroll: number; hasSave: boolean; saveMessage: string; storeNeedsReport: StoreNeedsReport; storeNeedsHistory: StoreNeedsReport[] }>()
defineEmits<{ close: []; 'update:tab': [tab: ManagementTab]; 'submit-order': [supplierKey: string, lines: Array<{ productKey: string; quantity: number }>]; 'update-price': [productKey: string, salePrice: number]; 'apply-markup': [markupRate: number]; hire: [candidateId: string]; dismiss: [employeeId: string]; assign: [employeeId: string, buildingId?: string]; 'refresh-candidates': []; 'save-game': []; 'load-game': []; 'delete-save': [] }>()
const { t, locale } = useI18n({ useScope: 'global' })
const tabs = computed<Array<{ key: ManagementTab; label: string }>>(() => {
  void locale.value
  return [
    { key: 'dashboard', label: t('management.tabs.dashboard') },
    { key: 'finances', label: t('management.tabs.finances') },
    { key: 'needs', label: 'Besoins' },
    { key: 'reserve', label: t('management.tabs.reserve') },
    { key: 'customers', label: t('management.tabs.customers') },
    { key: 'pricing', label: t('management.tabs.pricing') },
    { key: 'employees', label: t('management.tabs.employees') },
    { key: 'orders', label: t('management.tabs.orders') },
    { key: 'settings', label: t('management.tabs.settings') },
  ]
})
function supplierName(key: string) { return props.suppliers.find(item => item.key === key)?.name ?? key }
function storageLabel(type: StorageType) { return type === 'ambient' ? 'Ambiante' : type === 'cold' ? 'Froide' : 'Surgelée' }
function money(value: number) { return new Intl.NumberFormat(locale.value === 'en' ? 'en-US' : 'fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value || 0) }
</script>

<style scoped>
.save-actions { display:grid; grid-template-columns:1fr auto auto; gap:10px; margin:16px 0; }
.save-actions .panel-action { margin:0; }
.danger-action { padding:10px 12px; border:1px solid #7f1d1d; border-radius:8px; background:rgba(127,29,29,.22); color:#fecaca; cursor:pointer; }
@media (max-width:700px) { .save-actions { grid-template-columns:1fr; } }
</style>
