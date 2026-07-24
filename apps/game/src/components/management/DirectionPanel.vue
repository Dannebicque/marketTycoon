<template>
  <div class="management-content direction-panel">
    <section class="direction-hero">
      <div>
        <span class="eyebrow">Prévision du jour {{ snapshot.day }}</span>
        <h2>{{ snapshot.forecast.expectedVisitors }} visiteurs attendus</h2>
        <p>Le moteur combine calendrier, météo, réputation, publicité, promotions et mémoire client pour piloter la journée.</p>
      </div>
      <div class="forecast-progress">
        <strong>{{ snapshot.actualVisitors }} / {{ snapshot.forecast.expectedVisitors }}</strong>
        <span>visiteurs arrivés</span>
        <div><i :style="{ width: `${forecastProgress}%` }" /></div>
      </div>
    </section>

    <div class="kpi-grid direction-kpis">
      <article><span>Notoriété</span><strong>{{ score(snapshot.reputation.notoriety) }}</strong><small>{{ trend('notoriety') }}</small></article>
      <article><span>Confiance</span><strong>{{ score(snapshot.reputation.trust) }}</strong><small>{{ trend('trust') }}</small></article>
      <article><span>Fidélité</span><strong>{{ score(snapshot.reputation.loyalty) }}</strong><small>{{ trend('loyalty') }}</small></article>
      <article><span>Panier prévu</span><strong>{{ money(snapshot.forecast.expectedBasket) }}</strong><small>par client servi</small></article>
      <article><span>Multiplicateur trafic</span><strong>×{{ snapshot.forecast.trafficMultiplier.toFixed(2) }}</strong><small>par rapport au trafic de base</small></article>
      <article><span>Demande produit</span><strong>×{{ snapshot.forecast.demandMultiplier.toFixed(2) }}</strong><small>intention d’achat estimée</small></article>
    </div>

    <section class="loyalty-summary">
      <article><span>Clients connus</span><strong>{{ memory.summary.knownCustomers }}</strong><small>{{ memory.summary.activeCustomers }} actifs sur 14 jours</small></article>
      <article><span>Taux de retour</span><strong>{{ percent(memory.summary.returnRate) }}</strong><small>{{ memory.summary.returningVisits }} visites récurrentes</small></article>
      <article><span>Clients attachés</span><strong>{{ memory.summary.preferredCustomers }}</strong><small>magasin devenu favori</small></article>
      <article><span>Affinité moyenne</span><strong>{{ memory.summary.averageAffinity.toFixed(0) }} / 100</strong><small>population mémorisée</small></article>
    </section>

    <section class="direction-grid">
      <article class="direction-card">
        <header><div><span class="eyebrow">Explication</span><h2>Facteurs du trafic</h2></div></header>
        <div v-for="factor in snapshot.forecast.factors" :key="factor.source" class="factor-line">
          <div><strong>{{ factor.label }}</strong><small>{{ factor.detail }}</small></div>
          <span :class="factor.multiplier >= 1 ? 'positive-text' : 'negative-text'">×{{ factor.multiplier.toFixed(2) }}</span>
        </div>
      </article>

      <article class="direction-card">
        <header><div><span class="eyebrow">Clientèle</span><h2>Profils attendus</h2></div></header>
        <div class="profile-line"><span>Sensibles au prix</span><strong>{{ percent(snapshot.forecast.profileWeights.budget) }}</strong></div>
        <div class="profile-line"><span>Clients réguliers</span><strong>{{ percent(snapshot.forecast.profileWeights.regular) }}</strong></div>
        <div class="profile-line"><span>Recherche de praticité</span><strong>{{ percent(snapshot.forecast.profileWeights.convenience) }}</strong></div>
        <p class="panel-help">Cette répartition pilote réellement les profils générés, leurs catégories préférées et la composition de leurs paniers.</p>
      </article>
    </section>

    <section v-if="memory.customers.length" class="direction-card loyal-customers">
      <header><div><span class="eyebrow">Mémoire client</span><h2>Meilleurs habitués</h2></div></header>
      <div class="loyal-list">
        <div v-for="customer in memory.customers.slice(0, 6)" :key="customer.id" class="loyal-line">
          <div><strong>{{ customer.id }}</strong><small>{{ profileLabel(customer.profileKey) }} · {{ customer.visits }} visite(s) · dernière J{{ customer.lastVisitDay }}</small></div>
          <div class="loyal-scores"><span>Affinité {{ customer.affinity.toFixed(0) }}</span><span>Confiance {{ customer.trust.toFixed(0) }}</span><b v-if="customer.preferredStore">★ Favori</b></div>
        </div>
      </div>
    </section>

    <section class="direction-card previous-day">
      <header><div><span class="eyebrow">Dernière journée</span><h2>Prévision contre réalité</h2></div></header>
      <div class="comparison-grid">
        <div><span>Visiteurs</span><strong>{{ snapshot.previousDayVisitors }}</strong></div>
        <div><span>Clients servis</span><strong>{{ snapshot.previousDayServed }}</strong></div>
        <div><span>Clients perdus</span><strong>{{ snapshot.previousDayLost }}</strong></div>
        <div><span>Satisfaction</span><strong>{{ snapshot.previousDaySatisfaction.toFixed(0) }} / 100</strong></div>
      </div>
      <ul v-if="latestHistory?.reasons.length" class="reputation-reasons">
        <li v-for="reason in latestHistory.reasons" :key="reason">{{ reason }}</li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue'
