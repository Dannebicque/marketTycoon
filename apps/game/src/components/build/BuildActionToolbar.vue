<template>
  <section class="build-bar" aria-label="Barre de construction">
    <div class="build-bar-tools">
      <button
        v-for="tool in tools"
        :key="tool.key"
        type="button"
        :class="{ active: state.activeTool === tool.key }"
        :title="tool.title"
        @click="activate(tool.key)"
      >
        <span>{{ tool.icon }}</span>
        <small>{{ tool.label }}</small>
      </button>
    </div>

    <div class="build-bar-context">
      <strong>{{ toolLabel }}</strong>
      <small v-if="state.selectedDefinitionKey">{{ state.selectedDefinitionKey }} · {{ state.rotation * 90 }}°</small>
      <small v-else>Sélectionnez un outil ou un équipement.</small>
    </div>

    <p v-if="validation && !validation.valid" class="build-bar-warning">{{ validation.message }}</p>

    <label class="build-bar-refund">
      <span>Revente {{ Math.round(refundRate * 100) }} %</span>
      <select v-model="difficulty" title="Difficulté de remboursement à la démolition" @change="changeDifficulty">
        <option value="relaxed">Détendue</option>
        <option value="standard">Standard</option>
        <option value="hard">Difficile</option>
        <option value="expert">Expert</option>
      </select>
    </label>

    <div class="build-bar-history">
      <button type="button" :disabled="history.undoCount === 0" :title="undoTitle" @click="undo">↶</button>
      <button type="button" :disabled="history.redoCount === 0" :title="redoTitle" @click="redo">↷</button>
      <small>{{ historyStatus }}</small>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { BuildDifficulty, BuildHistorySnapshot, BuildToolKind, BuildToolState, PlacementValidationResult } from '@market-tycoon/build-mode'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

const storedDifficulty = localStorage.getItem('market-tycoon.build-difficulty')
const initialDifficulty: BuildDifficulty = storedDifficulty === 'relaxed' || storedDifficulty === 'hard' || storedDifficulty === 'expert' ? storedDifficulty : 'standard'
const rates: Record<BuildDifficulty, number> = { relaxed: 1, standard: .6, hard: .35, expert: 0 }

const state = reactive<BuildToolState>({ activeTool: 'select', rotation: 0 })
const history = reactive<BuildHistorySnapshot>({ undoCount: 0, redoCount: 0 })
const validation = ref<PlacementValidationResult | null>(null)
const difficulty = ref<BuildDifficulty>(initialDifficulty)
const refundRate = ref(rates[initialDifficulty])

const tools: Array<{ key: BuildToolKind; icon: string; label: string; title: string }> = [
  { key: 'select', icon: '↖', label: 'Sélection', title: 'Sélectionner et configurer un équipement' },
  { key: 'move', icon: '✥', label: 'Déplacer', title: 'Sélectionner puis déplacer un équipement' },
  { key: 'remove', icon: '⌫', label: 'Supprimer', title: 'Supprimer un équipement en cliquant dessus' },
]

const toolLabel = computed(() => ({
  select: 'Sélection', place: 'Placement', move: 'Déplacement', remove: 'Suppression', rotate: 'Rotation', wall: 'Mur', room: 'Pièce', floor: 'Sol', fill: 'Remplissage',
} as Record<BuildToolKind, string>)[state.activeTool])
const undoTitle = computed(() => history.nextUndoLabel ? `Annuler : ${history.nextUndoLabel}` : 'Rien à annuler')
const redoTitle = computed(() => history.nextRedoLabel ? `Rétablir : ${history.nextRedoLabel}` : 'Rien à rétablir')
const historyStatus = computed(() => history.nextUndoLabel ? history.nextUndoLabel : 'Aucune modification')

