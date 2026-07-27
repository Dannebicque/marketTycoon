<template>
  <div class="management-content direction-panel">
    <section class="direction-hero">
      <div>
        <span class="eyebrow">Prévision du jour {{ snapshot.day }}</span>
        <h2>{{ snapshot.forecast.expectedVisitors }} visiteurs attendus</h2>
        <p>Le moteur combine calendrier, météo, concurrence, prix, réputation, publicité, promotions, satisfaction locale et mémoire client.</p>
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
      <article class="price-index-kpi"><span>Indice prix magasin</span><strong :class="priceIndexClass">{{ snapshot.forecast.pricing.storePriceIndex.toFixed(1) }}</strong><small>{{ priceIndexLabel }}</small></article>
      <article><span>Panier prévu</span><strong>{{ money(snapshot.forecast.expectedBasket) }}</strong><small>par client servi</small></article>
      <article><span>Multiplicateur trafic</span><strong>×{{ snapshot.forecast.trafficMultiplier.toFixed(2) }}</strong><small>par rapport au trafic de base</small></article>
      <article><span>Demande produit</span><strong>×{{ snapshot.forecast.demandMultiplier.toFixed(2) }}</strong><small>intention d’achat estimée</small></article>
    </div>

    <section class="pricing-impact" :class="snapshot.forecast.pricing.storePriceIndex > 103 ? 'expensive' : snapshot.forecast.pricing.storePriceIndex < 97 ? 'competitive' : 'aligned'">
      <div><span class="eyebrow">Compétitivité</span><h2>{{ priceIndexTitle }}</h2><p>{{ priceIndexExplanation }}</p></div>
      <dl>
        <div><dt>Effet trafic</dt><dd>×{{ snapshot.forecast.pricing.trafficMultiplier.toFixed(2) }}</dd></div>
        <div><dt>Effet demande</dt><dd>×{{ snapshot.forecast.pricing.demandMultiplier.toFixed(2) }}</dd></div>
        <div><dt>Valeur panier</dt><dd>×{{ snapshot.forecast.pricing.basketValueMultiplier.toFixed(2) }}</dd></div>
      </dl>
    </section>

    <section class="direction-card zone-satisfaction-card">
      <header>
        <div><span class="eyebrow">Expérience locale</span><h2>Satisfaction par secteur commercial</h2></div>
        <p>{{ organizedShelfCount }} organisé(s) · {{ unassignedShelfCount }} à organiser</p>
      </header>
      <p v-if="unassignedShelfCount" class="coverage-info">ℹ {{ unassignedShelfCount }} rayon(s) fonctionnent hors secteur commercial. C’est acceptable, notamment au démarrage, mais ils ne bénéficient pas encore des bonus d’organisation ni d’analyses sectorielles précises.</p>
      <p v-if="partialShelfCount" class="coverage-warning">⚠ {{ partialShelfCount }} rayon(s) sont seulement partiellement couverts par une zone.</p>
      <p v-if="mixedShelfCount" class="coverage-problem">⚠ {{ mixedShelfCount }} rayon(s) chevauchent plusieurs zones commerciales et rendent l’organisation incohérente.</p>
      <div class="zone-satisfaction-grid">
        <article v-for="zone in zones" :key="zone.key" :class="zoneClass(zone.score)">
          <div class="zone-title"><span>{{ zone.icon }}</span><div><strong>{{ zone.name }}</strong><small>{{ zone.zoneCount }} zone(s) · {{ zone.cellCount }} case(s) · {{ zone.shelfCount }} rayon(s)</small><small>{{ zone.observations ? `${zone.observations} décision(s) observée(s)` : 'Pas encore de données client' }}</small></div><b>{{ zone.score }}</b></div>
          <div class="zone-progress"><i :style="{ width: `${zone.score}%` }" /></div>
          <dl>
            <div><dt>Prix</dt><dd>{{ zone.breakdown.price }}</dd></div>
            <div><dt>Disponibilité</dt><dd>{{ zone.breakdown.availability }}</dd></div>
            <div><dt>Attente</dt><dd>{{ zone.breakdown.waiting }}</dd></div>
          </dl>
          <p v-if="!zone.zoneCount" class="zone-info">ℹ Aucun espace physique aménagé pour ce secteur</p>
          <p v-else-if="zone.mixedShelfCount" class="zone-alert">⚠ {{ zone.mixedShelfCount }} rayon(s) chevauchent plusieurs zones</p>
          <p v-else-if="zone.partialShelfCount" class="zone-warning">⚠ {{ zone.partialShelfCount }} rayon(s) seulement partiellement couverts</p>
          <p v-else-if="zone.strongestIssue" class="zone-alert">⚠ {{ issueLabel(zone.strongestIssue) }}</p>
          <p v-else-if="zone.observations" class="zone-ok">✓ Secteur maîtrisé</p>
        </article>
      </div>
    </section>

    <section class="loyalty-summary">
      <article><span>Clients connus</span><strong>{{ memory.summary.knownCustomers }}</strong><small>{{ memory.summary.activeCustomers }} actifs sur 14 jours</small></article>
      <article><span>Taux de retour</span><strong>{{ percent(memory.summary.returnRate) }}</strong><small>{{ memory.summary.returningVisits }} visites récurrentes</small></article>
      <article><span>Clients attachés</span><strong>{{ memory.summary.preferredCustomers }}</strong><small>magasin devenu favori</small></article>
      <article><span>Pression concurrentielle</span><strong>{{ competition.pressure }} / 100</strong><small>{{ competition.leader ? `${competition.leader.icon} ${competition.leader.name}` : 'marché calme' }}</small></article>
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
        <p class="panel-help">Le positionnement prix modifie cette répartition. La satisfaction locale permettra ensuite d’affiner la fidélité par univers commercial.</p>
      </article>
    </section>

    <section class="direction-card competition-card">
      <header><div><span class="eyebrow">Marché local</span><h2>Concurrents directs</h2></div></header>
      <div class="competitor-grid">
        <article v-for="competitor in competition.competitors" :key="competitor.id" :class="{ leader: competition.leader?.id === competitor.id }">
          <div class="competitor-title"><span>{{ competitor.icon }}</span><div><strong>{{ competitor.name }}</strong><small>{{ strategyLabel(competitor.strategy) }}</small></div><b v-if="competition.leader?.id === competitor.id">Leader</b></div>
          <dl><div><dt>Indice prix</dt><dd>{{ Math.round(competitor.priceIndex * 100) }}</dd></div><div><dt>Qualité</dt><dd>{{ competitor.quality }}/100</dd></div><div><dt>Praticité</dt><dd>{{ competitor.convenience }}/100</dd></div></dl>
        </article>
      </div>
    </section>

    <section class="direction-card previous-day">
      <header><div><span class="eyebrow">Dernière journée</span><h2>Prévision contre réalité</h2></div></header>
      <div class="comparison-grid"><div><span>Visiteurs</span><strong>{{ snapshot.previousDayVisitors }}</strong></div><div><span>Clients servis</span><strong>{{ snapshot.previousDayServed }}</strong></div><div><span>Clients perdus</span><strong>{{ snapshot.previousDayLost }}</strong></div><div><span>Satisfaction</span><strong>{{ snapshot.previousDaySatisfaction.toFixed(0) }} / 100</strong></div></div>
      <ul v-if="latestHistory?.reasons.length" class="reputation-reasons"><li v-for="reason in latestHistory.reasons" :key="reason">{{ reason }}</li></ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { customerAnalytics, customerVisitAnalytics, ZoneSatisfactionManager, type CommercialSatisfactionSource, type ZoneSatisfactionBreakdown, type ZoneSatisfactionSnapshot } from '@market-tycoon/analytics'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { getCompetitionSnapshot } from '../../simulation/installCompetition'
