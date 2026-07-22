<template>
  <div class="management-content needs-panel">
    <div class="needs-hero">
      <div>
        <span class="eyebrow">Exploitation</span>
        <h2>Besoins du magasin</h2>
        <p>Suivez les charges quotidiennes, l’état des équipements et les pertes d’exploitation.</p>
      </div>
      <div class="needs-score" :class="healthClass">
        <strong>{{ healthScore }} %</strong>
        <span>état global</span>
      </div>
    </div>

    <div class="needs-kpis">
      <article><span>Coût total</span><strong>{{ money(report.costs.total) }}</strong><small>jour {{ report.day || '—' }}</small></article>
      <article><span>Électricité</span><strong>{{ money(report.costs.electricity) }}</strong><small>équipements actifs</small></article>
      <article><span>Nettoyage</span><strong>{{ money(report.costs.cleaning) }}</strong><small>propreté {{ report.cleanliness }} %</small></article>
      <article><span>Maintenance</span><strong>{{ money(report.costs.maintenance) }}</strong><small>{{ report.breakdowns }} panne(s)</small></article>
      <article><span>Déchets</span><strong>{{ report.wasteUnits }}</strong><small>{{ money(report.costs.waste) }} de pertes</small></article>
      <article><span>Technicien</span><strong>{{ report.technicianQuality || 0 }}/100</strong><small>{{ report.preventedBreakdowns }} panne(s) évitée(s)</small></article>
    </div>

    <section class="needs-section">
      <div class="panel-heading">
        <div><span class="eyebrow">Répartition</span><h2>Charges du dernier jour</h2></div>
        <strong>{{ money(report.costs.total) }}</strong>
      </div>
      <div class="cost-list">
        <div v-for="line in costLines" :key="line.key">
          <span>{{ line.icon }} {{ line.label }}</span>
          <div class="cost-track"><i :style="{ width: `${line.percent}%` }" /></div>
          <strong>{{ money(line.value) }}</strong>
        </div>
      </div>
    </section>

    <section class="needs-section">
      <div class="panel-heading">
        <div><span class="eyebrow">Équipements</span><h2>Usure et maintenance</h2></div>
        <span>{{ report.equipment.length }} suivi(s)</span>
      </div>
      <div v-if="!report.equipment.length" class="empty-state">Le premier bilan sera calculé à la fermeture du magasin.</div>
      <article v-for="equipment in report.equipment" :key="equipment.buildingId" class="equipment-health" :class="equipment.status">
        <div class="equipment-health-heading">
          <div><strong>{{ equipment.name }}</strong><small>{{ statusLabel(equipment.status) }} · {{ equipment.breakdowns }} panne(s)</small></div>
          <strong>{{ Math.round(equipment.wear) }} %</strong>
        </div>
        <div class="wear-track"><i :style="{ width: `${equipment.wear}%` }" /></div>
      </article>
    </section>

    <section v-if="history.length" class="needs-section">
      <div class="panel-heading"><div><span class="eyebrow">Historique</span><h2>Derniers bilans</h2></div></div>
      <div class="needs-history">
        <div v-for="item in history.slice(0, 7)" :key="item.day"><span>Jour {{ item.day }}</span><span>{{ item.breakdowns }} panne(s)</span><span>{{ item.wasteUnits }} déchet(s)</span><strong>{{ money(item.costs.total) }}</strong></div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeNeedsManager, type StoreNeedsReport } from '../../simulation/StoreNeedsManager'

const report = ref<StoreNeedsReport>(storeNeedsManager.getLatestReport())
const history = ref<StoreNeedsReport[]>(storeNeedsManager.getHistory())
let refreshTimer: number | undefined

function refresh() {
  report.value = storeNeedsManager.getLatestReport()
  history.value = storeNeedsManager.getHistory()
}

onMounted(() => { refresh(); refreshTimer = window.setInterval(refresh, 500) })
onBeforeUnmount(() => { if (refreshTimer) window.clearInterval(refreshTimer) })

