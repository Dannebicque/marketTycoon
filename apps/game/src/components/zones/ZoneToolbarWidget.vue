<template>
  <section class="zone-widget" :class="{ open }">
    <button class="zone-trigger" @click="open = !open">
      <span>🗺️</span><span><strong>Zones</strong><small>{{ paintedCells }} cellule(s) définie(s)</small></span>
    </button>
    <div v-if="open" class="zone-panel">
      <header><div><span class="eyebrow">Construction</span><strong>Définir les espaces</strong></div><button @click="close">×</button></header>
      <p>Choisissez une zone puis peignez directement sur la grille. Clic droit ou gomme pour effacer.</p>
      <div class="zone-grid">
        <button v-for="zone in visibleZones" :key="zone.key" :class="{ active: activeZoneKey === zone.key }" @click="select(zone.key)">
          <i :style="{ backgroundColor: color(zone.color) }" />
          <span><strong>{{ zone.icon }} {{ zone.name }}</strong><small>{{ zone.description }}</small></span>
        </button>
        <button :class="{ active: eraseMode }" @click="selectEraser"><i class="eraser">×</i><span><strong>Gomme</strong><small>Retirer une zone peinte</small></span></button>
      </div>
      <div class="zone-summary" v-if="summaries.length">
        <div v-for="summary in summaries" :key="summary.key"><span>{{ summary.icon }} {{ summary.name }}</span><strong>{{ summary.area }} cases</strong><small>{{ money(summary.costs.total) }}/j</small></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { storeZoneManager, zoneRuntime } from '../../zones/zoneRuntime'

const open = ref(false)
const revision = ref(0)
const unsubscribe = zoneRuntime.subscribe(() => revision.value++)
onBeforeUnmount(unsubscribe)
const activeZoneKey = computed(() => { void revision.value; return zoneRuntime.activeZoneKey })
const eraseMode = computed(() => { void revision.value; return zoneRuntime.eraseMode })
const visibleZones = computed(() => { void revision.value; return zoneRuntime.definitions })
const summaries = computed(() => { void revision.value; return storeZoneManager.getSummaries() })
const paintedCells = computed(() => { void revision.value; return storeZoneManager.getCells().length })
function select(key: string) { zoneRuntime.select(key) }
function selectEraser() { zoneRuntime.selectEraser() }
function close() { open.value = false; zoneRuntime.close() }
function color(value: number) { return `#${value.toString(16).padStart(6, '0')}` }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(value) }
</script>
