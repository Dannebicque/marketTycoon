<template>
  <div class="management-content business-layout">
    <section class="business-section">
      <div class="panel-heading"><div><span class="eyebrow">Communication</span><h2>Publicité</h2></div><strong>Jour {{ snapshot.currentDay }}</strong></div>
      <div class="form-grid">
        <label>Média<select v-model="advertising.medium"><option v-for="medium in media" :key="medium.key" :value="medium.key">{{ medium.name }}</option></select></label>
        <label>Début<input v-model.number="advertising.startDay" type="number" min="1" /></label>
        <label>Fin<input v-model.number="advertising.endDay" type="number" :min="advertising.startDay" /></label>
      </div>
      <div v-if="advertisingQuote" class="quote-grid">
        <div><span>Durée</span><strong>{{ advertisingQuote.duration }} jour(s)</strong></div>
        <div><span>Coût total</span><strong>{{ money(advertisingQuote.totalCost) }}</strong></div>
        <div><span>Hausse de trafic</span><strong>+{{ percent(advertisingQuote.definition.trafficLift) }}</strong></div>
        <div><span>Trésorerie</span><strong>{{ money(snapshot.cash) }}</strong></div>
      </div>
      <p class="help-text">{{ selectedMedium?.description }}</p>
      <p v-if="advertisingQuote && advertisingQuote.totalCost > snapshot.cash" class="form-error">Budget insuffisant : il manque {{ money(advertisingQuote.totalCost - snapshot.cash) }}.</p>
      <button class="panel-action" :disabled="!advertisingQuote || advertisingQuote.totalCost > snapshot.cash" @click="createAdvertising">Lancer et payer la campagne</button>
      <p v-if="advertisingMessage" :class="advertisingSuccess ? 'form-success' : 'form-error'">{{ advertisingMessage }}</p>

      <h3>Campagnes publicitaires</h3>
      <div v-if="!snapshot.campaigns.length" class="empty-state">Aucune campagne publicitaire.</div>
      <article v-for="campaign in snapshot.campaigns" :key="campaign.id" class="business-card">
        <div><strong>{{ mediumName(campaign.medium) }}</strong><span>{{ campaign.id }}</span></div>
        <small>J{{ campaign.startDay }} → J{{ campaign.endDay }} · {{ money(campaign.totalCost) }} · +{{ percent(campaign.trafficLift) }} trafic</small>
        <span class="status-pill">{{ advertisingStatus(campaign) }}</span>
      </article>
    </section>

    <section class="business-section">
      <div class="panel-heading"><div><span class="eyebrow">Financement</span><h2>Emprunts</h2></div><strong>{{ money(snapshot.outstandingBalance) }} restant</strong></div>
      <div class="form-grid loan-grid">
        <label>Offre<select v-model="loan.offerKey"><option v-for="offer in offers" :key="offer.key" :value="offer.key">{{ offer.name }}</option></select></label>
        <label>Montant<input v-model.number="loan.amount" type="number" :min="selectedOffer?.minAmount" :max="selectedOffer?.maxAmount" step="50" /></label>
      </div>
      <div v-if="loanQuote" class="quote-grid">
        <div><span>Versement net</span><strong>{{ money(loanQuote.netCash) }}</strong></div>
        <div><span>Frais de dossier</span><strong>{{ money(loanQuote.setupFee) }}</strong></div>
        <div><span>Échéance quotidienne</span><strong>{{ money(loanQuote.installment) }}</strong></div>
        <div><span>Total remboursé</span><strong>{{ money(loanQuote.totalRepayable) }}</strong></div>
      </div>
      <p class="help-text">{{ selectedOffer?.description }} Taux : {{ percent(selectedOffer?.interestRate ?? 0) }} sur {{ selectedOffer?.durationDays }} jours.</p>
      <button class="panel-action" :disabled="!loanQuote" @click="takeLoan">Souscrire l’emprunt</button>
      <p v-if="loanMessage" :class="loanSuccess ? 'form-success' : 'form-error'">{{ loanMessage }}</p>

      <div class="debt-summary"><span>Prochaines échéances cumulées</span><strong>{{ money(snapshot.nextInstallments) }}/jour</strong></div>
      <h3>Emprunts en cours</h3>
      <div v-if="!snapshot.loans.length" class="empty-state">Aucun emprunt souscrit.</div>
      <article v-for="contract in snapshot.loans" :key="contract.id" class="business-card loan-card" :class="contract.status">
        <div><strong>{{ offerName(contract.offerKey) }}</strong><span>{{ contract.id }}</span></div>
        <small>{{ money(contract.remainingBalance) }} restant · prochaine échéance J{{ contract.nextPaymentDay }} · {{ money(contract.installment) }}/jour</small>
        <div class="loan-actions"><span class="status-pill">{{ loanStatus(contract.status) }}</span><button v-if="contract.status === 'active'" class="secondary-action" :disabled="snapshot.cash < contract.remainingBalance" @click="repay(contract.id)">Solder {{ money(contract.remainingBalance) }}</button></div>
        <details v-if="contract.payments.length"><summary>Historique des échéances</summary><div v-for="payment in contract.payments.slice().reverse()" :key="`${contract.id}-${payment.day}`" class="payment-row"><span>Jour {{ payment.day }}</span><span>Payé {{ money(payment.paid) }}</span><span v-if="payment.missed" class="negative-text">Impayé {{ money(payment.missed) }}</span></div></details>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ADVERTISING_MEDIA, LOAN_OFFERS, advertisingManager, loanManager, type AdvertisingCampaign, type AdvertisingMedium } from '@market-tycoon/economy'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { getBusinessFinanceSnapshot, repayBusinessLoan, scheduleAdvertising, takeBusinessLoan } from '../../finance/installBusinessFinance'

