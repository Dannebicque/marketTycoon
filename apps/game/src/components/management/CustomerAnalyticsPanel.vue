<template>
  <div class="management-content customer-analytics">
    <header class="analytics-header">
      <div><span class="eyebrow">Comportement client</span><h2>Visites, satisfaction et décisions d’achat</h2></div>
      <label><span>Période</span><select v-model="scope"><option value="day">Aujourd’hui</option><option value="all">Toute la partie</option></select></label>
    </header>

    <h3>Parcours en magasin</h3>
    <div class="analytics-kpis visit-kpis">
      <article><span>Visites terminées</span><strong>{{ visitSummary.visits }}</strong></article>
      <article><span>Taux d’achat</span><strong>{{ percent(visitSummary.conversionRate) }}</strong></article>
      <article><span>Panier moyen</span><strong>{{ money(visitSummary.averageBasketValue) }}</strong></article>
      <article><span>Articles / panier</span><strong>{{ visitSummary.averageArticleCount.toFixed(1) }}</strong></article>
      <article><span>Attente moyenne</span><strong>{{ duration(visitSummary.averageQueueTimeMs) }}</strong></article>
      <article><span>Satisfaction</span><strong :class="satisfactionClass(visitSummary.averageSatisfaction.overall)">{{ visitSummary.averageSatisfaction.overall.toFixed(0) }}/100</strong></article>
      <article><span>Abandons</span><strong class="negative-text">{{ visitSummary.abandonedVisits }}</strong></article>
      <article><span>CA abandonné</span><strong class="negative-text">{{ money(visitSummary.potentialLostRevenue) }}</strong></article>
    </div>

    <div class="satisfaction-grid">
      <article><span>Prix</span><strong>{{ visitSummary.averageSatisfaction.price.toFixed(0) }}</strong></article>
      <article><span>Disponibilité</span><strong>{{ visitSummary.averageSatisfaction.availability.toFixed(0) }}</strong></article>
      <article><span>File d’attente</span><strong>{{ visitSummary.averageSatisfaction.queue.toFixed(0) }}</strong></article>
      <article><span>Passage en caisse</span><strong>{{ visitSummary.averageSatisfaction.checkout.toFixed(0) }}</strong></article>
    </div>

    <div class="analytics-table-wrap profile-table">
      <table class="analytics-table">
        <thead><tr><th>Profil</th><th>Visites</th><th>Conversion</th><th>Panier moyen</th><th>Attente</th><th>Satisfaction</th><th>CA perdu</th></tr></thead>
        <tbody>
          <tr v-for="profile in visitProfiles" :key="profile.profileKey">
            <td><strong>{{ profileLabel(profile.profileKey) }}</strong></td>
            <td>{{ profile.visits }}</td>
            <td>{{ percent(profile.conversionRate) }}</td>
            <td>{{ money(profile.averageBasketValue) }}</td>
            <td>{{ duration(profile.averageQueueTimeMs) }}</td>
            <td :class="satisfactionClass(profile.averageSatisfaction.overall)">{{ profile.averageSatisfaction.overall.toFixed(0) }}/100</td>
            <td class="negative-text">{{ money(profile.potentialLostRevenue) }}</td>
          </tr>
          <tr v-if="!visitProfiles.length"><td colspan="7" class="empty-state">Aucune visite terminée sur cette période.</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Décisions produit</h3>
    <div class="analytics-kpis">
      <article><span>Décisions observées</span><strong>{{ summary.observations }}</strong></article>
      <article><span>Conversion</span><strong>{{ percent(summary.conversionRate) }}</strong></article>
      <article><span>Unités abandonnées</span><strong>{{ summary.rejectedQuantity }}</strong></article>
      <article><span>CA potentiel perdu</span><strong class="negative-text">{{ money(summary.estimatedLostRevenue) }}</strong></article>
      <article><span>Impact satisfaction</span><strong :class="summary.averageSatisfactionDelta >= 0 ? 'positive-text' : 'negative-text'">{{ signed(summary.averageSatisfactionDelta) }}</strong></article>
    </div>

    <section class="analytics-help">
      <strong>Lecture recommandée</strong>
      <p>Les statistiques de visite montrent l’expérience globale. Le tableau produit permet ensuite d’identifier si les abandons viennent des prix, du stock ou du passage en caisse.</p>
    </section>

    <div class="analytics-table-wrap">
      <table class="analytics-table">
        <thead><tr><th>Produit</th><th>Prix magasin</th><th>Prix marché</th><th>Écart</th><th>Demandé</th><th>Acheté</th><th>Conversion quantité</th><th>Refus</th><th>CA perdu</th><th>Diagnostic</th></tr></thead>
        <tbody>
          <tr v-for="line in visibleProducts" :key="line.productKey">
            <td><strong>{{ line.productName }}</strong><small>{{ line.observations }} décision(s)</small></td>
            <td>{{ money(line.averageSalePrice) }}</td><td>{{ money(line.averageMarketPrice) }}</td>
            <td :class="line.averagePriceRatio > 1.1 ? 'negative-text' : line.averagePriceRatio < .9 ? 'positive-text' : ''">{{ percent(line.averagePriceRatio - 1) }}</td>
            <td>{{ line.requestedQuantity }}</td><td>{{ line.acceptedQuantity }}</td><td>{{ percent(line.quantityConversionRate) }}</td>
            <td>{{ line.rejectedDecisions }} complet(s) · {{ line.reducedDecisions }} réduit(s)</td>
            <td class="negative-text">{{ money(line.estimatedLostRevenue) }}</td>
            <td><span class="diagnostic" :class="diagnostic(line).level">{{ diagnostic(line).label }}</span></td>
          </tr>
          <tr v-if="!visibleProducts.length"><td colspan="10" class="empty-state">Aucune décision client enregistrée sur cette période.</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Dernières visites</h3>
    <div class="recent-decisions">
      <article v-for="visit in recentVisits" :key="visit.id">
        <div><strong>{{ visit.customerId }} · {{ profileLabel(visit.profileKey) }}</strong><span>J{{ visit.day }}</span></div>
        <p>{{ visit.outcome === 'completed' ? `${visit.articleCount} article(s) · ${money(visit.saleTotal)}` : `Abandon : ${abandonLabel(visit.abandonReason)}` }} · satisfaction {{ visit.satisfaction.overall }}/100</p>
      </article>
      <div v-if="!recentVisits.length" class="empty-state">Aucune visite terminée.</div>
    </div>

    <h3>Dernières décisions produit</h3>
    <div class="recent-decisions">
      <article v-for="item in recent" :key="item.id">
        <div><strong>{{ item.productName }}</strong><span>J{{ item.day }} · {{ item.customerId }}</span></div>
        <p>{{ decisionLabel(item.decision) }} · {{ item.acceptedQuantity }}/{{ item.requestedQuantity }} unité(s) · prix {{ percent(item.priceRatio - 1) }} vs marché</p>
      </article>
      <div v-if="!recent.length" class="empty-state">Aucun historique disponible.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { customerVisitAnalytics, type CustomerAnalyticsSummary, type CustomerPurchaseObservation, type ProductCustomerAnalytics } from '@market-tycoon/analytics'