import { getCustomerMemorySnapshot } from '../../simulation/installCustomerMemory'
import { getInfluenceSnapshot } from '../../simulation/installInfluence'

const snapshot = reactive(getInfluenceSnapshot())
const memory = reactive(getCustomerMemorySnapshot(snapshot.day))
let refreshTimer: number | undefined

const forecastProgress = computed(() => Math.min(100, snapshot.forecast.expectedVisitors > 0 ? snapshot.actualVisitors / snapshot.forecast.expectedVisitors * 100 : 0))
const latestHistory = computed(() => snapshot.reputation.history.at(-1))

function refresh() {
  Object.assign(snapshot, getInfluenceSnapshot())
  Object.assign(memory, getCustomerMemorySnapshot(snapshot.day))
}
function score(value:number) { return `${value.toFixed(1)} / 100` }
function percent(value:number) { return `${Math.round(value * 100)} %` }
function money(value:number) { return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:2 }).format(value) }
function profileLabel(value:string) { return value === 'budget' ? 'Économe' : value === 'regular' ? 'Habitué' : value === 'premium' ? 'Premium' : value === 'family' ? 'Famille' : 'Pressé' }
function trend(key:'notoriety'|'trust'|'loyalty') {
  const history = snapshot.reputation.history
  if (history.length < 2) return 'Pas encore de tendance'
  const delta = history.at(-1)![key] - history.at(-2)![key]
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} sur la dernière journée`
}

onMounted(() => {
  refresh()
  refreshTimer = window.setInterval(refresh, 500)
  window.addEventListener('market-tycoon:influence-updated', refresh)
  window.addEventListener('market-tycoon:customer-memory-updated', refresh)
})
onBeforeUnmount(() => {
  if (refreshTimer) window.clearInterval(refreshTimer)
  window.removeEventListener('market-tycoon:influence-updated', refresh)
  window.removeEventListener('market-tycoon:customer-memory-updated', refresh)
})
</script>

<style scoped>
.direction-panel{display:flex;flex-direction:column;gap:16px}.direction-hero{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:18px;border:1px solid #1e293b;border-radius:14px;background:linear-gradient(135deg,rgba(22,101,52,.28),rgba(15,23,42,.92))}.direction-hero h2{margin:5px 0 7px;font-size:24px}.direction-hero p{max-width:620px;margin:0;color:#94a3b8;font-size:12px;line-height:1.55}.forecast-progress{min-width:190px;padding:13px;border-radius:11px;background:rgba(2,6,23,.7)}.forecast-progress strong,.forecast-progress span{display:block}.forecast-progress strong{font-size:20px}.forecast-progress span{margin-top:3px;color:#94a3b8;font-size:10px}.forecast-progress div{height:7px;margin-top:10px;overflow:hidden;border-radius:999px;background:#1e293b}.forecast-progress i{display:block;height:100%;background:#4ade80}.direction-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.direction-kpis small{display:block;margin-top:6px;color:#94a3b8;font-size:10px}.loyalty-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.loyalty-summary article{padding:13px;border:1px solid #1e293b;border-radius:10px;background:#111827}.loyalty-summary span,.loyalty-summary strong,.loyalty-summary small{display:block}.loyalty-summary span{color:#94a3b8;font-size:10px}.loyalty-summary strong{margin-top:5px;font-size:19px}.loyalty-summary small{margin-top:4px;color:#64748b;font-size:9px}.direction-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:14px}.direction-card{padding:16px;border:1px solid #1e293b;border-radius:12px;background:#0f172a}.direction-card header h2{margin:4px 0 13px}.factor-line,.profile-line{padding:9px 0;display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid #1e293b}.factor-line>div{display:flex;flex-direction:column;gap:3px}.factor-line small{color:#94a3b8;font-size:10px}.loyal-list{display:grid;grid-template-columns:1fr 1fr;gap:8px}.loyal-line{padding:10px;border-radius:9px;background:#111827;display:flex;align-items:center;justify-content:space-between;gap:12px}.loyal-line>div:first-child{display:flex;flex-direction:column;gap:3px}.loyal-line small{color:#94a3b8;font-size:9px}.loyal-scores{display:flex;align-items:flex-end;flex-direction:column;gap:3px;color:#cbd5e1;font-size:9px}.loyal-scores b{color:#facc15}.comparison-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.comparison-grid div{padding:11px;border-radius:9px;background:#111827}.comparison-grid span,.comparison-grid strong{display:block}.comparison-grid span{color:#94a3b8;font-size:10px}.comparison-grid strong{margin-top:5px}.reputation-reasons{margin:14px 0 0;padding-left:20px;color:#cbd5e1;font-size:11px;line-height:1.6}@media(max-width:800px){.direction-hero{align-items:stretch;flex-direction:column}.forecast-progress{min-width:0}.direction-kpis,.direction-grid,.comparison-grid,.loyalty-summary,.loyal-list{grid-template-columns:1fr 1fr}}@media(max-width:560px){.direction-kpis,.direction-grid,.comparison-grid,.loyalty-summary,.loyal-list{grid-template-columns:1fr}}
</style>
