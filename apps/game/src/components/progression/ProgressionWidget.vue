<template>
  <section class="progression-widget" :class="{ open }" aria-label="Progression du magasin">
    <button class="progression-badge" type="button" :aria-expanded="open" @click="open = !open">
      <span class="progression-level-medal">{{ level }}</span>
      <span class="progression-badge-copy">
        <small>Niveau {{ level }}</small>
        <strong>{{ currentLevel?.title ?? 'Progression' }}</strong>
        <span class="progression-mini-track"><i :style="{ width: `${levelProgress}%` }" /></span>
      </span>
      <span class="progression-badge-score">{{ completedCurrent }}/{{ currentObjectives.length }}</span>
    </button>

    <Transition name="progression-panel">
      <div v-if="open" class="progression-panel" role="dialog" aria-modal="false" aria-label="Objectifs de progression">
        <header class="progression-panel-header">
          <div class="progression-level-icon">🏪</div>
          <div>
            <span class="eyebrow">Niveau {{ level }}</span>
            <h2>{{ currentLevel?.title ?? 'Votre magasin' }}</h2>
            <p>{{ currentLevel?.description }}</p>
          </div>
          <button class="progression-close" type="button" aria-label="Fermer la progression" @click="open = false">×</button>
        </header>

        <div class="progression-overview">
          <div class="progression-overview-copy"><strong>{{ levelProgress }} %</strong><span>du niveau accompli</span></div>
          <div class="progression-main-track" aria-hidden="true"><i :style="{ width: `${levelProgress}%` }" /></div>
          <span>{{ completedCurrent }} objectif{{ completedCurrent > 1 ? 's' : '' }} sur {{ currentObjectives.length }}</span>
        </div>

        <div class="progression-section-heading">
          <div><span class="eyebrow">Défis en cours</span><h3>Objectifs du niveau</h3></div>
          <span class="progression-xp">⭐ {{ completedCurrent }} / {{ currentObjectives.length }}</span>
        </div>

        <div v-if="currentObjectives.length" class="progression-objectives">
          <article v-for="objective in currentObjectives" :key="objective.key" class="progression-objective" :class="{ completed: objective.completed }">
            <div class="progression-objective-status">{{ objective.completed ? '✓' : objectiveIcon(objective.metric) }}</div>
            <div class="progression-objective-body">
              <div class="progression-objective-title"><strong>{{ objective.title }}</strong><span>{{ formatMetric(objective.value, objective.metric) }} / {{ formatMetric(objective.target, objective.metric) }}</span></div>
              <p>{{ objective.description }}</p>
              <div class="progression-objective-track"><i :style="{ width: `${objectivePercent(objective)}%` }" /></div>
            </div>
          </article>
        </div>
        <p v-else class="progression-empty">Tous les objectifs de ce niveau sont accomplis.</p>

        <footer class="progression-next-level">
          <div class="progression-next-icon">{{ nextLevel ? '🔓' : '🏆' }}</div>
          <div v-if="nextLevel"><span>Prochaine étape</span><strong>Niveau {{ nextLevel.level }} · {{ nextLevel.title }}</strong><small v-if="nextLevel.unlockKeys?.length">Débloque : {{ nextLevel.unlockKeys.join(' · ') }}</small></div>
          <div v-else><span>Progression maximale</span><strong>Votre enseigne a atteint le sommet !</strong></div>
        </footer>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import type { ProgressionManager, ProgressionMetric, ProgressionObjectiveState } from '@market-tycoon/progression'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{ progression: ProgressionManager }>()
const open = ref(false)
const revision = ref(0)
let refreshTimer: number | undefined

const level = computed(() => { revision.value; return props.progression.getLevel() })
const currentLevel = computed(() => { revision.value; return props.progression.getLevelDefinition() })
const nextLevel = computed(() => { revision.value; return props.progression.getNextLevelDefinition() })
const currentObjectives = computed(() => { revision.value; return props.progression.getCurrentObjectives() })
const completedCurrent = computed(() => currentObjectives.value.filter(objective => objective.completed).length)
const levelProgress = computed(() => {
  if (!currentObjectives.value.length) return 100
  return Math.round(currentObjectives.value.reduce((sum, objective) => sum + objectivePercent(objective), 0) / currentObjectives.value.length)
})

function objectivePercent(objective: ProgressionObjectiveState) {
  if (objective.completed) return 100
  if (objective.target <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((objective.value / objective.target) * 100)))
}

function objectiveIcon(metric: ProgressionMetric) {
  const icons: Partial<Record<ProgressionMetric, string>> = {
    'customers-entered': '🚶', 'customers-served': '🛒', 'customers-lost': '🚪', revenue: '💶',
    'buildings-placed': '🧱', 'employees-hired': '👷', 'days-completed': '📅',
  }
  return icons[metric] ?? '🎯'
}

function formatMetric(value: number, metric: ProgressionMetric) {
  if (metric === 'revenue') return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value)
}

onMounted(() => { refreshTimer = window.setInterval(() => { revision.value += 1 }, 250) })
onBeforeUnmount(() => { if (refreshTimer) window.clearInterval(refreshTimer) })
</script>
