<template>
  <div class="management-content marketing-layout">
    <section class="promotion-form">
      <div class="panel-heading"><div><span class="eyebrow">Marketing</span><h2>Nouvelle promotion</h2></div><strong>Jour {{ day }}</strong></div>
      <label>Produit<select v-model="form.productKey"><option v-for="product in products" :key="product.key" :value="product.key">{{ product.name }}</option></select></label>
      <div class="form-grid">
        <label>Type<select v-model="form.type"><option value="percentage">Remise (%)</option><option value="fixed-price">Prix imposé</option></select></label>
        <label>{{ form.type === 'percentage' ? 'Remise' : 'Prix promo' }}<input v-model.number="form.value" type="number" min="0.01" step="0.01" /></label>
        <label>Début<input v-model.number="form.startDay" type="number" min="1" step="1" /></label>
        <label>Fin<input v-model.number="form.endDay" type="number" :min="form.startDay" step="1" /></label>
      </div>
      <div v-if="preview" class="promotion-preview">
        <div><span>Prix normal</span><strong>{{ money(preview.regularPrice) }}</strong></div>
        <div><span>Prix promotionnel</span><strong>{{ money(preview.effectivePrice) }}</strong></div>
        <div><span>Marge unitaire estimée</span><strong :class="preview.margin >= 0 ? 'positive-text' : 'negative-text'">{{ money(preview.margin) }}</strong></div>
      </div>
      <p v-if="preview?.margin < 0" class="form-error">Cette promotion vendrait le produit à perte.</p>
      <button class="panel-action" :disabled="!canSubmit" @click="schedule">Programmer la promotion</button>
    </section>

    <section>
      <div class="panel-heading"><div><span class="eyebrow">Campagnes</span><h2>Promotions</h2></div><strong>{{ activeCount }} active(s)</strong></div>
      <div v-if="!promotions.length" class="empty-state">Aucune promotion programmée.</div>
      <article v-for="promotion in promotions" :key="promotion.id" class="promotion-card" :class="status(promotion)">
        <div class="promotion-title"><div><strong>{{ productName(promotion.productKey) }}</strong><small>{{ promotion.id }} · J{{ promotion.startDay }} à J{{ promotion.endDay }}</small></div><span>{{ statusLabel(status(promotion)) }}</span></div>
        <div class="promotion-values"><span>{{ promotion.type === 'percentage' ? `-${promotion.value}%` : money(promotion.value) }}</span><strong>{{ money(priceFor(promotion).effectivePrice) }}</strong></div>
        <button v-if="status(promotion) === 'active' || status(promotion) === 'scheduled'" class="danger-action" @click="cancel(promotion.id)">Annuler</button>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { PRODUCTS, type ProductDefinition } from '@market-tycoon/catalog'
import { promotionManager, type ProductPromotion, type PromotionType } from '@market-tycoon/economy'
import { computed, reactive, ref } from 'vue'
import { persistPromotions } from '../../promotions/installPromotions'

const props = defineProps<{ day: number }>()
const products = PRODUCTS
const version = ref(0)
const form = reactive({ productKey: products[0]?.key ?? '', type: 'percentage' as PromotionType, value: 10, startDay: props.day, endDay: props.day + 2 })
const promotions = computed(() => { void version.value; return promotionManager.getPromotions().sort((a, b) => b.createdAt - a.createdAt) })
const selectedProduct = computed<ProductDefinition | undefined>(() => products.find(item => item.key === form.productKey))
const preview = computed(() => {
  const product = selectedProduct.value
  if (!product) return undefined
  const effectivePrice = form.type === 'percentage' ? product.salePrice * (1 - form.value / 100) : Math.min(product.salePrice, form.value)
  return { regularPrice: product.salePrice, effectivePrice, margin: effectivePrice - product.purchasePrice }
})
const canSubmit = computed(() => Boolean(form.productKey && form.value > 0 && form.endDay >= form.startDay))
const activeCount = computed(() => promotions.value.filter(item => status(item) === 'active').length)

function schedule() {
  if (!canSubmit.value) return
  const promotion = promotionManager.schedule({ ...form })
  if (!promotion) return
  persistPromotions(); version.value += 1
}
function cancel(id: string) { if (promotionManager.cancel(id)) { persistPromotions(); version.value += 1 } }
function status(promotion: ProductPromotion) { return promotionManager.getStatus(promotion, props.day) }
function priceFor(promotion: ProductPromotion) { return promotionManager.getPrice(products.find(item => item.key === promotion.productKey) ?? products[0], Math.max(props.day, promotion.startDay)) }
function productName(key: string) { return products.find(item => item.key === key)?.name ?? key }
function statusLabel(value: string) { return value === 'active' ? 'Active' : value === 'scheduled' ? 'Programmée' : value === 'finished' ? 'Terminée' : 'Annulée' }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value || 0) }
</script>

<style scoped>
.marketing-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.9fr);gap:20px;align-items:start}.promotion-form,.promotion-card{padding:16px;border:1px solid #1e293b;border-radius:12px;background:#0f172a}.promotion-form label{display:flex;flex-direction:column;gap:6px;margin-top:12px;color:#cbd5e1;font-size:11px}.promotion-form input,.promotion-form select{padding:9px;border:1px solid #334155;border-radius:8px;background:#020617;color:#e2e8f0}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.promotion-preview{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.promotion-preview div{display:flex;flex-direction:column;gap:4px;padding:10px;border-radius:8px;background:#020617}.promotion-preview span,.promotion-card small{color:#94a3b8;font-size:10px}.promotion-card{margin-top:10px}.promotion-card.active{border-color:#166534}.promotion-card.scheduled{border-color:#1d4ed8}.promotion-title,.promotion-values{display:flex;justify-content:space-between;gap:12px;align-items:center}.promotion-title>div{display:flex;flex-direction:column;gap:3px}.promotion-title>span{padding:4px 7px;border-radius:999px;background:#1e293b;font-size:10px}.promotion-values{margin:12px 0}.promotion-values span{font-size:20px;font-weight:900;color:#fbbf24}.danger-action{padding:8px 10px;border:1px solid #7f1d1d;border-radius:8px;background:rgba(127,29,29,.22);color:#fecaca;cursor:pointer}@media(max-width:900px){.marketing-layout{grid-template-columns:1fr}.promotion-preview{grid-template-columns:1fr}.form-grid{grid-template-columns:1fr}}
</style>
