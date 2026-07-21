export type EmployeeRoleKey = string

export interface EmployeeRoleDefinition {
  key: EmployeeRoleKey
  name: string
  description: string
  icon: string
  baseDailySalary: number
  qualityRange: [number, number]
  skills: string[]
  order: number
}

export interface EmployeeState {
  id: string
  firstName: string
  lastName: string
  roleKey: EmployeeRoleKey
  quality: number
  dailySalary: number
  status: 'available' | 'assigned'
  assignedBuildingId?: string
  hiredDay: number
}

export function defineEmployeeRole<T extends EmployeeRoleDefinition>(definition: T): T { return definition }
