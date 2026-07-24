<template>
  <aside class="build-history-widget" aria-label="Historique de construction">
    <button type="button" :disabled="snapshot.undoCount === 0" :title="undoTitle" @click="undo">↶</button>
    <button type="button" :disabled="snapshot.redoCount === 0" :title="redoTitle" @click="redo">↷</button>
    <span>{{ status }}</span>
  </aside>
</template>

<script setup lang="ts">
import type { BuildHistorySnapshot } from '@market-tycoon/build-mode'
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue'

const snapshot = reactive<BuildHistorySnapshot>({ undoCount: 0, redoCount: 0 })
const undoTitle = computed(() => snapshot.nextUndoLabel ? `Annuler : ${snapshot.nextUndoLabel}` : 'Rien à annuler')
const redoTitle = computed(() => snapshot.nextRedoLabel ? `Rétablir : ${snapshot.nextRedoLabel}` : 'Rien à rétablir')
const status = computed(() => snapshot.nextUndoLabel ? `Dernière action : ${snapshot.nextUndoLabel}` : 'Aucune modification')

function update(event: Event) {
  Object.assign(snapshot, (event as CustomEvent<BuildHistorySnapshot>).detail)
}
function undo() { window.dispatchEvent(new Event('market-tycoon:build-undo')) }
function redo() { window.dispatchEvent(new Event('market-tycoon:build-redo')) }

onMounted(() => window.addEventListener('market-tycoon:build-history-changed', update))
onBeforeUnmount(() => window.removeEventListener('market-tycoon:build-history-changed', update))
</script>

<style scoped>
.build-history-widget {
  position: fixed;
  left: 18px;
  bottom: 82px;
  z-index: 940;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, .3);
  border-radius: 12px;
  background: rgba(15, 23, 42, .92);
  color: #cbd5e1;
  backdrop-filter: blur(8px);
}
.build-history-widget button {
  width: 38px;
  height: 34px;
  border: 1px solid rgba(148, 163, 184, .32);
  border-radius: 8px;
  background: #1e293b;
  color: #f8fafc;
  font-size: 20px;
  cursor: pointer;
}
.build-history-widget button:disabled { opacity: .35; cursor: not-allowed; }
.build-history-widget span { max-width: 230px; font-size: 12px; }
</style>
