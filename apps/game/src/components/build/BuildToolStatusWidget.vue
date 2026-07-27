<template>
  <aside class="build-tool-status" aria-live="polite">
    <div>
      <span>Outil</span>
      <strong>{{ toolLabel }}</strong>
      <small v-if="state.selectedDefinitionKey">{{ state.selectedDefinitionKey }} · rotation {{ state.rotation * 90 }}°</small>
    </div>
    <p v-if="validation && !validation.valid" class="invalid">{{ validation.message }}</p>
  </aside>
</template>

<script setup lang="ts">
import type { BuildToolState, PlacementValidationResult } from '@market-tycoon/build-mode'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

const state = reactive<BuildToolState>({ activeTool: 'select', rotation: 0 })
const validation = ref<PlacementValidationResult | null>(null)

const toolLabel = computed(() => ({
  select: 'Sélection',
  place: 'Placement',
  move: 'Déplacement',
  remove: 'Suppression',
  rotate: 'Rotation',
  wall: 'Mur',
  room: 'Pièce',
  floor: 'Sol',
  fill: 'Remplissage',
} as Record<BuildToolState['activeTool'], string>)[state.activeTool])

function handleTool(event: Event) {
  Object.assign(state, (event as CustomEvent<BuildToolState>).detail)
  validation.value = null
}

function handleValidation(event: Event) {
  validation.value = (event as CustomEvent<PlacementValidationResult>).detail
}

onMounted(() => {
  window.addEventListener('market-tycoon:build-tool-changed', handleTool)
  window.addEventListener('market-tycoon:placement-validation', handleValidation)
})

onBeforeUnmount(() => {
  window.removeEventListener('market-tycoon:build-tool-changed', handleTool)
  window.removeEventListener('market-tycoon:placement-validation', handleValidation)
})
</script>

<style scoped>
.build-tool-status {
  position: fixed;
  left: 18px;
  bottom: 132px;
  z-index: 940;
  width: min(300px, calc(100vw - 36px));
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, .28);
  border-radius: 12px;
  background: rgba(15, 23, 42, .9);
  color: #f8fafc;
  backdrop-filter: blur(8px);
}
.build-tool-status span, .build-tool-status small { display: block; color: #94a3b8; }
.build-tool-status strong { display: block; margin-top: 2px; }
.build-tool-status small { margin-top: 2px; font-size: 11px; }
.build-tool-status p { margin: 8px 0 0; font-size: 12px; }
.build-tool-status .invalid { color: #fca5a5; }
</style>
