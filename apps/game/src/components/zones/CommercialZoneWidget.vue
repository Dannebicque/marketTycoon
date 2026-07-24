<template>
  <section class="commercial-zone-widget" :class="{ open }">
    <button class="commercial-zone-trigger" :class="{ active: editing }" @click="open = !open"><span>🏷️</span><span><strong>Secteurs</strong><small>{{ zones.length }} zone(s) commerciale(s)</small></span></button>
    <div v-if="open" class="commercial-zone-panel">
      <header><div><span class="eyebrow">Merchandising</span><strong>Zones commerciales</strong></div><button @click="close">×</button></header>
      <p>Créez une zone, puis peignez ses cellules sur la grille. Un même secteur peut posséder plusieurs zones physiques.</p>
      <div class="sector-create">
        <select v-model="sectorKey" @keydown.stop><option v-for="sector in definitions" :key="sector.key" :value="sector.key">{{ sector.icon }} {{ sector.name }}</option></select>
        <input v-model="zoneName" placeholder="Nom de la zone" @keydown.stop @keyup.enter="createZone" />
        <button @click="createZone">Créer</button>
      </div>
      <div class="custom-sector">
        <input v-model="customName" placeholder="Nouveau secteur personnalisé" @keydown.stop @keyup.enter="createSector" />
        <button @click="createSector">Ajouter le secteur</button>
      </div>
      <div class="commercial-zone-list">
        <button v-for="zone in zones" :key="zone.id" :class="{ active: activeZoneId === zone.id }" @click="select(zone.id)">
          <i :style="{ backgroundColor: color(definition(zone.sectorKey)?.color ?? 0x64748b) }" />
          <span><strong>{{ definition(zone.sectorKey)?.icon }} {{ zone.name }}</strong><small>{{ definition(zone.sectorKey)?.name }} · {{ zone.cells.length }} case(s)</small></span>
          <b @click.stop="remove(zone.id)">×</b>
        </button>
        <button :class="{ active: eraseMode }" @click="selectEraser"><i class="eraser">×</i><span><strong>Gomme</strong><small>Retirer des cellules commerciales</small></span></button>
      </div>
      <button class="commercial-cursor" @click="selectCursor">Terminer le dessin</button>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { commercialZoneRuntime } from '../../zones/commercialZoneRuntime'
import { zoneRuntime } from '../../zones/zoneRuntime'
const open = ref(false), revision = ref(0), zoneName = ref(''), customName = ref('')
const definitions = computed(() => { void revision.value; return commercialZoneRuntime.definitions })
const zones = computed(() => { void revision.value; return commercialZoneRuntime.zones })
const sectorKey = ref(definitions.value[0]?.key ?? '')
const activeZoneId = computed(() => { void revision.value; return commercialZoneRuntime.activeZoneId })
const eraseMode = computed(() => { void revision.value; return commercialZoneRuntime.eraseMode })
const editing = computed(() => { void revision.value; return commercialZoneRuntime.isEditing() })
const unsubscribe = commercialZoneRuntime.subscribe(() => revision.value++)
onBeforeUnmount(unsubscribe)
function createZone() { if (!sectorKey.value) return; const zone = commercialZoneRuntime.createZone(sectorKey.value, zoneName.value); if (zone) { zoneRuntime.selectCursor(); zoneName.value = '' } }
function createSector() { if (!customName.value.trim()) return; const sector = commercialZoneRuntime.createCustomSector(customName.value.trim()); sectorKey.value = sector.key; customName.value = '' }
function select(id: string) { zoneRuntime.selectCursor(); commercialZoneRuntime.select(id) }
function selectEraser() { zoneRuntime.selectCursor(); commercialZoneRuntime.selectEraser() }
function selectCursor() { commercialZoneRuntime.selectCursor() }
function remove(id: string) { commercialZoneRuntime.deleteZone(id) }
function close() { open.value = false; commercialZoneRuntime.selectCursor() }
function definition(key: string) { return definitions.value.find(item => item.key === key) }
function color(value: number) { return `#${value.toString(16).padStart(6, '0')}` }
</script>
<style scoped>
.commercial-zone-widget{position:fixed;left:418px;bottom:18px;z-index:2200}.commercial-zone-trigger{min-width:190px;display:flex;align-items:center;gap:9px;padding:10px 13px;border:1px solid #334155;border-radius:13px;background:rgba(2,6,23,.94);box-shadow:0 14px 38px rgba(0,0,0,.35);color:#e2e8f0;cursor:pointer}.commercial-zone-trigger span:first-child{font-size:24px}.commercial-zone-trigger strong,.commercial-zone-trigger small{display:block;text-align:left}.commercial-zone-trigger small{color:#94a3b8;font-size:9px}.commercial-zone-trigger.active{border-color:#a78bfa;background:rgba(76,29,149,.3)}.commercial-zone-panel{position:absolute;left:0;bottom:58px;width:380px;padding:14px;border:1px solid #334155;border-radius:14px;background:#0b1120;box-shadow:0 20px 50px #020617}.commercial-zone-panel header{display:flex;justify-content:space-between}.commercial-zone-panel p{color:#94a3b8;font-size:11px;line-height:1.5}.sector-create,.custom-sector{display:grid;grid-template-columns:1fr 1fr auto;gap:6px;margin-bottom:8px}.custom-sector{grid-template-columns:1fr auto}.sector-create input,.sector-create select,.custom-sector input{min-width:0;padding:7px;border:1px solid #334155;border-radius:7px;background:#111827;color:#e2e8f0}.sector-create button,.custom-sector button,.commercial-cursor{border:0;border-radius:7px;background:#4f46e5;color:white;padding:7px 10px}.commercial-zone-list{display:grid;gap:6px;max-height:280px;overflow:auto}.commercial-zone-list>button{display:grid;grid-template-columns:12px 1fr auto;align-items:center;gap:8px;padding:8px;border:1px solid #1e293b;border-radius:8px;background:#111827;color:#e2e8f0;text-align:left}.commercial-zone-list>button.active{border-color:#a78bfa;background:#312e81}.commercial-zone-list i{width:10px;height:28px;border-radius:4px}.commercial-zone-list strong,.commercial-zone-list small{display:block}.commercial-zone-list small{color:#94a3b8;font-size:9px}.commercial-zone-list b{padding:4px 7px}.commercial-cursor{width:100%;margin-top:10px;background:#334155}.eraser{display:grid!important;place-items:center;background:#ef4444!important;color:white}@media(max-width:1050px){.commercial-zone-widget{left:418px}}@media(max-width:800px){.commercial-zone-widget{left:210px}.commercial-zone-trigger{min-width:150px}.commercial-zone-panel{left:auto;right:0;width:min(380px,calc(100vw - 24px))}}
</style>