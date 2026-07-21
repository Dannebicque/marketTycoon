<template>
  <div class="management-content employees-layout">
    <section>
      <div class="panel-heading"><div><span class="eyebrow">Équipe</span><h2>Employés recrutés</h2></div><strong>{{ money(payroll) }}/jour</strong></div>
      <div v-if="!employees.length" class="empty-state">Aucun employé recruté.</div>
      <article v-for="employee in employees" :key="employee.id" class="employee-card">
        <div class="employee-main"><span class="employee-icon">{{ role(employee.roleKey)?.icon }}</span><div><strong>{{ employee.firstName }} {{ employee.lastName }}</strong><small>{{ role(employee.roleKey)?.name }} · qualité {{ employee.quality }}/100</small></div></div>
        <div class="quality-meter"><span :style="{ width: `${employee.quality}%` }" /></div>
        <div class="employee-task" :class="{ working: employee.status === 'working' }">
          <span>{{ employee.status === 'working' ? 'En tâche' : 'Statut' }}</span>
          <strong>{{ employee.currentTask?.label ?? (employee.assignedBuildingId ? 'Affecté' : 'Disponible') }}</strong>
        </div>
        <div class="employee-meta"><span>{{ money(employee.dailySalary) }}/jour</span><span>{{ employee.completedTasks ?? 0 }} tâche(s)</span></div>
        <select v-if="employee.roleKey === 'cashier'" :value="employee.assignedBuildingId ?? ''" @change="$emit('assign', employee.id, ($event.target as HTMLSelectElement).value || undefined)">
          <option value="">Non affecté</option>
          <option v-for="checkout in checkouts" :key="checkout.id" :value="checkout.id">{{ checkout.buildingName }}</option>
        </select>
        <button class="danger-action" @click="$emit('dismiss', employee.id)">Licencier</button>
      </article>
    </section>

    <section>
      <div class="panel-heading"><div><span class="eyebrow">Recrutement</span><h2>Candidats</h2></div><button class="secondary-action" @click="$emit('refresh-candidates')">Renouveler</button></div>
      <article v-for="candidate in candidates" :key="candidate.id" class="candidate-card">
        <div class="employee-main"><span class="employee-icon">{{ role(candidate.roleKey)?.icon }}</span><div><strong>{{ candidate.firstName }} {{ candidate.lastName }}</strong><small>{{ role(candidate.roleKey)?.name }}</small></div></div>
        <p>{{ role(candidate.roleKey)?.description }}</p>
        <div class="employee-meta"><span>Qualité {{ candidate.quality }}/100</span><strong>{{ money(candidate.dailySalary) }}/jour</strong></div>
        <button class="panel-action" @click="$emit('hire', candidate.id)">Recruter</button>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { EmployeeRoleDefinition } from '@market-tycoon/catalog'
import type { EmployeeState } from '../../game/employees/employeeTypes'
const props = defineProps<{ employees: EmployeeState[]; candidates: EmployeeState[]; roles: EmployeeRoleDefinition[]; checkouts: any[]; payroll: number }>()
defineEmits<{ hire: [candidateId: string]; dismiss: [employeeId: string]; assign: [employeeId: string, buildingId?: string]; 'refresh-candidates': [] }>()
function role(key: string) { return props.roles.find(item => item.key === key) }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0) }
</script>

<style scoped>
.employees-layout { display:grid; grid-template-columns:1fr 1fr; gap:20px; align-items:start; }
.employee-card,.candidate-card { margin-top:10px; padding:14px; border:1px solid #1e293b; border-radius:12px; background:#0f172a; }
.employee-main { display:flex; align-items:center; gap:12px; }
.employee-main > div { display:flex; flex-direction:column; gap:3px; }
.employee-main small,.candidate-card p { color:#94a3b8; font-size:11px; line-height:1.45; }
.employee-icon { display:grid; width:38px; height:38px; place-items:center; border-radius:10px; background:#1e293b; font-size:20px; }
.quality-meter { height:7px; margin:12px 0; overflow:hidden; border-radius:999px; background:#1e293b; }
.quality-meter span { display:block; height:100%; background:linear-gradient(90deg,#f59e0b,#4ade80); }
.employee-task { margin:8px 0; padding:8px 10px; display:flex; justify-content:space-between; gap:12px; border:1px solid #334155; border-radius:8px; background:#020617; font-size:11px; }
.employee-task span { color:#94a3b8; }
.employee-task.working { border-color:#166534; background:rgba(22,101,52,.18); }
.employee-task.working strong { color:#86efac; }
.employee-meta { display:flex; justify-content:space-between; gap:12px; margin:8px 0; color:#cbd5e1; font-size:11px; }
.employee-card select { width:100%; margin:8px 0; padding:8px; border:1px solid #334155; border-radius:8px; background:#020617; color:#e2e8f0; }
.danger-action { padding:8px 10px; border:1px solid #7f1d1d; border-radius:8px; background:rgba(127,29,29,.22); color:#fecaca; cursor:pointer; }
@media (max-width:900px) { .employees-layout { grid-template-columns:1fr; } }
</style>
