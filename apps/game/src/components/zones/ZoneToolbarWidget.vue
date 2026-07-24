<template>
  <Teleport to=".category-toolbar">
    <button class="category-cursor-button" :class="{ active: cursorActive }" title="Mode sélection" @click="selectCursor">
      <span class="category-icon">↖</span>
      <span><strong>Curseur</strong><small>Sélectionner et inspecter</small></span>
      <span class="category-chevron">›</span>
    </button>
  </Teleport>

  <section class="zone-widget" :class="{ open, invalid: validation.issues.length }">
    <button class="zone-trigger" :class="{ active: toolMode === 'zone' }" @click="open = !open"><span>{{ validation.issues.length ? '⚠️' : '🗺️' }}</span><span><strong>Zones</strong><small>{{ paintedCells }} cellule(s) · {{ validationLabel }}</small></span></button>
    <div v-if="open" class="zone-panel">
      <header><div><span class="eyebrow">Construction</span><strong>Définir les espaces</strong></div><button @click="closePanel">×</button></header>
      <p>Choisissez une zone puis peignez directement sur la grille. Clic droit ou gomme pour effacer. Revenez au curseur pour sélectionner un équipement.</p>
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
import { commercialZoneRuntime } from '../../zones/commercialZoneRuntime'
import { storeZoneManager, zoneRuntime } from '../../zones/zoneRuntime'
const props = defineProps<{ progression: ProgressionManager }>()
const access = new ProgressionAccessPolicy(props.progression)
const open = ref(false), revision = ref(0)
const unsubscribeZone = zoneRuntime.subscribe(() => revision.value++)
const unsubscribeCommercialZone = commercialZoneRuntime.subscribe(() => revision.value++)
onBeforeUnmount(() => { unsubscribeZone(); unsubscribeCommercialZone() })
const activeZoneKey = computed(() => { void revision.value; return zoneRuntime.activeZoneKey })
const eraseMode = computed(() => { void revision.value; return zoneRuntime.eraseMode })
const toolMode = computed(() => { void revision.value; return zoneRuntime.toolMode })
const cursorActive = computed(() => { void revision.value; return zoneRuntime.toolMode === 'cursor' && !commercialZoneRuntime.isEditing() })
const validation = computed(() => { void revision.value; return zoneRuntime.validation })
const validationLabel = computed(() => validation.value.issues.length ? `${validation.value.issues.length} alerte(s)` : 'configuration valide')
const visibleZones = computed(() => { void revision.value; return zoneRuntime.definitions.filter(zone => access.isVisible(zone)) })
const summaries = computed(() => { void revision.value; return storeZoneManager.getSummaries() })
const paintedCells = computed(() => { void revision.value; return storeZoneManager.getCells().length })
function select(key: string) { const zone = zoneRuntime.definitions.find(item => item.key === key); if (zone && access.isAccessible(zone)) { commercialZoneRuntime.selectCursor(); zoneRuntime.select(key) } }
function selectEraser() { commercialZoneRuntime.selectCursor(); zoneRuntime.selectEraser() }
function selectCursor() { open.value = false; commercialZoneRuntime.selectCursor(); zoneRuntime.selectCursor() }
function closePanel() { open.value = false; if (zoneRuntime.isEditing()) zoneRuntime.selectCursor() }
function unlockLabel(key?: string) { return key ? `Débloqué avec ${key}` : 'Zone indisponible' }
function color(value: number) { return `#${value.toString(16).padStart(6, '0')}` }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(value) }
</script>
<style scoped>
.category-cursor-button{order:-100}.category-cursor-button.active{border-color:#38bdf8!important;background:rgba(7,89,133,.3)!important}
</style>