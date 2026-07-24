<template>
  <div class="management-overlay" @click.self="$emit('close')">
    <section class="management-window">
      <header class="management-header">
        <div>
          <span class="eyebrow">{{ activeSection.label }}</span>
          <h1>{{ activeTab.label }}</h1>
          <p>{{ activeSection.description }}</p>
        </div>
        <button class="close-button" aria-label="Fermer" @click="$emit('close')">×</button>
      </header>

      <nav class="management-section-nav" aria-label="Espaces de gestion">
        <button
          v-for="section in sections"
          :key="section.key"
          :class="{ active: activeSection.key === section.key }"
          :title="section.description"
          @click="openSection(section.key)"
        >
          <span>{{ section.icon }}</span>
          <strong>{{ section.label }}</strong>
        </button>
      </nav>

      <nav class="management-nav" :aria-label="`Navigation ${activeSection.label}`">
        <button
          v-for="item in activeSection.tabs"
          :key="item.key"
          :class="{ active: tab === item.key }"
          @click="$emit('update:tab', item.key)"
        >{{ item.label }}</button>
      </nav>

      <DirectionPanel v-if="tab === 'direction'" />

      <div v-else-if="tab === 'dashboard'" class="management-content">
        <div class="kpi-grid"><article><span>Trésorerie</span><strong>{{ money(ui.cash) }}</strong></article><article><span>CA du jour</span><strong>{{ money(ui.dayRevenue) }}</strong></article><article><span>Bénéfice</span><strong :class="ui.dayProfit >= 0 ? 'positive-text' : 'negative-text'">{{ money(ui.dayProfit) }}</strong></article><article><span>Clients</span><strong>{{ ui.customers }}</strong></article><article><span>Stock en rayon</span><strong>{{ ui.shelfStock }}</strong></article><article><span>Masse salariale</span><strong>{{ money(payroll) }}/j</strong></article></div>
        <h2>Alertes</h2><div v-if="!alerts.length" class="success-state">Aucune alerte logistique.</div><div v-for="alert in alerts" :key="alert" class="alert-card">{{ alert }}</div>
        <h2>Commandes en cours</h2><div v-if="!pendingOrders.length" class="empty-state">Aucune livraison en attente.</div><article v-for="order in pendingOrders" :key="order.id" class="order-card"><div><strong>{{ order.id }}</strong><span>Jour {{ order.expectedDay }}</span></div><small>{{ supplierName(order.supplierKey) }} · {{ money(order.orderedTotal) }}</small></article>
        <PerformanceHistoryPanel />
      </div>

      <div v-else-if="tab === 'finances'" class="management-content"><div class="finance-summary"><article><span>Revenus</span><strong>{{ money(ui.dayRevenue) }}</strong></article><article><span>Charges</span><strong>{{ money(ui.dayExpenses) }}</strong></article><article><span>Résultat</span><strong>{{ money(ui.dayProfit) }}</strong></article></div><dl class="finance-list"><div><dt>Construction</dt><dd>{{ money(ui.dayConstructionCost) }}</dd></div><div><dt>Achats de marchandises</dt><dd>{{ money(ui.dayMerchandiseCost) }}</dd></div><div><dt>Exploitation du magasin</dt><dd>{{ money(ui.dayOperatingCost) }}</dd></div><div><dt>Salaires prévus</dt><dd>{{ money(payroll) }}</dd></div><div class="total"><dt>Total des charges</dt><dd>{{ money(ui.dayExpenses) }}</dd></div></dl></div>
      <div v-else-if="tab === 'reserve'" class="management-content"><div class="capacity-grid"><article v-for="capacity in storageCapacities" :key="capacity.type" class="capacity-card"><div><strong>{{ storageLabel(capacity.type) }}</strong><span>{{ capacity.used }}/{{ capacity.capacity }}</span></div><div class="stock-meter"><span :style="{ width: `${capacity.ratio * 100}%` }" /></div><small v-if="capacity.capacity === 0">Aucune zone construite.</small></article></div><h2>Produits stockés</h2><div v-if="!reserveLines.length" class="empty-state">La réserve est vide.</div><div v-for="line in reserveLines" :key="line.productKey" class="reserve-line"><span>{{ line.productName }}</span><strong>{{ line.quantity }}</strong></div></div>
      <StoreNeedsPanel v-else-if="tab === 'needs'" />
      <CustomerAnalyticsPanel v-else-if="tab === 'customers'" v-bind="customerAnalytics" />
      <PricingPanel v-else-if="tab === 'pricing'" :lines="pricingLines" @update-price="(productKey, salePrice) => $emit('update-price', productKey, salePrice)" @apply-markup="$emit('apply-markup', $event)" />
      <MarketingPanel v-else-if="tab === 'marketing'" :day="ui.day" />
      <BusinessFinancePanel v-else-if="tab === 'business-finance'" />
      <EmployeesPanel v-else-if="tab === 'employees'" :employees="employees" :candidates="candidates" :roles="employeeRoles" :checkouts="checkouts" :buildings="buildings" :payroll="payroll" :tasks="employeeTasks" :selected-employee-id="selectedEmployeeId" @hire="$emit('hire', $event)" @dismiss="$emit('dismiss', $event)" @assign="(employeeId, buildingId) => $emit('assign', employeeId, buildingId)" @refresh-candidates="$emit('refresh-candidates')" @select-employee="$emit('select-employee', $event)" />
      <PurchaseOrdersPanel v-else-if="tab === 'orders'" :suppliers="suppliers" :products="products" :storage-capacities="storageCapacities" :cash="ui.cash" :orders="orders" :message="orderMessage" :message-type="orderMessageType" @submit="(supplierKey, lines) => $emit('submit-order', supplierKey, lines)" />
      <div v-else-if="tab === 'settings'" class="management-content">
        <SettingsPanel />
        <section class="save-panel">
          <div><span class="eyebrow">Partie</span><h2>Sauvegarde</h2><p>Enregistrez ou restaurez l’état complet du magasin.</p></div>
          <div class="save-actions"><button class="panel-action" @click="$emit('save-game')">Sauvegarder</button><button class="secondary-action" :disabled="!hasSave" @click="$emit('load-game')">Charger</button><button class="danger-action" :disabled="!hasSave" @click="$emit('delete-save')">Supprimer</button></div>
          <p v-if="saveMessage" class="form-success">{{ saveMessage }}</p>
        </section>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
