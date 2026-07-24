<template>
  <div class="management-content direction-panel">
    <section class="direction-hero">
      <div>
        <span class="eyebrow">Prévision du jour {{ snapshot.day }}</span>
        <h2>{{ snapshot.forecast.expectedVisitors }} visiteurs attendus</h2>
        <p>Le moteur combine calendrier, réputation, publicité et promotions pour piloter les arrivées automatiques.</p>
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
        <p class="panel-help">Cette répartition sera utilisée progressivement pour orienter les profils générés et leurs intentions d’achat.</p>
      </article>
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
import { getInfluenceSnapshot } from '../../simulation/installInfluence'

const snapshot = reactive(getInfluenceSnapshot())
let refreshTimer: number | undefined

const forecastProgress = computed(() => Math.min(100, snapshot.forecast.expectedVisitors > 0 ? snapshot.actualVisitors / snapshot.forecast.expectedVisitors * 100 : 0))
const latestHistory = computed(() => snapshot.reputation.history.at(-1))

function refresh() { Object.assign(snapshot, getInfluenceSnapshot()) }
function score(value:number) { return `${value.toFixed(1)} / 100` }
function percent(value:number) { return `${Math.round(value * 100)} %` }
function money(value:number) { return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:2 }).format(value) }
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
})
onBeforeUnmount(() => {
  if (refreshTimer) window.clearInterval(refreshTimer)
  window.removeEventListener('market-tycoon:influence-updated', refresh)
})
</script>

<style scoped>
.direction-panel{display:flex;flex-direction:column;gap:16px}.direction-hero{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:18px;border:1px solid #1e293b;border-radius:14px;background:linear-gradient(135deg,rgba(22,101,52,.28),rgba(15,23,42,.92))}.direction-hero h2{margin:5px 0 7px;font-size:24px}.direction-hero p{max-width:620px;margin:0;color:#94a3b8;font-size:12px;line-height:1.55}.forecast-progress{min-width:190px;padding:13px;border-radius:11px;background:rgba(2,6,23,.7)}.forecast-progress strong,.forecast-progress span{display:block}.forecast-progress strong{font-size:20px}.forecast-progress span{margin-top:3px;color:#94a3b8;font-size:10px}.forecast-progress div{height:7px;margin-top:10px;overflow:hidden;border-radius:999px;background:#1e293b}.forecast-progress i{display:block;height:100%;background:#4ade80}.direction-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.direction-kpis small{display:block;margin-top:6px;color:#94a3b8;font-size:10px}.direction-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:14px}.direction-card{padding:16px;border:1px solid #1e293b;border-radius:12px;background:#0f172a}.direction-card header h2{margin:4px 0 13px}.factor-line,.profile-line{padding:9px 0;display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid #1e293b}.factor-line>div{display:flex;flex-direction:column;gap:3px}.factor-line small{color:#94a3b8;font-size:10px}.comparison-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.comparison-grid div{padding:11px;border-radius:9px;background:#111827}.comparison-grid span,.comparison-grid strong{display:block}.comparison-grid span{color:#94a3b8;font-size:10px}.comparison-grid strong{margin-top:5px}.reputation-reasons{margin:14px 0 0;padding-left:20px;color:#cbd5e1;font-size:11px;line-height:1.6}@media(max-width:800px){.direction-hero{align-items:stretch;flex-direction:column}.forecast-progress{min-width:0}.direction-kpis,.direction-grid,.comparison-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.direction-kpis,.direction-grid,.comparison-grid{grid-template-columns:1fr}}
</style>