import { computed, ref } from 'vue'

const props = defineProps<{ day: number; daySummary: CustomerAnalyticsSummary; allSummary: CustomerAnalyticsSummary; dayProducts: ProductCustomerAnalytics[]; allProducts: ProductCustomerAnalytics[]; recent: CustomerPurchaseObservation[] }>()
const scope = ref<'day' | 'all'>('day')
const summary = computed(() => scope.value === 'day' ? props.daySummary : props.allSummary)
const visibleProducts = computed(() => scope.value === 'day' ? props.dayProducts : props.allProducts)
const visitSummary = computed(() => { void props.daySummary.observations; return customerVisitAnalytics.getSummary(scope.value === 'day' ? props.day : undefined) })
const visitProfiles = computed(() => { void props.daySummary.observations; return customerVisitAnalytics.getProfileAnalytics(scope.value === 'day' ? props.day : undefined) })
const recentVisits = computed(() => { void props.daySummary.observations; return customerVisitAnalytics.getRecent(20).filter(item => scope.value === 'all' || item.day === props.day) })

function diagnostic(line: ProductCustomerAnalytics) {
  if (line.observations < 3) return { label: 'Données insuffisantes', level: 'neutral' }
  if (line.averagePriceRatio > 1.1 && line.quantityConversionRate < .65) return { label: 'Prix probablement trop élevé', level: 'danger' }
  if (line.averagePriceRatio < .9 && line.quantityConversionRate > .85) return { label: 'Marge potentiellement améliorable', level: 'warning' }
  if (line.quantityConversionRate < .5) return { label: 'Forte perte de demande', level: 'danger' }
  return { label: 'Tarif équilibré', level: 'success' }
}
function profileLabel(value: string) { return ({ economical: 'Économe', hurried: 'Pressé', family: 'Famille', premium: 'Premium', regular: 'Habitué' } as Record<string, string>)[value] ?? value }
function abandonLabel(value?: string) { return ({ 'empty-basket': 'panier vide', 'no-compatible-checkout': 'aucune caisse adaptée', 'checkout-blocked': 'caisse inaccessible', impatient: 'attente trop longue', 'exit-blocked': 'sortie inaccessible', 'store-unavailable': 'magasin indisponible', unknown: 'raison inconnue' } as Record<string, string>)[value ?? 'unknown'] }
function satisfactionClass(value: number) { return value >= 75 ? 'positive-text' : value < 50 ? 'negative-text' : '' }
function decisionLabel(value: string) { return value === 'accept' ? 'Achat accepté' : value === 'reduce' ? 'Quantité réduite' : 'Produit refusé' }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value || 0) }
function percent(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1, signDisplay: value ? 'auto' : 'never' }).format(value || 0) }
function signed(value: number) { return `${value > 0 ? '+' : ''}${value.toFixed(1)} pts` }
function duration(value: number) { return value < 1_000 ? '0 s' : `${(value / 1_000).toFixed(1)} s` }
</script>