export type ManagementTab = 'direction' | 'dashboard' | 'finances' | 'needs' | 'reserve' | 'customers' | 'pricing' | 'marketing' | 'business-finance' | 'employees' | 'orders' | 'settings'
export type ManagementSection = 'overview' | 'commerce' | 'operations' | 'system'
</script>
<script setup lang="ts">
import type { CustomerAnalyticsSummary, CustomerPurchaseObservation, ProductCustomerAnalytics } from '@market-tycoon/analytics'
import type { EmployeeRoleDefinition, ProductDefinition, StorageType } from '@market-tycoon/catalog'
import type { EmployeeState, EmployeeWorkTask } from '@market-tycoon/employees'
import { computed } from 'vue'
import BusinessFinancePanel from './BusinessFinancePanel.vue'
import CustomerAnalyticsPanel from './CustomerAnalyticsPanel.vue'
import DirectionPanel from './DirectionPanel.vue'
import EmployeesPanel from './EmployeesPanel.vue'
import MarketingPanel from './MarketingPanel.vue'
import PerformanceHistoryPanel from './PerformanceHistoryPanel.vue'
import PricingPanel from './PricingPanel.vue'
import PurchaseOrdersPanel from './PurchaseOrdersPanel.vue'
import SettingsPanel from './SettingsPanel.vue'
import StoreNeedsPanel from './StoreNeedsPanel.vue'

