<template>
  <div class="management-content">
    <EmployeeTasksPanel :tasks="tasks" :employees="employees" :roles="roles" :buildings="buildings" @select-employee="selectEmployee" />

    <div class="employees-layout">
      <section>
        <div class="panel-heading"><div><span class="eyebrow">Équipe</span><h2>Employés recrutés</h2></div><strong>{{ money(payroll) }}/jour</strong></div>
        <div v-if="!employees.length" class="empty-state">Aucun employé recruté.</div>
        <article v-for="employee in employees" :key="employee.id" class="employee-card" :class="{ selected: employee.id === selectedEmployeeId }" @click="selectEmployee(employee.id)">
          <div class="employee-main"><span class="employee-icon">{{ role(employee.roleKey)?.icon }}</span><div><strong>{{ employee.firstName }} {{ employee.lastName }}</strong><small>{{ role(employee.roleKey)?.name }} · qualité {{ employee.quality }}/100</small></div></div>
          <div class="quality-meter"><span :style="{ width: `${employee.quality}%` }" /></div>
          <div class="employee-task" :class="{ working: employee.status === 'working' }">
            <span>{{ employee.status === 'working' ? 'En tâche' : 'Statut' }}</span>
            <strong>{{ employee.currentTask?.label ?? (employee.assignedBuildingId ? 'Affecté' : 'Disponible') }}</strong>
          </div>
          <div class="employee-meta"><span>{{ money(employee.dailySalary) }}/jour</span><span>{{ employee.completedTasks ?? 0 }} tâche(s)</span></div>
        </article>
      </section>

      <section v-if="selectedEmployee" class="employee-sheet">
        <header class="sheet-header">
          <div class="employee-main"><span class="employee-icon large">{{ role(selectedEmployee.roleKey)?.icon }}</span><div><span class="eyebrow">Fiche employé</span><h2>{{ selectedEmployee.firstName }} {{ selectedEmployee.lastName }}</h2><small>{{ role(selectedEmployee.roleKey)?.name }}</small></div></div>
          <button class="close-sheet" @click="selectEmployee(undefined)">×</button>
        </header>

        <div class="sheet-kpis">
          <article><span>Qualité</span><strong>{{ selectedEmployee.quality }}/100</strong></article>
          <article><span>Salaire</span><strong>{{ money(selectedEmployee.dailySalary) }}/j</strong></article>
          <article><span>Ancienneté</span><strong>J{{ selectedEmployee.hiredDay }}</strong></article>
          <article><span>Tâches</span><strong>{{ selectedEmployee.completedTasks ?? 0 }}</strong></article>
        </div>

        <div class="sheet-section">
          <h3>Situation actuelle</h3>
          <dl class="detail-list">
            <div><dt>Statut</dt><dd>{{ statusLabel(selectedEmployee.status) }}</dd></div>
            <div><dt>Affectation</dt><dd>{{ assignedBuildingName(selectedEmployee.assignedBuildingId) }}</dd></div>
            <div><dt>Mission</dt><dd>{{ selectedEmployee.currentTask?.label ?? 'Disponible' }}</dd></div>
            <div v-if="selectedEmployee.currentTask?.priority !== undefined"><dt>Priorité</dt><dd>P{{ selectedEmployee.currentTask.priority }}</dd></div>
          </dl>
          <div v-if="selectedEmployee.currentTask" class="active-task-card">
            <strong>{{ selectedEmployee.currentTask.label }}</strong>
            <span>{{ taskTypeLabel(selectedEmployee.currentTask.type) }} · depuis {{ elapsed(selectedEmployee.currentTask.startedAt) }}</span>
          </div>
        </div>

        <div class="sheet-section">
          <h3>Affectation</h3>
          <select v-if="selectedEmployee.roleKey === 'cashier'" :value="selectedEmployee.assignedBuildingId ?? ''" @change="$emit('assign', selectedEmployee.id, ($event.target as HTMLSelectElement).value || undefined)">
            <option value="">Non affecté</option>
            <option v-for="checkout in checkouts" :key="checkout.id" :value="checkout.id">{{ checkout.buildingName }}</option>
          </select>
          <p v-else class="role-description">{{ role(selectedEmployee.roleKey)?.description }}</p>
        </div>

        <div class="sheet-section">
          <h3>Historique récent</h3>
          <div v-if="!selectedEmployeeTasks.length" class="empty-state compact">Aucune tâche enregistrée.</div>
          <article v-for="task in selectedEmployeeTasks" :key="task.id" class="history-task">
            <div><strong>{{ task.label }}</strong><span :class="task.status">{{ taskStatusLabel(task.status) }}</span></div>
            <small>{{ taskTypeLabel(task.type) }} · {{ targetLabel(task.targetBuildingId) }} · P{{ task.priority }}</small>
          </article>
        </div>

        <button class="danger-action" @click.stop="$emit('dismiss', selectedEmployee.id)">Licencier cet employé</button>
      </section>

      <section v-else>
        <div class="panel-heading"><div><span class="eyebrow">Recrutement</span><h2>Candidats</h2></div><button class="secondary-action" @click="$emit('refresh-candidates')">Renouveler</button></div>
        <article v-for="candidate in candidates" :key="candidate.id" class="candidate-card">
          <div class="employee-main"><span class="employee-icon">{{ role(candidate.roleKey)?.icon }}</span><div><strong>{{ candidate.firstName }} {{ candidate.lastName }}</strong><small>{{ role(candidate.roleKey)?.name }}</small></div></div>
          <p>{{ role(candidate.roleKey)?.description }}</p>
          <div class="employee-meta"><span>Qualité {{ candidate.quality }}/100</span><strong>{{ money(candidate.dailySalary) }}/jour</strong></div>
          <button class="panel-action" @click="$emit('hire', candidate.id)">Recruter</button>
        </article>

        <div v-if="lockedRoles.length" class="locked-roles">
          <div class="panel-heading locked-heading"><div><span class="eyebrow">À découvrir</span><h2>Métiers à débloquer</h2></div><span>🔒</span></div>
          <article v-for="lockedRole in lockedRoles" :key="lockedRole.key" class="candidate-card locked-role-card">
            <div class="employee-main"><span class="employee-icon">🔒</span><div><strong>{{ lockedRole.name }}</strong><small>{{ lockedRole.icon }} Métier indisponible</small></div></div>
            <p>{{ lockedRole.description }}</p>
            <div class="unlock-condition">{{ unlockLabel(lockedRole.requiredUnlockKey) }}</div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EmployeeRoleDefinition } from '@market-tycoon/catalog'
