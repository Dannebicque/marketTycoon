<template>
  <aside v-if="parcel" class="parcel-widget" aria-live="polite">
    <div>
      <span class="parcel-eyebrow">Terrain</span>
      <strong>{{ parcel.name }}</strong>
      <small>{{ usageLabel(parcel.usage) }} · {{ accessLabel(parcel.access) }}</small>
    </div>
    <div v-if="parcel.price && parcel.access === 'for-sale'" class="parcel-price">{{ money(parcel.price) }}</div>
    <button v-if="canPurchase" type="button" @click="purchase">Acheter</button>
    <button v-else-if="canExpand" type="button" class="extension-button" @click="expand">Construire l’extension · {{ money(extensionCost) }}</button>
    <span v-else class="parcel-state">{{ stateMessage }}</span>
    <p v-if="message" :class="['parcel-message', { error: !success }]">{{ message }}</p>
  </aside>
</template>

<script setup lang="ts">
import type { ParcelAccess, ParcelDefinition, ParcelUsage } from '@market-tycoon/world-map'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type SelectedParcel = ParcelDefinition & { access: ParcelAccess }

const parcel = ref<SelectedParcel | null>(null)
const canPurchase = ref(false)
const canExpand = ref(false)
const extensionCost = ref(0)
const message = ref('')
const success = ref(true)

const stateMessage = computed(() => {
  if (!parcel.value) return ''
  if (parcel.value.access === 'owned') return parcel.value.usage === 'parking' ? 'Terrain possédé · usage extérieur' : 'Terrain possédé'
  if (parcel.value.access === 'locked') return 'Débloqué plus tard'
  if (parcel.value.access === 'reserved') return 'Réservé à une évolution'
  if (parcel.value.access === 'public') return 'Espace public'
  if (parcel.value.access === 'unavailable') return 'Non disponible'
  return 'Achat indisponible'
})

function handleSelected(event: Event) {
  const detail = (event as CustomEvent<{ parcel: SelectedParcel | null; canPurchase: boolean; canExpand: boolean; extensionCost: number }>).detail
  parcel.value = detail?.parcel ?? null
  canPurchase.value = detail?.canPurchase ?? false
  canExpand.value = detail?.canExpand ?? false
  extensionCost.value = detail?.extensionCost ?? 0
  message.value = ''
}

function handleActionResult(event: Event) {
  const detail = (event as CustomEvent<{ success: boolean; parcelId: string; message: string }>).detail
  if (!detail || detail.parcelId !== parcel.value?.id) return
  success.value = detail.success
  message.value = detail.message
}

function purchase() {
  if (!parcel.value) return
  window.dispatchEvent(new CustomEvent('market-tycoon:parcel-purchase-request', { detail: { parcelId: parcel.value.id } }))
}

function expand() {
  if (!parcel.value) return
  window.dispatchEvent(new CustomEvent('market-tycoon:building-extension-request', { detail: { parcelId: parcel.value.id } }))
}

function money(value: number) { return `${value.toLocaleString('fr-FR')} €` }
function usageLabel(usage: ParcelUsage) {
  return ({ store: 'Magasin', parking: 'Parking', service: 'Logistique', commercial: 'Extension commerciale', landscape: 'Paysage', infrastructure: 'Infrastructure' } as Record<ParcelUsage, string>)[usage]
}
function accessLabel(access: ParcelAccess) {
  return ({ owned: 'possédé', 'for-sale': 'à vendre', locked: 'verrouillé', public: 'public', reserved: 'réservé', unavailable: 'indisponible' } as Record<ParcelAccess, string>)[access]
}

onMounted(() => {
  window.addEventListener('market-tycoon:parcel-selected', handleSelected)
  window.addEventListener('market-tycoon:parcel-action-result', handleActionResult)
})
onBeforeUnmount(() => {
  window.removeEventListener('market-tycoon:parcel-selected', handleSelected)
  window.removeEventListener('market-tycoon:parcel-action-result', handleActionResult)
})
</script>

<style scoped>
.parcel-widget {
  position: fixed;
  right: 18px;
  bottom: 82px;
  z-index: 950;
  display: grid;
  grid-template-columns: minmax(180px, 1fr) auto;
  gap: 10px 16px;
  align-items: center;
  width: min(420px, calc(100vw - 36px));
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, .35);
  border-radius: 14px;
  background: rgba(15, 23, 42, .94);
  color: #f8fafc;
  box-shadow: 0 14px 36px rgba(2, 6, 23, .35);
  backdrop-filter: blur(8px);
}
.parcel-widget strong, .parcel-widget small { display: block; }
.parcel-widget small { margin-top: 3px; color: #cbd5e1; }
.parcel-eyebrow { color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
.parcel-price { font-weight: 700; color: #fde68a; }
.parcel-widget button { border: 0; border-radius: 9px; padding: 9px 13px; background: #facc15; color: #422006; font-weight: 700; cursor: pointer; }
.parcel-widget .extension-button { background: #e2e8f0; color: #0f172a; }
.parcel-state { color: #cbd5e1; font-size: 13px; }
.parcel-message { grid-column: 1 / -1; margin: 0; color: #86efac; font-size: 13px; }
.parcel-message.error { color: #fca5a5; }
</style>
