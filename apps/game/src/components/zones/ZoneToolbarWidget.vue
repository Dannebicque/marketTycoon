<template>
  <section class="zone-widget" :class="{ open, invalid: validation.issues.length }">
    <button class="zone-trigger" @click="open = !open"><span>{{ validation.issues.length ? '⚠️' : '🗺️' }}</span><span><strong>Zones</strong><small>{{ paintedCells }} cellule(s) · {{ validationLabel }}</small></span></button>
    <div v-if="open" class="zone-panel">
      <header><div><span class="eyebrow">Construction</span><strong>Définir les espaces</strong></div><button @click="close">×</button></header>
      <p>Choisissez une zone puis peignez directement sur la grille. Clic droit ou gomme pour effacer.</p>
      <div class="zone-grid">
        <button v-for="zone in visibleZones" :key="zone.key" :disabled="!access.isAccessible(zone)" :class="{ active: activeZoneKey === zone.key, locked: !access.isAccessible(zone) }" @click="select(zone.key)">
          <i :style="{ backgroundColor: access.isAccessible(zone) ? color(zone.color) : '#334155' }" />
          <span><strong>{{ access.isAccessible(zone) ? zone.icon : '🔒' }} {{ zone.name }}</strong><small>{{ access.isAccessible(zone) ? zone.description : unlockLabel(zone.requiredUnlockKey) }}</small></span>
        </button>
        <button :class="{ active: eraseMode }" @click="selectEraser"><i class="eraser">×</i><span><strong>Gomme</strong><small>Retirer une zone peinte</small></span></button>
      </div>
      <div v-if="validation.issues.length" class="zone-validation">
        <strong>⚠️ {{ validation.issues.length }} problème(s) à corriger</strong>
        <ul><li v-for="(issue, index) in validation.issues" :key="`${issue.zoneKey}-${issue.component}-${issue.code}-${index}`">{{ issue.message }}</li></ul>
      </div>
      <div class="zone-summary" v-if="summaries.length"><div v-for="summary in summaries" :key="summary.key"><span>{{ summary.icon }} {{ summary.name }}</span><strong>{{ summary.area }} cases</strong><small>{{ money(summary.costs.total) }}/j</small></div></div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ProgressionAccessPolicy, type ProgressionManager } from '@market-tycoon/progression'
import { storeZoneManager, zoneRuntime } from '../../zones/zoneRuntime'
const props = defineProps<{ progression: ProgressionManager }>()
const access = new ProgressionAccessPolicy(props.progression)
const open = ref(false), revision = ref(0)
const unsubscribe = zoneRuntime.subscribe(() => revision.value++)
onBeforeUnmount(unsubscribe)
const activeZoneKey = computed(() => { void revision.value; return zoneRuntime.activeZoneKey })
const eraseMode = computed(() => { void revision.value; return zoneRuntime.eraseMode })
const validation = computed(() => { void revision.value; return zoneRuntime.validation })
const validationLabel = computed(() => validation.value.issues.length ? `${validation.value.issues.length} alerte(s)` : 'configuration valide')
const visibleZones = computed(() => { void revision.value; return zoneRuntime.definitions.filter(zone => access.isVisible(zone)) })
const summaries = computed(() => { void revision.value; return storeZoneManager.getSummaries() })
const paintedCells = computed(() => { void revision.value; return storeZoneManager.getCells().length })
function select(key: string) { const zone = zoneRuntime.definitions.find(item => item.key === key); if (zone && access.isAccessible(zone)) zoneRuntime.select(key) }
function selectEraser() { zoneRuntime.selectEraser() }
function close() { open.value = false; zoneRuntime.close() }
function unlockLabel(key?: string) { return key ? `Débloqué avec ${key}` : 'Zone indisponible' }
function color(value: number) { return `#${value.toString(16).padStart(6, '0')}` }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(value) }
</script>
