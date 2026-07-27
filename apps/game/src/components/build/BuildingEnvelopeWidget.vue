<template>
  <aside class="envelope-widget" aria-label="Qualité de façade">
    <header>
      <strong>Façade</strong>
      <small>{{ metrics.exteriorSegmentCount }} segments extérieurs</small>
    </header>
    <div class="metric">
      <span>Lumière naturelle</span>
      <strong>{{ metrics.daylightScore }} %</strong>
      <progress :value="metrics.daylightScore" max="100" />
    </div>
    <div class="metric">
      <span>Visibilité commerciale</span>
      <strong>{{ metrics.visibilityScore }} %</strong>
      <progress :value="metrics.visibilityScore" max="100" />
    </div>
    <footer>
      <span>{{ metrics.glazedFacadeRatio }} % vitré</span>
      <span>{{ metrics.storefrontCount }} vitrine(s)</span>
    </footer>
  </aside>
</template>

<script setup lang="ts">
import type { BuildingEnvelopeMetrics } from '@market-tycoon/construction'
import { onBeforeUnmount, onMounted, reactive } from 'vue'

const metrics = reactive<BuildingEnvelopeMetrics>({
  segmentCount: 0,
  exteriorSegmentCount: 0,
  glazedSegmentCount: 0,
  storefrontCount: 0,
  daylightScore: 0,
  visibilityScore: 0,
  glazedFacadeRatio: 0,
})

function handleMetrics(event: Event) {
  Object.assign(metrics, (event as CustomEvent<BuildingEnvelopeMetrics>).detail)
}

onMounted(() => {
  window.addEventListener('market-tycoon:building-envelope-changed', handleMetrics)
  window.dispatchEvent(new Event('market-tycoon:building-envelope-request'))
})

onBeforeUnmount(() => window.removeEventListener('market-tycoon:building-envelope-changed', handleMetrics))
</script>

<style scoped>
.envelope-widget { position:fixed; z-index:925; right:16px; bottom:178px; width:220px; padding:12px; border:1px solid rgba(125,211,252,.28); border-radius:14px; background:rgba(2,6,23,.9); color:#e2e8f0; box-shadow:0 12px 30px rgba(0,0,0,.28); backdrop-filter:blur(10px); }
header,footer,.metric { display:flex; align-items:center; justify-content:space-between; gap:8px; } header { margin-bottom:10px; } header strong { font-size:13px; } header small,footer { color:#94a3b8; font-size:9px; }
.metric { display:grid; grid-template-columns:1fr auto; margin-top:8px; font-size:10px; }.metric strong { color:#bae6fd; }.metric progress { grid-column:1/-1; width:100%; height:6px; accent-color:#38bdf8; }
footer { margin-top:10px; padding-top:8px; border-top:1px solid rgba(148,163,184,.18); }
@media (max-width:1000px) { .envelope-widget { display:none; } }
</style>
