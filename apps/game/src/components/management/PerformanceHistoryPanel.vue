<template>
  <DirectionPanel />
  <section class="performance-panel">
    <div class="panel-heading">
      <div><span class="eyebrow">Historique</span><h2>Performance du magasin</h2></div>
      <span v-if="summary.days" class="period-badge">{{ summary.days }} jour(s)</span>
    </div>

    <div v-if="!records.length" class="empty-state">Les tendances apparaîtront après la première clôture de journée.</div>
    <template v-else>
      <div class="performance-kpis">
        <article><span>CA moyen</span><strong>{{ money(summary.averageDailyRevenue) }}</strong></article>
        <article><span>Résultat moyen</span><strong :class="summary.averageDailyProfit >= 0 ? 'positive-text' : 'negative-text'">{{ money(summary.averageDailyProfit) }}</strong></article>
        <article><span>Conversion</span><strong>{{ percent(summary.conversionRate) }}</strong></article>
        <article><span>Satisfaction</span><strong>{{ summary.averageSatisfaction.toFixed(0) }}/100</strong></article>
        <article><span>Marge brute</span><strong>{{ money(summary.grossMargin) }}</strong></article>
        <article><span>Valeur du stock</span><strong>{{ money(summary.latestStockValue) }}</strong></article>
      </div>

      <div v-if="latest" class="latest-day">
        <div><span>Dernier bilan</span><strong>Jour {{ latest.day }}</strong></div>
        <div><span>CA</span><strong>{{ money(latest.revenue) }}</strong><small :class="trendClass(revenueTrend)">{{ trendLabel(revenueTrend) }}</small></div>
        <div><span>Résultat</span><strong>{{ money(latest.profit) }}</strong><small :class="trendClass(profitTrend)">{{ trendLabel(profitTrend) }}</small></div>
        <div><span>Clients servis</span><strong>{{ latest.servedCustomers }}</strong></div>
      </div>

      <div class="history-table">
        <div class="history-head"><span>Jour</span><span>CA</span><span>Marge</span><span>Résultat</span><span>Clients</span><span>Satisfaction</span></div>
        <div v-for="record in [...records].reverse()" :key="record.day" class="history-row">
          <strong>J{{ record.day }}</strong>
          <span>{{ money(record.revenue) }}</span>
          <span>{{ money(record.grossMargin) }}</span>
          <span :class="record.profit >= 0 ? 'positive-text' : 'negative-text'">{{ money(record.profit) }}</span>
          <span>{{ record.servedCustomers }}/{{ record.servedCustomers + record.lostCustomers }}</span>
          <span>{{ record.averageSatisfaction.toFixed(0) }}/100</span>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { storePerformanceAnalytics, type StorePerformanceRecord, type StorePerformanceSummary } from '@market-tycoon/analytics'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import DirectionPanel from './DirectionPanel.vue'

const records = ref<StorePerformanceRecord[]>([])
const summary = ref<StorePerformanceSummary>(storePerformanceAnalytics.getSummary(7))
let timer: number | undefined

const latest = computed(() => records.value.at(-1))
const previous = computed(() => records.value.at(-2))
const revenueTrend = computed(() => trend(latest.value?.revenue, previous.value?.revenue))
const profitTrend = computed(() => trend(latest.value?.profit, previous.value?.profit))

function refresh() {
  records.value = storePerformanceAnalytics.getRecords(7)
  summary.value = storePerformanceAnalytics.getSummary(7)
}
function trend(current?: number, before?: number) {
  if (current === undefined || before === undefined || Math.abs(before) < .01) return null
  return (current - before) / Math.abs(before)
}
function trendLabel(value: number | null) {
  if (value === null) return 'Pas de comparaison'
  const sign = value > 0 ? '+' : ''
  return `${sign}${(value * 100).toFixed(0)} % vs J-1`
}
function trendClass(value: number | null) { return value === null ? '' : value >= 0 ? 'positive-text' : 'negative-text' }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0) }
function percent(value: number) { return `${(value * 100).toFixed(0)} %` }

onMounted(() => { refresh(); timer = window.setInterval(refresh, 1_000) })
onBeforeUnmount(() => { if (timer !== undefined) window.clearInterval(timer) })
</script>

<style scoped>
.performance-panel { margin-top:24px; padding-top:20px; border-top:1px solid #1e293b; }
.performance-kpis { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin:12px 0; }
.performance-kpis article { padding:12px; border:1px solid #1e293b; border-radius:10px; background:#0f172a; display:flex; flex-direction:column; gap:4px; }
.performance-kpis span,.latest-day span { color:#94a3b8; font-size:10px; text-transform:uppercase; letter-spacing:.05em; }
.period-badge { padding:5px 8px; border-radius:999px; background:#1e293b; color:#cbd5e1; font-size:10px; }
.latest-day { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; margin:12px 0; }
.latest-day > div { padding:10px; border-radius:9px; background:#020617; display:flex; flex-direction:column; gap:3px; }
.latest-day small { font-size:9px; }
.history-table { overflow:auto; border:1px solid #1e293b; border-radius:10px; }
.history-head,.history-row { display:grid; grid-template-columns:60px repeat(5,minmax(90px,1fr)); gap:10px; align-items:center; min-width:650px; padding:9px 12px; }
.history-head { background:#1e293b; color:#94a3b8; font-size:9px; text-transform:uppercase; }
.history-row { border-top:1px solid #1e293b; font-size:11px; }
.positive-text { color:#86efac; }
.negative-text { color:#fca5a5; }
@media (max-width:800px) { .performance-kpis { grid-template-columns:repeat(2,1fr); } .latest-day { grid-template-columns:repeat(2,1fr); } }
</style>
