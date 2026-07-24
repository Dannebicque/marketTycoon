import { EmployeeManager, type EmployeeState } from '@market-tycoon/employees'
import { StoreSimulation, type PlacedBuilding } from '@market-tycoon/simulation-engine'
import { storeNeedsManager } from './StoreNeedsManager'

let installed = false

type SimulationWithDayStart = StoreSimulation & { dayStart?: { servedCustomers: number } }

export function installStoreNeeds() {
  if (installed) return
  installed = true

  const originalCloseDay = StoreSimulation.prototype.closeDay
  StoreSimulation.prototype.closeDay = function (this: StoreSimulation, day: number, buildings: PlacedBuilding[] = []) {
    const start = (this as SimulationWithDayStart).dayStart?.servedCustomers ?? 0
    const servedCustomers = Math.max(0, this.metrics.servedCustomers - start)
    storeNeedsManager.processDay(day, this, buildings, servedCustomers)
    return originalCloseDay.call(this, day, buildings)
  }

  const originalHire = EmployeeManager.prototype.hire
  EmployeeManager.prototype.hire = function (this: EmployeeManager, candidateId: string, day: number) {
    const employee = originalHire.call(this, candidateId, day)
    if (employee) storeNeedsManager.registerEmployee(employee)
    return employee
  }

  const originalDismiss = EmployeeManager.prototype.dismiss
  EmployeeManager.prototype.dismiss = function (this: EmployeeManager, employeeId: string) {
    const dismissed = originalDismiss.call(this, employeeId)
    if (dismissed) storeNeedsManager.unregisterEmployee(employeeId)
    return dismissed
  }

  const originalImportState = EmployeeManager.prototype.importState
  EmployeeManager.prototype.importState = function (this: EmployeeManager, state: { employees?: EmployeeState[]; candidates?: EmployeeState[] }) {
    originalImportState.call(this, state)
    storeNeedsManager.resetEmployees(this.getEmployees())
  }
}
