export type EmployeeRoleKey = string
export type EmployeeStatus = 'available' | 'assigned' | 'working'
export type EmployeeTaskType = 'idle' | 'checkout' | 'restocking' | 'repairing'

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

export interface EmployeeTaskState {
  type: EmployeeTaskType
  label: string
  targetBuildingId?: string
  startedAt?: number
}

export interface EmployeeState {
  id: string
  firstName: string
  lastName: string
  roleKey: EmployeeRoleKey
  quality: number
  dailySalary: number
  status: EmployeeStatus
  assignedBuildingId?: string
  currentTask?: EmployeeTaskState
  completedTasks?: number
  hiredDay: number
}

export function defineEmployeeRole<T extends EmployeeRoleDefinition>(definition: T): T { return definition }
