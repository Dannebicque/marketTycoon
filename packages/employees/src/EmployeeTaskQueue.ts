import type { EmployeeRoleKey } from '@market-tycoon/catalog'
import type { EmployeeTaskType, EmployeeWorkTask, EmployeeWorkTaskInput } from './employeeTypes'

export class EmployeeTaskQueue {
  private tasks: EmployeeWorkTask[] = []
  private nextTask = 1

  enqueue(input: EmployeeWorkTaskInput): EmployeeWorkTask {
    const duplicate = input.dedupeKey
      ? this.tasks.find(task => task.dedupeKey === input.dedupeKey && task.status !== 'completed' && task.status !== 'cancelled')
      : undefined
    if (duplicate) {
      duplicate.priority = Math.max(duplicate.priority, normalizePriority(input.priority))
      duplicate.label = input.label
      return cloneTask(duplicate)
    }

    const task: EmployeeWorkTask = {
      id: `TASK-${this.nextTask++}`,
      type: input.type,
      label: input.label,
      priority: normalizePriority(input.priority),
      requiredRoleKey: input.requiredRoleKey,
      targetBuildingId: input.targetBuildingId,
      targetCompartmentId: input.targetCompartmentId,
      dedupeKey: input.dedupeKey,
      createdAt: input.createdAt ?? Date.now(),
      status: 'pending',
    }
    this.tasks.push(task)
    return cloneTask(task)
  }

  claim(employeeId: string, roleKey: EmployeeRoleKey): EmployeeWorkTask | undefined {
    const task = this.tasks
      .filter(item => item.status === 'pending' && item.requiredRoleKey === roleKey)
      .sort(compareTasks)[0]
    if (!task) return undefined
    task.status = 'assigned'
    task.assignedEmployeeId = employeeId
    task.startedAt = Date.now()
    return cloneTask(task)
  }

  complete(taskId: string, employeeId?: string) {
    const task = this.tasks.find(item => item.id === taskId)
    if (!task || task.status === 'completed' || task.status === 'cancelled') return false
    if (employeeId && task.assignedEmployeeId && task.assignedEmployeeId !== employeeId) return false
    task.status = 'completed'
    task.completedAt = Date.now()
    return true
  }

  release(taskId: string, employeeId?: string) {
    const task = this.tasks.find(item => item.id === taskId)
    if (!task || task.status !== 'assigned') return false
    if (employeeId && task.assignedEmployeeId !== employeeId) return false
    task.status = 'pending'
    task.assignedEmployeeId = undefined
    task.startedAt = undefined
    return true
  }

  cancel(taskId: string) {
    const task = this.tasks.find(item => item.id === taskId)
    if (!task || task.status === 'completed' || task.status === 'cancelled') return false
    task.status = 'cancelled'
    task.completedAt = Date.now()
    return true
  }

  get(taskId: string) {
    const task = this.tasks.find(item => item.id === taskId)
    return task ? cloneTask(task) : undefined
  }

  getTasks(options: { status?: EmployeeWorkTask['status']; type?: EmployeeTaskType } = {}) {
    return this.tasks
      .filter(task => !options.status || task.status === options.status)
      .filter(task => !options.type || task.type === options.type)
      .sort(compareTasks)
      .map(cloneTask)
  }

  pruneCompleted(limit = 100) {
    const active = this.tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled')
    const completed = this.tasks
      .filter(task => task.status === 'completed' || task.status === 'cancelled')
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
      .slice(0, Math.max(0, limit))
    this.tasks = [...active, ...completed]
  }

  clear() {
    this.tasks = []
    this.nextTask = 1
  }
}

function normalizePriority(priority?: number) {
  return Math.max(0, Math.min(100, Math.round(priority ?? 50)))
}

function compareTasks(a: EmployeeWorkTask, b: EmployeeWorkTask) {
  return b.priority - a.priority || a.createdAt - b.createdAt
}

function cloneTask(task: EmployeeWorkTask): EmployeeWorkTask {
  return { ...task }
}
