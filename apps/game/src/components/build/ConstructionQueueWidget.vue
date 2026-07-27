<template>
  <aside v-if="visibleOrders.length" class="construction-queue" aria-label="Chantiers">
    <header>
      <strong>Chantiers</strong>
      <span>{{ activeCount }} actif(s)</span>
    </header>
    <article v-for="order in visibleOrders" :key="order.id">
      <div>
        <strong>{{ order.label }}</strong>
        <small>{{ statusLabel(order.status) }} · {{ order.cost.toLocaleString('fr-FR') }} €</small>
      </div>
      <progress :max="100" :value="progress(order)"></progress>
    </article>
  </aside>
</template>

<script setup lang="ts">
import type { ConstructionOrder, ConstructionOrderStatus } from '@market-tycoon/construction'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const orders = ref<ConstructionOrder[]>([])
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined

const visibleOrders = computed(() => orders.value.slice(-4).reverse())
const activeCount = computed(() => orders.value.filter(order => order.status === 'planned' || order.status === 'building').length)

function statusLabel(status: ConstructionOrderStatus) {
  return ({ planned: 'Planifié', building: 'En cours', completed: 'Terminé', cancelled: 'Annulé' } as const)[status]
}

function progress(order: ConstructionOrder) {
  if (order.status === 'completed') return 100
  if (order.status === 'cancelled' || order.status === 'planned' || !order.startedAt) return 0
  return Math.min(99, Math.max(1, ((now.value - order.startedAt) / Math.max(1, order.durationMs)) * 100))
}

function handleOrders(event: Event) {
  orders.value = (event as CustomEvent<{ orders: ConstructionOrder[] }>).detail?.orders ?? []
  now.value = Date.now()
}

onMounted(() => {
  window.addEventListener('market-tycoon:construction-orders-changed', handleOrders)
  timer = setInterval(() => { now.value = Date.now() }, 100)
})

onBeforeUnmount(() => {
  window.removeEventListener('market-tycoon:construction-orders-changed', handleOrders)
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.construction-queue { position:fixed; z-index:965; right:16px; bottom:16px; width:min(360px,calc(100vw - 32px)); padding:12px; border:1px solid rgba(148,163,184,.28); border-radius:14px; background:rgba(2,6,23,.94); color:#e2e8f0; box-shadow:0 14px 38px rgba(0,0,0,.3); backdrop-filter:blur(12px); }
header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
header strong { font-size:13px; } header span { color:#94a3b8; font-size:10px; }
article { display:grid; grid-template-columns:1fr 84px; gap:10px; align-items:center; padding:8px 0; border-top:1px solid rgba(148,163,184,.14); }
article:first-of-type { border-top:0; }
article strong, article small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
article strong { font-size:11px; } article small { margin-top:3px; color:#94a3b8; font-size:9px; }
progress { width:84px; height:8px; accent-color:#38bdf8; }
</style>