const media = ADVERTISING_MEDIA
const offers = LOAN_OFFERS
const version = ref(0)
let timer: number | undefined
const snapshot = computed(() => { void version.value; return getBusinessFinanceSnapshot() })
const advertising = reactive({ medium: 'flyer' as AdvertisingMedium, startDay: snapshot.value.currentDay, endDay: snapshot.value.currentDay + 2 })
const loan = reactive({ offerKey: offers[0]?.key ?? '', amount: offers[0]?.minAmount ?? 250 })
const advertisingMessage = ref(''), advertisingSuccess = ref(true), loanMessage = ref(''), loanSuccess = ref(true)
const selectedMedium = computed(() => media.find(item => item.key === advertising.medium))
const advertisingQuote = computed(() => advertisingManager.quote(advertising.medium, advertising.startDay, advertising.endDay))
const selectedOffer = computed(() => offers.find(item => item.key === loan.offerKey))
const loanQuote = computed(() => loanManager.quote(loan.offerKey, loan.amount, snapshot.value.currentDay))

function createAdvertising() { const result = scheduleAdvertising(advertising.medium, advertising.startDay, advertising.endDay); advertisingSuccess.value = result.ok; advertisingMessage.value = result.ok ? `${result.campaign.id} lancée : ${money(result.campaign.totalCost)} débités.` : result.reason; version.value += 1 }
function takeLoan() { const result = takeBusinessLoan(loan.offerKey, loan.amount, snapshot.value.currentDay); loanSuccess.value = result.ok; loanMessage.value = result.ok ? `${result.loan.id} accordé : ${money(result.netCash)} versés après frais.` : result.reason; version.value += 1 }
function repay(id: string) { const result = repayBusinessLoan(id); loanSuccess.value = result.ok; loanMessage.value = result.ok ? `Emprunt soldé pour ${money(result.amount)}.` : result.reason; version.value += 1 }
function advertisingStatus(campaign: AdvertisingCampaign) { const status = advertisingManager.getStatus(campaign, snapshot.value.currentDay); return status === 'active' ? 'Active' : status === 'scheduled' ? 'Programmée' : status === 'finished' ? 'Terminée' : 'Annulée' }
function mediumName(key: AdvertisingMedium) { return media.find(item => item.key === key)?.name ?? key }
function offerName(key: string) { return offers.find(item => item.key === key)?.name ?? key }
function loanStatus(value: string) { return value === 'active' ? 'En cours' : value === 'paid' ? 'Soldé' : 'Défaillant' }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value || 0) }
function percent(value: number) { return `${(value * 100).toFixed(0)} %` }
onMounted(() => { timer = window.setInterval(() => { version.value += 1 }, 500) })
onBeforeUnmount(() => { if (timer) window.clearInterval(timer) })
</script>

<style scoped>
.business-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:start}.business-section{padding:16px;border:1px solid #1e293b;border-radius:12px;background:#0f172a}.form-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px}.loan-grid{grid-template-columns:2fr 1fr}.business-section label{display:flex;flex-direction:column;gap:6px;margin-top:12px;color:#cbd5e1;font-size:11px}.business-section input,.business-section select{padding:9px;border:1px solid #334155;border-radius:8px;background:#020617;color:#e2e8f0}.quote-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}.quote-grid>div{display:flex;flex-direction:column;gap:4px;padding:10px;border-radius:8px;background:#020617}.quote-grid span,.business-card small,.help-text{color:#94a3b8;font-size:10px}.help-text{line-height:1.5}.business-card{position:relative;margin-top:10px;padding:12px;border:1px solid #334155;border-radius:9px;background:#020617}.business-card>div:first-child{display:flex;justify-content:space-between;gap:10px}.status-pill{display:inline-flex;margin-top:8px;padding:4px 7px;border-radius:999px;background:#1e293b;font-size:10px}.debt-summary{display:flex;justify-content:space-between;margin:16px 0;padding:12px;border-radius:8px;background:#1e293b}.loan-actions{display:flex;justify-content:space-between;align-items:center;gap:8px}.loan-card.defaulted{border-color:#991b1b}.loan-card.paid{opacity:.7}.payment-row{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid #1e293b;font-size:10px}.secondary-action{padding:7px 9px}@media(max-width:950px){.business-layout{grid-template-columns:1fr}.quote-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.form-grid,.loan-grid,.quote-grid{grid-template-columns:1fr}}
</style>
