import { isCheckoutDefinition, isShelfDefinition } from '@market-tycoon/catalog'
import { NavigationGrid, type GridCell, type PlacedBuilding } from '@market-tycoon/simulation-engine'
import type { StoreScene } from '../StoreScene'
import type { EmployeeManager, EmployeeState, EmployeeWorkTask } from '@market-tycoon/employees'
import { EmployeeAgent } from './EmployeeAgent'

export class EmployeeRuntime {
  private readonly agents = new Map<string, EmployeeAgent>()
  private readonly loops = new Set<string>()
  private readonly repairResolvers = new Map<string, () => void>()
  private readonly navigation: NavigationGrid
  private active = true

  constructor(
    private readonly scene: StoreScene,
    private readonly manager: EmployeeManager,
  ) {
    this.navigation = new NavigationGrid(scene.grid)
  }

  sync() {
    if (!this.active) return
    const employees = this.manager.getEmployees()
    const ids = new Set(employees.map(employee => employee.id))

    for (const [id, agent] of this.agents) {
      if (!ids.has(id)) {
        agent.destroy()
        this.agents.delete(id)
        this.loops.delete(id)
      }
    }

    for (const employee of employees) {
      let agent = this.agents.get(employee.id)
      if (!agent) {
        const start = this.findEntryCell()
        if (!start) continue
        agent = new EmployeeAgent(this.scene, this.scene.grid, employee.id, employee, start)
        this.agents.set(employee.id, agent)
      }
      if (!this.loops.has(employee.id)) {
        this.loops.add(employee.id)
        void this.runEmployee(employee.id)
      }
    }
  }

  destroy() {
    this.active = false
    this.agents.forEach(agent => agent.destroy())
    this.agents.clear()
    this.loops.clear()
    for (const resolve of this.repairResolvers.values()) resolve()
    this.repairResolvers.clear()
  }

  isCheckoutStaffed(checkout: PlacedBuilding) {
    if (!isCheckoutDefinition(checkout.definition)) return false
    if (!checkout.definition.requiresEmployee) return true
    return Boolean(this.manager.getAssignedTo(checkout.id))
  }

  requestRepair(checkout: PlacedBuilding) {
    return new Promise<void>(resolve => {
      if (!this.manager.hasRole('technician')) {
        this.scene.time.delayedCall(4_000, resolve)
        return
      }
      const task = this.manager.enqueueTask({
        type: 'repairing',
        label: `Réparation ${checkout.definition.name}`,
        priority: 100,
        requiredRoleKey: 'technician',
        targetBuildingId: checkout.id,
        dedupeKey: `repair:${checkout.id}`,
      })
      this.repairResolvers.set(task.id, resolve)
    })
  }

  getTasks() {
    return this.manager.tasks.getTasks()
  }

  private async runEmployee(employeeId: string) {
    while (this.active && this.agents.has(employeeId)) {
      const employee = this.manager.getEmployee(employeeId)
      const agent = this.agents.get(employeeId)
      if (!employee || !agent) break
      try {
        if (employee.roleKey === 'cashier') await this.runCashier(employee, agent)
        else {
          if (employee.roleKey === 'stocker') this.enqueueRestockTasks()
          const task = this.manager.claimNextTask(employee.id)
          if (task) await this.executeTask(employee, agent, task)
          else await this.idle(employee, agent, employee.roleKey === 'technician' ? 'Maintenance préventive' : 'Surveillance des rayons')
        }
      } catch {
        this.manager.releaseTask(employee.id)
        agent.setTask('Disponible')
        await this.wait(500)
      }
    }
    this.loops.delete(employeeId)
  }

  private async runCashier(employee: EmployeeState, agent: EmployeeAgent) {
    const checkout = employee.assignedBuildingId
      ? this.scene.grid.getBuildings('checkout').find(item => item.id === employee.assignedBuildingId)
      : undefined
    if (!checkout) return this.idle(employee, agent, 'En attente d’affectation')

    this.manager.setTask(employee.id, 'checkout', `Caisse ${checkout.definition.name}`, checkout.id)
    agent.setTask('À la caisse')
    await this.moveAdjacent(agent, checkout, employee.quality)
    await this.wait(800)
  }

