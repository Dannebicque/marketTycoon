<template>
  <nav class="build-action-toolbar" aria-label="Outils de construction">
    <button
      v-for="tool in tools"
      :key="tool.key"
      type="button"
      :class="{ active: activeTool === tool.key }"
      :title="tool.title"
      @click="activate(tool.key)"
    >
      <span>{{ tool.icon }}</span>
      <small>{{ tool.label }}</small>
    </button>
  </nav>
</template>

<script setup lang="ts">
import type { BuildToolKind, BuildToolState } from '@market-tycoon/build-mode'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const activeTool = ref<BuildToolKind>('select')
const tools: Array<{ key: BuildToolKind; icon: string; label: string; title: string }> = [
  { key: 'select', icon: '↖', label: 'Sélection', title: 'Sélectionner et configurer un équipement' },
  { key: 'move', icon: '✥', label: 'Déplacer', title: 'Sélectionner puis déplacer un équipement' },
  { key: 'remove', icon: '⌫', label: 'Supprimer', title: 'Supprimer un équipement en cliquant dessus' },
]

function activate(tool: BuildToolKind) {
  window.dispatchEvent(new CustomEvent('market-tycoon:build-tool-activate', { detail: { tool } }))
}

function handleToolChanged(event: Event) {
  const state = (event as CustomEvent<BuildToolState>).detail
  if (state?.activeTool) activeTool.value = state.activeTool
}

onMounted(() => window.addEventListener('market-tycoon:build-tool-changed', handleToolChanged))
onBeforeUnmount(() => window.removeEventListener('market-tycoon:build-tool-changed', handleToolChanged))
</script>

<style scoped>
.build-action-toolbar {
  position: fixed;
  left: 18px;
  bottom: 150px;
  z-index: 960;
  display: flex;
  gap: 6px;
  padding: 7px;
  border: 1px solid rgba(148, 163, 184, .3);
  border-radius: 12px;
  background: rgba(15, 23, 42, .92);
  backdrop-filter: blur(8px);
}
.build-action-toolbar button {
  min-width: 72px;
  border: 1px solid transparent;
  border-radius: 9px;
  padding: 7px 9px;
  background: transparent;
  color: #cbd5e1;
  cursor: pointer;
}
.build-action-toolbar button span,
.build-action-toolbar button small { display: block; }
.build-action-toolbar button span { font-size: 18px; }
.build-action-toolbar button small { margin-top: 3px; font-size: 11px; }
.build-action-toolbar button:hover { background: rgba(51, 65, 85, .72); }
.build-action-toolbar button.active {
  border-color: #38bdf8;
  background: rgba(14, 116, 144, .42);
  color: #f8fafc;
}
</style>
