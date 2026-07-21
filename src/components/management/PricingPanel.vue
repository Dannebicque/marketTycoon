<template>
  <div class="management-content pricing-panel">
    <header class="pricing-header">
      <div><span class="eyebrow">Tarification</span><h2>Prix de vente et marges</h2></div>
      <div class="pricing-summary">
        <span>Marge moyenne</span>
        <strong :class="averageMargin >= 0 ? 'positive-text' : 'negative-text'">{{ percent(averageMargin) }}</strong>
      </div>
    </header>

    <section class="bulk-pricing">
      <div>
        <label class="field-label">Appliquer un coefficient de marge</label>
        <div class="bulk-controls">
          <input v-model.number="bulkMarkup" type="number" min="-99" step="1" />
          <span>% sur le prix d’achat</span>
          <button class="secondary-action" @click="applyBulk">Appliquer à tous</button>
        </div>
      </div>
      <p>Exemple : 50 % transforme un coût d’achat de 2 € en prix de vente de 3 €.</p>
    </section>

    <div class="pricing-table-wrap">
      <table class="pricing-table">
        <thead><tr><th>Produit</th><th>Achat</th><th>Prix conseillé</th><th>Prix magasin</th><th>Marge/unité</th><th>Taux de marge</th><th>Taux de marque</th><th>État</th></tr></thead>
        <tbody>
          <tr v-for="line in lines" :key="line.productKey" :class="{ loss: line.isLossLeader }">
            <td><strong>{{ line.name }}</strong><small>{{ line.category }}</small></td>
            <td>{{ money(line.purchasePrice) }}</td>
            <td>{{ money(line.recommendedPrice) }}</td>
            <td><input :value="line.salePrice" type="number" min="0.01" step="0.01" @change="changePrice(line.productKey, $event)" /></td>
            <td :class="line.unitMargin >= 0 ? 'positive-text' : 'negative-text'">{{ money(line.unitMargin) }}</td>
            <td>{{ percent(line.markupRate) }}</td>
            <td>{{ percent(line.marginRate) }}</td>
            <td><span class="pricing-status" :class="line.isLossLeader ? 'danger' : line.markupRate < .1 ? 'warning' : 'success'">{{ line.isLossLeader ? 'Vente à perte' : line.markupRate < .1 ? 'Marge faible' : 'Rentable' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface PricingLine {
  productKey: string
  name: string
  category: string
  purchasePrice: number
  recommendedPrice: number
  salePrice: number
  unitMargin: number
  markupRate: number
  marginRate: number
  isLossLeader: boolean
}

const props = defineProps<{ lines: PricingLine[] }>()
const emit = defineEmits<{ 'update-price': [productKey: string, salePrice: number]; 'apply-markup': [markupRate: number] }>()
const bulkMarkup = ref(35)
const averageMargin = computed(() => props.lines.length ? props.lines.reduce((sum, line) => sum + line.markupRate, 0) / props.lines.length : 0)

function changePrice(productKey: string, event: Event) {
  emit('update-price', productKey, Number((event.target as HTMLInputElement).value))
}
function applyBulk() { emit('apply-markup', Number(bulkMarkup.value) / 100) }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value || 0) }
function percent(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 }).format(value || 0) }
</script>

<style scoped>
.pricing-header { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; }
.pricing-header h2 { margin:4px 0 0; font-size:22px; }
.pricing-summary { min-width:150px; padding:12px; border:1px solid #1e293b; border-radius:10px; background:#0f172a; text-align:right; }
.pricing-summary span { display:block; color:#94a3b8; font-size:10px; }
.pricing-summary strong { display:block; margin-top:4px; font-size:20px; }
.bulk-pricing { margin:18px 0; padding:14px; border:1px solid #1e293b; border-radius:12px; background:#0f172a; }
.bulk-controls { display:flex; align-items:center; gap:8px; }
.bulk-controls input { width:90px; padding:8px; border:1px solid #334155; border-radius:8px; background:#020617; color:#e2e8f0; }
.bulk-pricing p { margin:8px 0 0; color:#94a3b8; font-size:11px; }
.pricing-table-wrap { overflow:auto; border:1px solid #1e293b; border-radius:12px; }
.pricing-table { width:100%; border-collapse:collapse; min-width:980px; background:#0f172a; }
.pricing-table th,.pricing-table td { padding:10px; border-bottom:1px solid #1e293b; text-align:right; font-size:11px; }
.pricing-table th:first-child,.pricing-table td:first-child { text-align:left; }
.pricing-table th { position:sticky; top:0; background:#111827; color:#94a3b8; }
.pricing-table td strong,.pricing-table td small { display:block; }
.pricing-table td small { margin-top:3px; color:#64748b; }
.pricing-table input { width:92px; padding:7px; border:1px solid #334155; border-radius:7px; background:#020617; color:#f8fafc; text-align:right; }
.pricing-table tr.loss { background:rgba(127,29,29,.12); }
.pricing-status { display:inline-flex; padding:4px 7px; border-radius:999px; font-size:9px; font-weight:700; }
.pricing-status.success { background:rgba(22,101,52,.3); color:#bbf7d0; }
.pricing-status.warning { background:rgba(146,64,14,.3); color:#fde68a; }
.pricing-status.danger { background:rgba(127,29,29,.35); color:#fecaca; }
</style>
