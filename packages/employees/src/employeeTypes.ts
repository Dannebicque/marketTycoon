import type { EmployeeRoleKey } from '@market-tycoon/catalog'

export type { EmployeeRoleDefinition, EmployeeRoleKey } from '@market-tycoon/catalog'
export type EmployeeStatus = 'available' | 'assigned' | 'working'
export type EmployeeTaskType = 'idle' | 'checkout' | 'restocking' | 'repairing' | 'receiving' | 'cleaning'
export type EmployeeWorkTaskStatus = 'pending' | 'assigned' | 'completed' | 'cancelled'

export interface EmployeeTaskState {
  taskId?: string
  type: EmployeeTaskType
  label: string
  priority?: number
  targetBuildingId?: string
  targetCompartmentId?: string
  startedAt?: number
}

export interface EmployeeWorkTaskInput {
  type: Exclude<EmployeeTaskType, 'idle' | 'checkout'>
  label: string
  priority?: number
  requiredRoleKey: EmployeeRoleKey
  targetBuildingId?: string
  targetCompartmentId?: string
  dedupeKey?: string
  createdAt?: number
}

export interface EmployeeWorkTask extends EmployeeWorkTaskInput {
  id: string
  priority: number
  createdAt: number
  status: EmployeeWorkTaskStatus
  assignedEmployeeId?: string
  startedAt?: number
  completedAt?: number
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