  private async executeTask(employee: EmployeeState, agent: EmployeeAgent, task: EmployeeWorkTask) {
    if (task.type === 'restocking') await this.executeRestock(employee, agent, task)
    else if (task.type === 'repairing') await this.executeRepair(employee, agent, task)
    else {
      this.manager.completeTask(employee.id)
      await this.wait(200)
    }
  }

  private async executeRestock(employee: EmployeeState, agent: EmployeeAgent, task: EmployeeWorkTask) {
    const shelf = task.targetBuildingId
      ? this.scene.grid.getBuildings('shelf').find(item => item.id === task.targetBuildingId)
      : undefined
    const compartment = shelf && task.targetCompartmentId
      ? this.scene.simulation.getCompartment(shelf.id, task.targetCompartmentId)
      : undefined
    if (!shelf || !compartment?.productKey || compartment.quantity >= compartment.capacity || this.scene.simulation.getReserveQuantity(compartment.productKey) <= 0) {
      this.manager.completeTask(employee.id)
      return
    }

    agent.setTask(`Réassort · priorité ${task.priority}`)
    await this.moveAdjacent(agent, shelf, employee.quality)
    await this.wait(this.workDuration(employee.quality, 2_200))
    this.scene.simulation.restockCompartment(shelf.id, compartment.id)
    this.scene.drawBuildings()
    this.manager.completeTask(employee.id)
    await this.wait(250)
  }

  private async executeRepair(employee: EmployeeState, agent: EmployeeAgent, task: EmployeeWorkTask) {
    const building = task.targetBuildingId
      ? this.scene.grid.getBuildings().find(item => item.id === task.targetBuildingId)
      : undefined
    if (!building) {
      this.resolveRepair(task.id)
      this.manager.completeTask(employee.id)
      return
    }

    agent.setTask(`Réparation · priorité ${task.priority}`)
    await this.moveAdjacent(agent, building, employee.quality)
    await this.wait(this.workDuration(employee.quality, 3_500))
    this.resolveRepair(task.id)
    this.manager.completeTask(employee.id)
    await this.wait(250)
  }

  private enqueueRestockTasks() {
    for (const shelf of this.scene.grid.getBuildings('shelf')) {
      if (!isShelfDefinition(shelf.definition)) continue
      const inventory = this.scene.simulation.getEquipmentInventory(shelf.id)
      for (const compartment of inventory?.compartments ?? []) {
        if (!compartment.productKey || compartment.quantity >= compartment.capacity) continue
        if (this.scene.simulation.getReserveQuantity(compartment.productKey) <= 0) continue
        const fillRatio = compartment.capacity > 0 ? compartment.quantity / compartment.capacity : 1
        this.manager.enqueueTask({
          type: 'restocking',
          label: `Réassort ${shelf.definition.name}`,
          priority: Math.round(35 + (1 - fillRatio) * 55),
          requiredRoleKey: 'stocker',
          targetBuildingId: shelf.id,
          targetCompartmentId: compartment.id,
          dedupeKey: `restock:${shelf.id}:${compartment.id}`,
        })
      }
    }
  }

  private resolveRepair(taskId: string) {
    const resolve = this.repairResolvers.get(taskId)
    if (resolve) resolve()
    this.repairResolvers.delete(taskId)
  }

  private async idle(employee: EmployeeState, agent: EmployeeAgent, label = 'Disponible') {
    this.manager.setTask(employee.id, 'idle', label)
    agent.setTask(label)
    await this.wait(900)
  }

  private async moveAdjacent(agent: EmployeeAgent, building: PlacedBuilding, quality: number) {
    const goals = this.scene.grid.getAdjacentWalkableCells(building)
    const path = this.navigation.findPathToAny(agent.position, goals)
    if (path.length) await agent.follow(path, quality)
  }

  private findEntryCell(): GridCell | undefined {
    return this.scene.grid.getBorderWalkableCells()[0]
  }

  private workDuration(quality: number, base: number) {
    return Math.max(450, Math.round(base * (1.25 - quality / 160)))
  }

  private wait(duration: number) {
    return new Promise<void>(resolve => this.scene.time.delayedCall(duration, resolve))
  }
}