import { getCustomerMemorySnapshot } from '../../simulation/installCustomerMemory'
import { getInfluenceSnapshot } from '../../simulation/installInfluence'
import { commercialZoneRuntime } from '../../zones/commercialZoneRuntime'

const zoneSatisfaction = new ZoneSatisfactionManager()
const snapshot = reactive(getInfluenceSnapshot())
const memory = reactive(getCustomerMemorySnapshot(snapshot.day))
const competition = reactive(getCompetitionSnapshot(snapshot.day))
const zones = ref<ZoneSatisfactionSnapshot[]>([])
const shelfCoverage = ref(commercialZoneRuntime.shelfCoverage)
let refreshTimer: number | undefined

const forecastProgress = computed(() => Math.min(100, snapshot.forecast.expectedVisitors > 0 ? snapshot.actualVisitors / snapshot.forecast.expectedVisitors * 100 : 0))
const latestHistory = computed(() => snapshot.reputation.history.at(-1))
const organizedShelfCount = computed(() => shelfCoverage.value.filter(item => item.status === 'assigned').length)
const unassignedShelfCount = computed(() => shelfCoverage.value.filter(item => item.severity === 'info').length)
const partialShelfCount = computed(() => shelfCoverage.value.filter(item => item.severity === 'warning').length)
const mixedShelfCount = computed(() => shelfCoverage.value.filter(item => item.severity === 'problem').length)
const priceIndexClass = computed(() => snapshot.forecast.pricing.storePriceIndex < 97 ? 'positive-text' : snapshot.forecast.pricing.storePriceIndex > 103 ? 'negative-text' : '')
const priceIndexLabel = computed(() => snapshot.forecast.pricing.storePriceIndex < 97 ? 'moins cher que le marché' : snapshot.forecast.pricing.storePriceIndex > 103 ? 'plus cher que le marché' : 'aligné sur le marché')
const priceIndexTitle = computed(() => snapshot.forecast.pricing.storePriceIndex < 97 ? 'Avantage prix actif' : snapshot.forecast.pricing.storePriceIndex > 103 ? 'Risque de fuite client' : 'Positionnement équilibré')
const priceIndexExplanation = computed(() => snapshot.forecast.pricing.storePriceIndex < 97 ? 'Les prix plus bas soutiennent le trafic et la demande, mais réduisent la marge unitaire.' : snapshot.forecast.pricing.storePriceIndex > 103 ? 'Les prix plus élevés augmentent la valeur du panier, mais font reculer trafic et demande.' : 'Les prix sont proches du marché et ne créent pas de frein majeur.')

