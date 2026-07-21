import type { EmployeeRoleDefinition } from '../employees/employeeTypes'

interface EmployeeRoleModule { default: EmployeeRoleDefinition }
const modules = import.meta.glob<EmployeeRoleModule>('./employees/*.employee.ts', { eager: true })

const registry = new Map<string, EmployeeRoleDefinition>()
for (const [filename, module] of Object.entries(modules)) {
  const role = module.default
  if (!role.key || !role.name || role.baseDailySalary <= 0) throw new Error(`${filename} : définition de rôle invalide.`)
  if (registry.has(role.key)) throw new Error(`Rôle employé dupliqué : ${role.key}`)
  registry.set(role.key, role)
}

export const EMPLOYEE_ROLES = [...registry.values()].sort((a, b) => a.order - b.order)
export function getEmployeeRole(key: string) { return registry.get(key) }