interface CustomerAnalyticsViewModel { day:number; daySummary:CustomerAnalyticsSummary; allSummary:CustomerAnalyticsSummary; dayProducts:ProductCustomerAnalytics[]; allProducts:ProductCustomerAnalytics[]; recent:CustomerPurchaseObservation[] }
interface SectionDefinition { key:ManagementSection; label:string; icon:string; description:string; tabs:Array<{key:ManagementTab;label:string}> }
const props = defineProps<{ tab:ManagementTab; ui:any; alerts:string[]; pendingOrders:any[]; suppliers:any[]; storageCapacities:any[]; reserveLines:any[]; orders:any[]; products:ProductDefinition[]; pricingLines:any[]; customerAnalytics:CustomerAnalyticsViewModel; orderMessage:string; orderMessageType:'success'|'error'; employees:EmployeeState[]; candidates:EmployeeState[]; employeeRoles:EmployeeRoleDefinition[]; employeeTasks:EmployeeWorkTask[]; selectedEmployeeId?:string; checkouts:any[]; buildings:any[]; payroll:number; hasSave:boolean; saveMessage:string }>()
const emit = defineEmits<{ close:[]; 'update:tab':[tab:ManagementTab]; 'submit-order':[supplierKey:string,lines:Array<{productKey:string;quantity:number}>]; 'update-price':[productKey:string,salePrice:number]; 'apply-markup':[markupRate:number]; hire:[candidateId:string]; dismiss:[employeeId:string]; assign:[employeeId:string,buildingId?:string]; 'select-employee':[employeeId?:string]; 'refresh-candidates':[]; 'save-game':[]; 'load-game':[]; 'delete-save':[] }>()

const sections: SectionDefinition[] = [
  { key:'overview', label:'Pilotage', icon:'📊', description:'Prévisions, performance, finances et connaissance client.', tabs:[{key:'direction',label:'Direction'},{key:'dashboard',label:'Tableau de bord'},{key:'finances',label:'Finances'},{key:'customers',label:'Clients'}] },
  { key:'commerce', label:'Commerce', icon:'📣', description:'Prix, offres commerciales, publicité et financement.', tabs:[{key:'pricing',label:'Prix'},{key:'marketing',label:'Promotions'},{key:'business-finance',label:'Publicité & emprunts'}] },
  { key:'operations', label:'Exploitation', icon:'🏪', description:'Stocks, approvisionnement et organisation de l’équipe.', tabs:[{key:'needs',label:'Besoins'},{key:'reserve',label:'Réserve'},{key:'orders',label:'Commandes'},{key:'employees',label:'Équipe'}] },
  { key:'system', label:'Système', icon:'⚙️', description:'Préférences et gestion de la partie.', tabs:[{key:'settings',label:'Paramètres & sauvegarde'}] },
]
const activeSection = computed(() => sections.find(section => section.tabs.some(item => item.key === props.tab)) ?? sections[0])
const activeTab = computed(() => activeSection.value.tabs.find(item => item.key === props.tab) ?? activeSection.value.tabs[0])
function openSection(section: ManagementSection) { const target = sections.find(item => item.key === section); if (target) emit('update:tab', target.tabs[0].key) }
function supplierName(key:string){return props.suppliers.find(item=>item.key===key)?.name??key}
function storageLabel(type:StorageType){return type==='ambient'?'Ambiante':type==='cold'?'Froide':'Surgelée'}
function money(value:number){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(value||0)}
</script>

<style scoped>
.management-window{grid-template-rows:auto auto auto 1fr}
.management-header p{margin:7px 0 0;color:#94a3b8;font-size:12px}
.management-section-nav{padding:10px 20px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;border-bottom:1px solid #1e293b;background:#08111f}
.management-section-nav button{min-width:0;padding:10px 12px;display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid #1e293b;border-radius:10px;background:#0f172a;color:#94a3b8;cursor:pointer}
.management-section-nav button span{font-size:18px}.management-section-nav button strong{font-size:11px}.management-section-nav button.active{border-color:#4ade80;background:rgba(22,101,52,.28);color:#dcfce7}
.management-nav{overflow-x:auto}.management-nav button{white-space:nowrap}
.save-panel{margin-top:22px;padding:16px;border:1px solid #1e293b;border-radius:12px;background:#0f172a}.save-panel h2{margin:4px 0}.save-panel p{color:#94a3b8;font-size:12px}.save-actions{display:grid;grid-template-columns:1fr auto auto;gap:10px;margin:16px 0}.save-actions .panel-action{margin:0}.danger-action{padding:10px 12px;border:1px solid #7f1d1d;border-radius:8px;background:rgba(127,29,29,.22);color:#fecaca;cursor:pointer}
@media(max-width:700px){.management-section-nav{grid-template-columns:repeat(4,44px);justify-content:center}.management-section-nav button{padding:9px}.management-section-nav button strong{display:none}.save-actions{grid-template-columns:1fr}}
</style>
