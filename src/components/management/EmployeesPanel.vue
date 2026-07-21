<template>
  <div class="management-content employees-layout">
    <section>
      <div class="panel-heading"><div><span class="eyebrow">Équipe</span><h2>Employés recrutés</h2></div><strong>{{ money(payroll) }}/jour</strong></div>
      <div v-if="!employees.length" class="empty-state">Aucun employé recruté.</div>
      <article v-for="employee in employees" :key="employee.id" class="employee-card">
        <div class="employee-main"><span class="employee-icon">{{ role(employee.roleKey)?.icon }}</span><div><strong>{{ employee.firstName }} {{ employee.lastName }}</strong><small>{{ role(employee.roleKey)?.name }} · qualité {{ employee.quality }}/100</small></div></div>
        <div class="quality-meter"><span :style="{ width: `${employee.quality}%` }" /></div>
        <div class="employee-meta"><span>{{ money(employee.dailySalary) }}/jour</span><span>{{ employee.assignedBuildingId ? 'Affecté' : 'Disponible' }}</span></div>
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
import type { EmployeeRoleDefinition, EmployeeState } from '../../game/employees/employeeTypes'
const props = defineProps<{ employees: EmployeeState[]; candidates: EmployeeState[]; roles: EmployeeRoleDefinition[]; checkouts: any[]; payroll: number }>()
defineEmits<{ hire: [candidateId: string]; dismiss: [employeeId: string]; assign: [employeeId: string, buildingId?: string]; 'refresh-candidates': [] }>()
function role(key: string) { return props.roles.find(item => item.key === key) }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0) }
</script>
