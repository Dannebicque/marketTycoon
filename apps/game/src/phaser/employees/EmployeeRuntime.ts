import { isCheckoutDefinition, isShelfDefinition } from '@market-tycoon/catalog'
import type { GridCell, PlacedBuilding } from '../GridManager'
import { NavigationGrid } from '../NavigationGrid'
import type { StoreScene } from '../StoreScene'
import type { EmployeeManager } from '@market-tycoon/employees'
import { EmployeeAgent } from './EmployeeAgent'
import type { EmployeeState } from '@market-tycoon/employees'

interface RepairRequest {
  checkoutId: string
  resolve: () => void
}

export class EmployeeRuntime {
  private readonly agents = new Map<string, EmployeeAgent>()
  private readonly loops = new Set<string>()
  private readonly repairs: RepairRequest[] = []
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
    while (this.repairs.length) this.repairs.shift()?.resolve()
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
      this.repairs.push({ checkoutId: checkout.id, resolve })
    })
  }

  private async runEmployee(employeeId: string) {
    while (this.active && this.agents.has(employeeId)) {
      const employee = this.manager.getEmployee(employeeId)
      const agent = this.agents.get(employeeId)
      if (!employee || !agent) break
      try {
        if (employee.roleKey === 'cashier') await this.runCashier(employee, agent)
        else if (employee.roleKey === 'stocker') await this.runStocker(employee, agent)
        else if (employee.roleKey === 'technician') await this.runTechnician(employee, agent)
        else await this.idle(employee, agent)
      } catch {
        this.manager.setTask(employee.id, 'idle', 'Disponible')
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

  private async runStocker(employee: EmployeeState, agent: EmployeeAgent) {
    const target = this.findRestockTarget()
    if (!target) return this.idle(employee, agent, 'Surveillance des rayons')

    this.manager.setTask(employee.id, 'restocking', `Réassort ${target.shelf.definition.name}`, target.shelf.id)
    agent.setTask('Réassort')
    await this.moveAdjacent(agent, target.shelf, employee.quality)
    await this.wait(this.workDuration(employee.quality, 2_200))
    this.scene.simulation.restockCompartment(target.shelf.id, target.compartmentId)
    this.scene.drawBuildings()
    this.manager.completeTask(employee.id)
    await this.wait(300)
  }

  private async runTechnician(employee: EmployeeState, agent: EmployeeAgent) {
    const request = this.repairs.shift()
    if (!request) return this.idle(employee, agent, 'Maintenance préventive')
    const checkout = this.scene.grid.getBuildings('checkout').find(item => item.id === request.checkoutId)
    if (!checkout) {
      request.resolve()
      return
    }

    this.manager.setTask(employee.id, 'repairing', `Réparation ${checkout.definition.name}`, checkout.id)
    agent.setTask('Réparation')
    await this.moveAdjacent(agent, checkout, employee.quality)
    await this.wait(this.workDuration(employee.quality, 3_500))
    request.resolve()
    this.manager.completeTask(employee.id)
    await this.wait(250)
  }

  private async idle(employee: EmployeeState, agent: EmployeeAgent, label = 'Disponible') {
    this.manager.setTask(employee.id, 'idle', label)
    agent.setTask(label)
    await this.wait(900)
  }

  private findRestockTarget() {
    for (const shelf of this.scene.grid.getBuildings('shelf')) {
      if (!isShelfDefinition(shelf.definition)) continue
      const inventory = this.scene.simulation.getEquipmentInventory(shelf.id)
      const compartment = inventory?.compartments.find(item => item.productKey && item.quantity < item.capacity && this.scene.simulation.getReserveQuantity(item.productKey) > 0)
      if (compartment) return { shelf, compartmentId: compartment.id }
    }
    return undefined
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
