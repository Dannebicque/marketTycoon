<template>
  <section class="task-board">
    <div class="panel-heading">
      <div><span class="eyebrow">Exploitation</span><h2>Tâches de l'équipe</h2></div>
      <div class="task-kpis"><span>{{ pendingCount }} en attente</span><span>{{ assignedCount }} en cours</span></div>
    </div>

    <div class="task-columns">
      <div>
        <h3>À traiter</h3>
        <div v-if="!pendingTasks.length" class="empty-state compact">Aucune tâche en attente.</div>
        <article v-for="task in pendingTasks" :key="task.id" class="task-card pending">
          <div class="task-title"><strong>{{ task.label }}</strong><span class="priority">P{{ task.priority }}</span></div>
          <small>{{ taskTypeLabel(task.type) }} · {{ roleName(task.requiredRoleKey) }}</small>
          <div class="task-meta"><span>{{ targetLabel(task) }}</span><span>{{ elapsed(task.createdAt) }}</span></div>
        </article>
      </div>

      <div>
        <h3>En cours</h3>
        <div v-if="!assignedTasks.length" class="empty-state compact">Aucune tâche en cours.</div>
        <article v-for="task in assignedTasks" :key="task.id" class="task-card assigned" @click="$emit('select-employee', task.assignedEmployeeId)">
          <div class="task-title"><strong>{{ task.label }}</strong><span class="priority">P{{ task.priority }}</span></div>
          <small>{{ employeeName(task.assignedEmployeeId) }}</small>
          <div class="task-meta"><span>{{ targetLabel(task) }}</span><span>{{ elapsed(task.startedAt ?? task.createdAt) }}</span></div>
        </article>
      </div>

      <div>
        <h3>Terminées récemment</h3>
        <div v-if="!completedTasks.length" class="empty-state compact">Aucune tâche terminée.</div>
        <article v-for="task in completedTasks" :key="task.id" class="task-card completed">
          <div class="task-title"><strong>{{ task.label }}</strong><span>✓</span></div>
          <small>{{ employeeName(task.assignedEmployeeId) }}</small>
          <div class="task-meta"><span>{{ targetLabel(task) }}</span><span>{{ elapsed(task.completedAt ?? task.createdAt) }}</span></div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { EmployeeRoleDefinition } from '@market-tycoon/catalog'
import type { EmployeeState, EmployeeWorkTask } from '@market-tycoon/employees'
import { computed } from 'vue'

const props = defineProps<{ tasks: EmployeeWorkTask[]; employees: EmployeeState[]; roles: EmployeeRoleDefinition[]; buildings: any[] }>()
defineEmits<{ 'select-employee': [employeeId?: string] }>()
const pendingTasks = computed(() => props.tasks.filter(task => task.status === 'pending').sort(sortTasks))
const assignedTasks = computed(() => props.tasks.filter(task => task.status === 'assigned').sort(sortTasks))
const completedTasks = computed(() => props.tasks.filter(task => task.status === 'completed').sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)).slice(0, 8))
const pendingCount = computed(() => pendingTasks.value.length)
const assignedCount = computed(() => assignedTasks.value.length)
function sortTasks(a: EmployeeWorkTask, b: EmployeeWorkTask) { return b.priority - a.priority || a.createdAt - b.createdAt }
function employeeName(id?: string) { const employee = props.employees.find(item => item.id === id); return employee ? `${employee.firstName} ${employee.lastName}` : 'Non affectée' }
function roleName(key: string) { return props.roles.find(role => role.key === key)?.name ?? key }
function targetLabel(task: EmployeeWorkTask) { return props.buildings.find(item => item.id === task.targetBuildingId)?.buildingName ?? (task.targetBuildingId ? 'Équipement' : 'Magasin') }
function taskTypeLabel(type: string) { return ({ restocking: 'Réassort', repairing: 'Maintenance', receiving: 'Réception', cleaning: 'Nettoyage', checkout: 'Caisse', idle: 'Disponibilité' } as Record<string, string>)[type] ?? type }
function elapsed(timestamp: number) { const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000)); if (seconds < 60) return `${seconds}s`; const minutes = Math.floor(seconds / 60); return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h` }
</script>

<style scoped>
.task-board { padding:0 0 20px; border-bottom:1px solid #1e293b; }
.task-kpis { display:flex; gap:8px; flex-wrap:wrap; }
.task-kpis span { padding:6px 9px; border:1px solid #334155; border-radius:999px; background:#020617; color:#cbd5e1; font-size:10px; font-weight:800; }
.task-columns { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
.task-columns h3 { margin:8px 0; color:#cbd5e1; font-size:12px; }
.task-card { margin-top:8px; padding:10px; border:1px solid #334155; border-radius:10px; background:#0f172a; }
.task-card.assigned { border-color:#166534; cursor:pointer; }
.task-card.completed { opacity:.72; }
.task-title,.task-meta { display:flex; justify-content:space-between; gap:8px; }
.task-title strong { font-size:11px; }
.task-card small,.task-meta { margin-top:5px; color:#94a3b8; font-size:9px; }
.priority { color:#fbbf24; font-weight:900; }
.empty-state.compact { padding:10px; font-size:10px; }
@media (max-width:900px) { .task-columns { grid-template-columns:1fr; } }
</style>
