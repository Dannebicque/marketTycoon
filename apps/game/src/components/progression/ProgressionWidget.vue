<template>
  <section class="progression-widget" :class="{ open }" aria-label="Progression de l’enseigne">
    <button class="progression-brand-card" type="button" :aria-expanded="open" @click="open = !open">
      <span class="progression-brand-emblem">🏪</span>
      <span class="progression-brand-copy">
        <small>Votre enseigne</small>
        <strong>{{ currentLevel?.title ?? 'Commerce en développement' }}</strong>
        <span class="progression-stars" :aria-label="`${level} étoile(s) sur ${maxStars}`">
          <i v-for="star in maxStars" :key="star" :class="{ active: star <= level }">★</i>
        </span>
        <span class="progression-mini-track"><i :style="{ width: `${levelProgress}%` }" /></span>
        <span class="progression-brand-next">
          <template v-if="nextLevel">{{ levelProgress }} % vers {{ nextLevel.title }}</template>
          <template v-else>Enseigne au rang maximal</template>
        </span>
      </span>
      <span class="progression-card-chevron">{{ open ? '›' : '‹' }}</span>
    </button>

    <Transition name="progression-panel">
      <div v-if="open" class="progression-panel" role="dialog" aria-modal="false" aria-label="Missions de progression">
        <header class="progression-panel-header">
          <div class="progression-level-icon">🏪</div>
          <div>
            <span class="eyebrow">Rang {{ level }} · {{ starLabel }}</span>
            <h2>{{ currentLevel?.title ?? 'Votre enseigne' }}</h2>
            <p>{{ currentLevel?.description }}</p>
          </div>
          <button class="progression-close" type="button" aria-label="Fermer la progression" @click="open = false">×</button>
        </header>

        <div class="progression-overview">
          <div class="progression-overview-copy"><strong>{{ levelProgress }} %</strong><span>vers le prochain rang</span></div>
          <div class="progression-main-track" aria-hidden="true"><i :style="{ width: `${levelProgress}%` }" /></div>
          <span>{{ completedCurrent }}/{{ currentObjectives.length }} missions</span>
        </div>

        <div class="progression-section-heading">
          <div><span class="eyebrow">Développement de l’enseigne</span><h3>Missions en cours</h3></div>
          <span class="progression-xp">{{ completedCurrent === currentObjectives.length ? '🏆' : '⭐' }} {{ completedCurrent }} / {{ currentObjectives.length }}</span>
        </div>

        <div v-if="currentObjectives.length" class="progression-objectives">
          <article v-for="objective in currentObjectives" :key="objective.key" class="progression-objective" :class="{ completed: objective.completed }">
            <div class="progression-objective-status">{{ objective.completed ? '✓' : objectiveIcon(objective.metric) }}</div>
            <div class="progression-objective-body">
              <div class="progression-objective-title">
                <strong>{{ objective.title }}</strong>
                <span>{{ formatMetric(objective.value, objective.metric) }} / {{ formatMetric(objective.target, objective.metric) }}</span>
              </div>
              <p>{{ objective.description }}</p>
              <div class="progression-objective-track"><i :style="{ width: `${objectivePercent(objective)}%` }" /></div>
              <small>{{ objective.completed ? 'Mission accomplie' : `${objectivePercent(objective)} % accompli` }}</small>
            </div>
          </article>
        </div>
        <p v-else class="progression-empty">Toutes les missions de ce rang sont accomplies.</p>

        <section class="progression-rewards">
          <div class="progression-section-heading compact">
            <div><span class="eyebrow">Récompenses</span><h3>{{ nextLevel ? 'Prochains déblocages' : 'Sommet atteint' }}</h3></div>
          </div>
          <div v-if="nextLevel?.unlockKeys?.length" class="progression-unlocks">
            <span v-for="unlock in nextLevel.unlockKeys" :key="unlock">🔓 {{ formatUnlock(unlock) }}</span>
          </div>
          <p v-else-if="nextLevel" class="progression-empty compact">Le prochain rang améliore votre prestige.</p>
        </section>

        <footer class="progression-next-level">
          <div class="progression-next-icon">{{ nextLevel ? '🚀' : '🏆' }}</div>
          <div v-if="nextLevel">
            <span>Prochaine évolution</span>
            <strong>{{ nextLevel.title }}</strong>
            <small>{{ nextLevel.description }}</small>
          </div>
          <div v-else>
            <span>Progression maximale</span>
            <strong>Votre enseigne est devenue une référence.</strong>
          </div>
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
const maxStars = computed(() => Math.max(5, Math.min(7, props.progression.getLevels().length)))
const starLabel = computed(() => `${level.value} étoile${level.value > 1 ? 's' : ''}`)
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

function formatUnlock(value: string) {
  return value.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

onMounted(() => { refreshTimer = window.setInterval(() => { revision.value += 1 }, 250) })
onBeforeUnmount(() => { if (refreshTimer) window.clearInterval(refreshTimer) })
</script>
