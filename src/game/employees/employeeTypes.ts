import type { EmployeeRoleKey } from '@market-tycoon/catalog'

export type { EmployeeRoleKey } from '@market-tycoon/catalog'
export type EmployeeStatus = 'available' | 'assigned' | 'working'
export type EmployeeTaskType = 'idle' | 'checkout' | 'restocking' | 'repairing'

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