function activate(tool: BuildToolKind) {
  window.dispatchEvent(new CustomEvent('market-tycoon:build-tool-activate', { detail: { tool } }))
}
function undo() { window.dispatchEvent(new Event('market-tycoon:build-undo')) }
function redo() { window.dispatchEvent(new Event('market-tycoon:build-redo')) }
function changeDifficulty() {
  refundRate.value = rates[difficulty.value]
  window.dispatchEvent(new CustomEvent('market-tycoon:build-difficulty-change', { detail: { difficulty: difficulty.value } }))
}
function handleTool(event: Event) {
  Object.assign(state, (event as CustomEvent<BuildToolState>).detail)
  validation.value = null
}
function handleHistory(event: Event) { Object.assign(history, (event as CustomEvent<BuildHistorySnapshot>).detail) }
function handleValidation(event: Event) { validation.value = (event as CustomEvent<PlacementValidationResult>).detail }
function handleRefundPolicy(event: Event) {
  const detail = (event as CustomEvent<{ difficulty: BuildDifficulty; refundRate: number }>).detail
  if (!detail) return
  difficulty.value = detail.difficulty
  refundRate.value = detail.refundRate
}

onMounted(() => {
  window.addEventListener('market-tycoon:build-tool-changed', handleTool)
  window.addEventListener('market-tycoon:build-history-changed', handleHistory)
  window.addEventListener('market-tycoon:placement-validation', handleValidation)
  window.addEventListener('market-tycoon:demolition-refund-policy', handleRefundPolicy)
})
onBeforeUnmount(() => {
  window.removeEventListener('market-tycoon:build-tool-changed', handleTool)
  window.removeEventListener('market-tycoon:build-history-changed', handleHistory)
  window.removeEventListener('market-tycoon:placement-validation', handleValidation)
  window.removeEventListener('market-tycoon:demolition-refund-policy', handleRefundPolicy)
})
</script>

<style scoped>
.build-bar {
  position: fixed;
  z-index: 970;
  top: 106px;
  left: 220px;
  right: 16px;
  min-height: 54px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 10px;
  border: 1px solid rgba(148, 163, 184, .28);
  border-radius: 14px;
  background: rgba(2, 6, 23, .94);
  color: #e2e8f0;
  box-shadow: 0 14px 38px rgba(0, 0, 0, .3);
  backdrop-filter: blur(12px);
}
.build-bar-tools { display: flex; gap: 6px; }
.build-bar-tools button {
  min-width: 74px;
  padding: 6px 9px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: #cbd5e1;
  cursor: pointer;
}
.build-bar-tools button span, .build-bar-tools button small { display: block; }
.build-bar-tools button span { font-size: 17px; }
.build-bar-tools button small { margin-top: 2px; font-size: 10px; }
.build-bar-tools button:hover { background: rgba(51, 65, 85, .72); }
.build-bar-tools button.active { border-color: #38bdf8; background: rgba(14, 116, 144, .42); color: #f8fafc; }
.build-bar-context { min-width: 150px; display: flex; flex-direction: column; }
.build-bar-context strong { font-size: 12px; }
.build-bar-context small, .build-bar-history small { margin-top: 2px; color: #94a3b8; font-size: 10px; }
.build-bar-warning { min-width: 0; flex: 1; margin: 0; color: #fca5a5; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.build-bar-refund { min-width: 112px; padding-left: 10px; border-left: 1px solid rgba(148, 163, 184, .2); }
.build-bar-refund span { display: block; margin-bottom: 3px; color: #86efac; font-size: 9px; text-transform: uppercase; }
.build-bar-refund select { width: 100%; padding: 4px 6px; border: 1px solid #334155; border-radius: 7px; background: #0f172a; color: #e2e8f0; font-size: 10px; }
.build-bar-history { display: grid; grid-template-columns: 36px 36px minmax(100px, 190px); gap: 6px; align-items: center; }
.build-bar-history button { height: 34px; border: 1px solid #334155; border-radius: 8px; background: #1e293b; color: #f8fafc; font-size: 19px; cursor: pointer; }
.build-bar-history button:disabled { opacity: .35; cursor: not-allowed; }
.build-bar-history small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 1000px) {
  .build-bar { left: 16px; overflow-x: auto; }
  .build-bar-warning, .build-bar-history small { display: none; }
}
</style>