import type { EmployeeState, EmployeeWorkTask } from '@market-tycoon/employees'
import { computed } from 'vue'
import EmployeeTasksPanel from './EmployeeTasksPanel.vue'

const props = defineProps<{ employees: EmployeeState[]; candidates: EmployeeState[]; roles: EmployeeRoleDefinition[]; checkouts: any[]; buildings: any[]; payroll: number; tasks: EmployeeWorkTask[]; selectedEmployeeId?: string }>()
const emit = defineEmits<{ hire: [candidateId: string]; dismiss: [employeeId: string]; assign: [employeeId: string, buildingId?: string]; 'refresh-candidates': []; 'select-employee': [employeeId?: string] }>()
const selectedEmployee = computed(() => props.employees.find(employee => employee.id === props.selectedEmployeeId))
const selectedEmployeeTasks = computed(() => props.tasks.filter(task => task.assignedEmployeeId === props.selectedEmployeeId).sort((a, b) => (b.completedAt ?? b.startedAt ?? b.createdAt) - (a.completedAt ?? a.startedAt ?? a.createdAt)).slice(0, 10))
const lockedRoles = computed(() => {
  const candidateRoleKeys = new Set(props.candidates.map(candidate => candidate.roleKey))
  return props.roles.filter(item => item.requiredUnlockKey && !candidateRoleKeys.has(item.key))
})
function selectEmployee(employeeId?: string) { emit('select-employee', employeeId) }
function role(key: string) { return props.roles.find(item => item.key === key) }
function assignedBuildingName(id?: string) { return id ? props.buildings.find(item => item.id === id)?.buildingName ?? 'Équipement affecté' : 'Aucune affectation fixe' }
function targetLabel(id?: string) { return id ? props.buildings.find(item => item.id === id)?.buildingName ?? 'Équipement' : 'Magasin' }
function statusLabel(status: string) { return status === 'working' ? 'En intervention' : status === 'assigned' ? 'À son poste' : 'Disponible' }
function taskStatusLabel(status: string) { return status === 'completed' ? 'Terminée' : status === 'assigned' ? 'En cours' : status === 'pending' ? 'En attente' : 'Annulée' }
function taskTypeLabel(type: string) { return ({ restocking: 'Réassort', repairing: 'Maintenance', receiving: 'Réception', cleaning: 'Nettoyage', checkout: 'Caisse', idle: 'Disponibilité' } as Record<string, string>)[type] ?? type }
function elapsed(timestamp?: number) { if (!timestamp) return 'à l’instant'; const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000)); return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)} min` }
function unlockLabel(key?: string) {
  const labels: Record<string, string> = {
    'core-store': 'Accessible dès l’ouverture du magasin',
    'cold-chain': 'Débloqué avec la chaîne du froid',
    'advanced-logistics': 'Débloqué avec la logistique avancée',
    marketing: 'Débloqué avec le marketing',
    automation: 'Débloqué avec l’automatisation',
  }
  return key ? labels[key] ?? `Déblocage requis : ${key}` : 'Disponible'
}
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0) }
</script>

<style scoped>
.employees-layout { display:grid; grid-template-columns:1fr 1fr; gap:20px; align-items:start; margin-top:20px; }
.employee-card,.candidate-card { margin-top:10px; padding:14px; border:1px solid #1e293b; border-radius:12px; background:#0f172a; }
.employee-card { cursor:pointer; transition:.15s ease; }
.employee-card:hover,.employee-card.selected { border-color:#3b82f6; transform:translateY(-1px); }
.employee-main { display:flex; align-items:center; gap:12px; }
.employee-main > div { display:flex; flex-direction:column; gap:3px; }
.employee-main small,.candidate-card p,.role-description { color:#94a3b8; font-size:11px; line-height:1.45; }
.employee-icon { display:grid; width:38px; height:38px; place-items:center; border-radius:10px; background:#1e293b; font-size:20px; }
.employee-icon.large { width:48px; height:48px; font-size:25px; }
.quality-meter { height:7px; margin:12px 0; overflow:hidden; border-radius:999px; background:#1e293b; }
.quality-meter span { display:block; height:100%; background:linear-gradient(90deg,#f59e0b,#4ade80); }
.employee-task { margin:8px 0; padding:8px 10px; display:flex; justify-content:space-between; gap:12px; border:1px solid #334155; border-radius:8px; background:#020617; font-size:11px; }
.employee-task span { color:#94a3b8; }
.employee-task.working { border-color:#166534; background:rgba(22,101,52,.18); }
.employee-task.working strong { color:#86efac; }
.employee-meta { display:flex; justify-content:space-between; gap:12px; margin:8px 0; color:#cbd5e1; font-size:11px; }
.employee-sheet { position:sticky; top:0; padding:16px; border:1px solid #334155; border-radius:14px; background:#0b1220; }
.sheet-header { display:flex; justify-content:space-between; gap:12px; }
.sheet-header h2 { margin:2px 0; }
.close-sheet { align-self:start; border:0; background:transparent; color:#94a3b8; font-size:24px; cursor:pointer; }
.sheet-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:16px 0; }
.sheet-kpis article { padding:9px; border:1px solid #1e293b; border-radius:9px; background:#020617; }
.sheet-kpis span { display:block; color:#64748b; font-size:9px; }
.sheet-kpis strong { font-size:12px; }
.sheet-section { margin-top:16px; padding-top:14px; border-top:1px solid #1e293b; }
.sheet-section h3 { margin:0 0 10px; font-size:12px; }
.detail-list div { display:flex; justify-content:space-between; gap:12px; padding:6px 0; border-bottom:1px solid rgba(51,65,85,.45); font-size:10px; }
.detail-list dt { color:#94a3b8; }
.detail-list dd { margin:0; font-weight:800; text-align:right; }
.active-task-card { margin-top:10px; padding:10px; border:1px solid #166534; border-radius:9px; background:rgba(22,101,52,.16); }
.active-task-card strong,.active-task-card span { display:block; }
.active-task-card span { margin-top:4px; color:#86efac; font-size:9px; }
.employee-sheet select { width:100%; padding:8px; border:1px solid #334155; border-radius:8px; background:#020617; color:#e2e8f0; }
.history-task { padding:9px 0; border-bottom:1px solid #1e293b; }
.history-task div { display:flex; justify-content:space-between; gap:8px; }
.history-task strong { font-size:10px; }
.history-task span { font-size:9px; color:#94a3b8; }
.history-task span.completed { color:#86efac; }
.history-task span.assigned { color:#93c5fd; }
.history-task small { color:#64748b; font-size:9px; }
.danger-action { padding:8px 10px; border:1px solid #7f1d1d; border-radius:8px; background:rgba(127,29,29,.22); color:#fecaca; cursor:pointer; }
.employee-sheet > .danger-action { width:100%; margin-top:18px; }
.locked-roles { margin-top:24px; }
.locked-heading { padding-top:16px; border-top:1px solid #1e293b; }
.locked-role-card { border-style:dashed; border-color:#475569; background:rgba(15,23,42,.58); }
.locked-role-card .employee-icon { background:#111827; filter:grayscale(1); }
.unlock-condition { margin-top:10px; padding:8px 10px; border:1px solid rgba(250,204,21,.22); border-radius:8px; background:rgba(113,63,18,.16); color:#fde68a; font-size:10px; font-weight:800; }
.empty-state.compact { padding:10px; font-size:10px; }
@media (max-width:900px) { .employees-layout { grid-template-columns:1fr; } .employee-sheet { position:static; } .sheet-kpis { grid-template-columns:1fr 1fr; } }
</style>