function getCommercialSources(): CommercialSatisfactionSource[] {
  const configuredZones = commercialZoneRuntime.zones
  return commercialZoneRuntime.definitions.map(definition => {
    const sectorZones = configuredZones.filter(zone => zone.sectorKey === definition.key)
    const shelves = shelfCoverage.value.filter(item => item.sectorKey === definition.key)
    return {
      key: definition.key,
      name: definition.name,
      icon: definition.icon,
      categories: definition.defaultProductCategories ?? [],
      zoneCount: sectorZones.length,
      cellCount: sectorZones.reduce((total, zone) => total + zone.cells.length, 0),
      shelfCount: shelves.length,
      partialShelfCount: shelves.filter(item => item.status === 'partial').length,
      mixedShelfCount: shelves.filter(item => item.status === 'mixed').length,
    }
  })
}

function refresh() {
  Object.assign(snapshot, getInfluenceSnapshot())
  Object.assign(memory, getCustomerMemorySnapshot(snapshot.day))
  Object.assign(competition, getCompetitionSnapshot(snapshot.day))
  shelfCoverage.value = commercialZoneRuntime.shelfCoverage
  const visits = customerVisitAnalytics.getSummary(snapshot.day)
  zones.value = zoneSatisfaction.getSnapshot(getCommercialSources(), customerAnalytics.getProductAnalytics(snapshot.day), visits.averageQueueTimeMs)
}
function score(value:number) { return `${value.toFixed(1)} / 100` }
function percent(value:number) { return `${Math.round(value * 100)} %` }
function money(value:number) { return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:2 }).format(value) }
function strategyLabel(value:string) { return value === 'discount' ? 'Prix bas' : value === 'quality' ? 'Qualité et frais' : 'Proximité et rapidité' }
function trend(key:'notoriety'|'trust'|'loyalty') { const history = snapshot.reputation.history; if (history.length < 2) return 'Pas encore de tendance'; const delta = history.at(-1)![key] - history.at(-2)![key]; return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} sur la dernière journée` }
function zoneClass(scoreValue:number) { return scoreValue < 60 ? 'critical' : scoreValue < 75 ? 'warning' : 'good' }
function issueLabel(issue:keyof ZoneSatisfactionBreakdown) { return issue === 'price' ? 'Prix mal perçus' : issue === 'availability' ? 'Ruptures ou refus importants' : 'Attente en caisse pénalisante' }

onMounted(() => { refresh(); refreshTimer = window.setInterval(refresh, 500); window.addEventListener('market-tycoon:influence-updated', refresh) })
onBeforeUnmount(() => { if (refreshTimer) window.clearInterval(refreshTimer); window.removeEventListener('market-tycoon:influence-updated', refresh) })
</script>

<style scoped>
.direction-panel{display:flex;flex-direction:column;gap:16px}.direction-hero,.pricing-impact,.direction-card{padding:16px;border:1px solid #1e293b;border-radius:12px;background:#0f172a}.direction-hero,.pricing-impact{display:flex;justify-content:space-between;gap:20px}.direction-hero h2,.pricing-impact h2,.direction-card h2{margin:4px 0 8px}.direction-hero p,.pricing-impact p,.panel-help{margin:0;color:#94a3b8;font-size:11px;line-height:1.5}.forecast-progress{min-width:190px}.forecast-progress strong,.forecast-progress span{display:block}.forecast-progress div,.zone-progress{height:7px;margin-top:10px;overflow:hidden;border-radius:999px;background:#1e293b}.forecast-progress i,.zone-progress i{display:block;height:100%;background:#4ade80}.direction-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}.direction-kpis small{display:block;margin-top:5px;color:#94a3b8}.pricing-impact dl{min-width:260px;margin:0}.pricing-impact dl div,.factor-line,.profile-line{display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px solid #1e293b}.pricing-impact.competitive{border-color:#166534}.pricing-impact.expensive{border-color:#9a3412}.zone-satisfaction-card header{display:flex;justify-content:space-between;gap:16px}.zone-satisfaction-card header p{color:#64748b;font-size:10px}.coverage-info,.coverage-warning,.coverage-problem{margin:0 0 10px;padding:9px 11px;border:1px solid;border-radius:8px;font-size:10px}.coverage-info{border-color:#1d4ed8;background:rgba(29,78,216,.13);color:#bfdbfe}.coverage-warning{border-color:#a16207;background:rgba(161,98,7,.13);color:#fde68a}.coverage-problem{border-color:#b91c1c;background:rgba(185,28,28,.13);color:#fecaca}.zone-satisfaction-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.zone-satisfaction-grid>article{padding:12px;border:1px solid #334155;border-radius:10px;background:#111827}.zone-satisfaction-grid>article.warning{border-color:#a16207}.zone-satisfaction-grid>article.critical{border-color:#b91c1c}.zone-title{display:flex;align-items:center;gap:8px}.zone-title>span{font-size:22px}.zone-title>div{flex:1}.zone-title strong,.zone-title small{display:block}.zone-title small{margin-top:2px;color:#64748b;font-size:9px}.zone-title b{font-size:22px}.zone-satisfaction-grid dl{display:grid;gap:4px;margin:10px 0 0}.zone-satisfaction-grid dl div{display:flex;justify-content:space-between}.zone-satisfaction-grid dt{color:#94a3b8;font-size:9px}.zone-satisfaction-grid dd{margin:0;font-size:10px;font-weight:700}.zone-info,.zone-warning,.zone-alert,.zone-ok{margin:9px 0 0;font-size:9px}.zone-info{color:#93c5fd}.zone-warning{color:#fde68a}.zone-alert{color:#fca5a5}.zone-ok{color:#86efac}.loyalty-summary,.comparison-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.loyalty-summary article,.comparison-grid div{padding:12px;border-radius:10px;background:#111827}.loyalty-summary span,.loyalty-summary strong,.loyalty-summary small,.comparison-grid span,.comparison-grid strong{display:block}.loyalty-summary span,.comparison-grid span{color:#94a3b8;font-size:10px}.loyalty-summary small{color:#64748b;font-size:9px}.direction-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:14px}.factor-line>div{display:flex;flex-direction:column}.factor-line small{color:#94a3b8;font-size:10px}.competitor-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.competitor-grid>article{padding:12px;border:1px solid #1e293b;border-radius:10px;background:#111827}.competitor-grid>article.leader{border-color:#f59e0b}.competitor-title{display:flex;align-items:center;gap:8px}.competitor-title>div{flex:1}.competitor-title small{display:block;color:#94a3b8;font-size:9px}.competitor-grid dl div{display:flex;justify-content:space-between}.competitor-grid dd{margin:0}.reputation-reasons{color:#cbd5e1;font-size:11px}@media(max-width:950px){.zone-satisfaction-grid,.competitor-grid{grid-template-columns:1fr 1fr}.direction-kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.direction-hero,.pricing-impact{flex-direction:column}.zone-satisfaction-grid,.direction-grid,.loyalty-summary,.comparison-grid,.competitor-grid{grid-template-columns:1fr}}
</style>