const healthScore = computed(() => {
  if (!report.value.equipment.length) return 100
  return Math.max(0, Math.round(100 - report.value.equipment.reduce((sum, item) => sum + item.wear, 0) / report.value.equipment.length))
})
const healthClass = computed(() => healthScore.value >= 70 ? 'healthy' : healthScore.value >= 40 ? 'warning' : 'critical')
const costLines = computed(() => {
  const total = Math.max(1, report.value.costs.total)
  return [
    { key: 'electricity', label: 'Électricité', icon: '⚡', value: report.value.costs.electricity },
    { key: 'cleaning', label: 'Nettoyage', icon: '🧹', value: report.value.costs.cleaning },
    { key: 'maintenance', label: 'Maintenance', icon: '🛠️', value: report.value.costs.maintenance },
    { key: 'waste', label: 'Déchets', icon: '🗑️', value: report.value.costs.waste },
    { key: 'losses', label: 'Pertes d’exploitation', icon: '📉', value: report.value.costs.losses },
  ].map(line => ({ ...line, percent: Math.max(2, Math.round(line.value / total * 100)) }))
})
function statusLabel(status: string) { return status === 'broken' ? 'En panne' : status === 'critical' ? 'Usure critique' : status === 'warning' ? 'À surveiller' : 'Bon état' }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0) }
</script>

<style scoped>
.needs-panel { display:grid; gap:18px; }
.needs-hero { padding:18px; display:flex; justify-content:space-between; gap:20px; align-items:center; border:1px solid #1e293b; border-radius:14px; background:linear-gradient(135deg,rgba(15,23,42,.95),rgba(30,41,59,.75)); }
.needs-hero h2 { margin:4px 0 5px; font-size:24px; }
.needs-hero p { margin:0; color:#94a3b8; font-size:12px; }
.needs-score { width:92px; height:72px; display:flex; flex-direction:column; align-items:center; justify-content:center; border:1px solid #166534; border-radius:13px; background:rgba(22,101,52,.18); }
.needs-score.warning { border-color:#a16207; background:rgba(161,98,7,.18); }
.needs-score.critical { border-color:#991b1b; background:rgba(153,27,27,.2); }
.needs-score strong { font-size:22px; }.needs-score span { color:#94a3b8; font-size:9px; text-transform:uppercase; }
.needs-kpis { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
.needs-kpis article { padding:14px; border:1px solid #1e293b; border-radius:11px; background:#0f172a; }
.needs-kpis span,.needs-kpis small { color:#94a3b8; font-size:10px; }.needs-kpis strong { display:block; margin:5px 0 2px; font-size:19px; }
.needs-section { padding:16px; border:1px solid #1e293b; border-radius:13px; background:rgba(15,23,42,.7); }
.cost-list { display:grid; gap:9px; margin-top:12px; }.cost-list > div { display:grid; grid-template-columns:150px minmax(80px,1fr) 70px; gap:10px; align-items:center; font-size:11px; }
.cost-list strong { text-align:right; }.cost-track,.wear-track { height:7px; overflow:hidden; border-radius:999px; background:#1e293b; }.cost-track i,.wear-track i { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,#38bdf8,#4ade80); }
.equipment-health { margin-top:9px; padding:11px; border:1px solid #334155; border-radius:10px; background:#0b1424; }.equipment-health.warning { border-color:#854d0e; }.equipment-health.critical,.equipment-health.broken { border-color:#7f1d1d; }
.equipment-health-heading { display:flex; justify-content:space-between; gap:12px; margin-bottom:8px; }.equipment-health-heading > div { display:flex; flex-direction:column; gap:2px; }.equipment-health-heading small { color:#94a3b8; font-size:10px; }
.equipment-health.warning .wear-track i { background:linear-gradient(90deg,#eab308,#f97316); }.equipment-health.critical .wear-track i,.equipment-health.broken .wear-track i { background:linear-gradient(90deg,#f97316,#ef4444); }
.needs-history { display:grid; gap:6px; margin-top:10px; }.needs-history > div { padding:9px 10px; display:grid; grid-template-columns:80px 1fr 1fr 80px; gap:8px; border-radius:8px; background:#0b1424; font-size:10px; }.needs-history strong { text-align:right; }
@media (max-width:800px) { .needs-kpis { grid-template-columns:repeat(2,minmax(0,1fr)); }.cost-list > div { grid-template-columns:120px 1fr 60px; } }
</style>