<style scoped>
.analytics-header { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; }
.analytics-header h2 { margin:4px 0 0; font-size:22px; }
.analytics-header label { display:flex; align-items:center; gap:8px; color:#94a3b8; font-size:11px; }
.analytics-header select { padding:8px 10px; border:1px solid #334155; border-radius:8px; background:#020617; color:#e2e8f0; }
.analytics-kpis { margin-top:12px; display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px; }
.visit-kpis { grid-template-columns:repeat(4,minmax(0,1fr)); }
.analytics-kpis article,.satisfaction-grid article { padding:13px; border:1px solid #1e293b; border-radius:11px; background:#0f172a; }
.analytics-kpis span,.satisfaction-grid span { display:block; color:#94a3b8; font-size:10px; }
.analytics-kpis strong,.satisfaction-grid strong { display:block; margin-top:5px; font-size:18px; }
.satisfaction-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin:10px 0 18px; }
.analytics-help { margin:16px 0; padding:12px 14px; border:1px solid #1d4ed8; border-radius:10px; background:rgba(30,64,175,.14); }
.analytics-help p { margin:5px 0 0; color:#bfdbfe; font-size:11px; line-height:1.5; }
.analytics-table-wrap { overflow:auto; border:1px solid #1e293b; border-radius:12px; }
.profile-table { margin-bottom:22px; }
.analytics-table { width:100%; min-width:900px; border-collapse:collapse; background:#0f172a; }
.analytics-table th,.analytics-table td { padding:10px; border-bottom:1px solid #1e293b; text-align:right; font-size:10px; }
.analytics-table th:first-child,.analytics-table td:first-child { text-align:left; }
.analytics-table th { position:sticky; top:0; background:#111827; color:#94a3b8; }
.analytics-table td strong,.analytics-table td small { display:block; }
.analytics-table td small { margin-top:3px; color:#64748b; }
.diagnostic { display:inline-flex; padding:4px 7px; border-radius:999px; white-space:nowrap; font-size:9px; font-weight:700; }
.diagnostic.success { background:rgba(22,101,52,.3); color:#bbf7d0; }.diagnostic.warning { background:rgba(146,64,14,.3); color:#fde68a; }.diagnostic.danger { background:rgba(127,29,29,.35); color:#fecaca; }.diagnostic.neutral { background:#1e293b; color:#cbd5e1; }
.recent-decisions { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
.recent-decisions article { padding:10px 12px; border:1px solid #1e293b; border-radius:9px; background:#0f172a; }
.recent-decisions article > div { display:flex; justify-content:space-between; gap:12px; }.recent-decisions span,.recent-decisions p { color:#94a3b8; font-size:10px; }.recent-decisions p { margin:6px 0 0; }
@media (max-width:900px) { .analytics-kpis,.visit-kpis,.satisfaction-grid { grid-template-columns:repeat(2,1fr); } .recent-decisions { grid-template-columns:1fr; } }
</style>