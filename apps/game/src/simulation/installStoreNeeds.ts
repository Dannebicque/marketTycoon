import { EmployeeManager } from '@market-tycoon/employees'
import { StoreSimulation } from '@market-tycoon/simulation-engine'
import { storeNeedsManager } from './StoreNeedsManager'

let installed = false

export function installStoreNeeds() {
  if (installed) return
  installed = true

  const originalCloseDay = StoreSimulation.prototype.closeDay
  StoreSimulation.prototype.closeDay = function (day, buildings = []) {
    const servedCustomers = this.customerAnalytics.getSummary(day).observations
    storeNeedsManager.processDay(day, this, buildings, servedCustomers)
    return originalCloseDay.call(this, day, buildings)
  }

  const originalHire = EmployeeManager.prototype.hire
  EmployeeManager.prototype.hire = function (candidateId, day) {
    const employee = originalHire.call(this, candidateId, day)
    if (employee) storeNeedsManager.registerEmployee(employee)
    return employee
  }

  const originalDismiss = EmployeeManager.prototype.dismiss
  EmployeeManager.prototype.dismiss = function (employeeId) {
    const dismissed = originalDismiss.call(this, employeeId)
    if (dismissed) storeNeedsManager.unregisterEmployee(employeeId)
    return dismissed
  }

  const originalImportState = EmployeeManager.prototype.importState
  EmployeeManager.prototype.importState = function (state) {
    originalImportState.call(this, state)
    storeNeedsManager.resetEmployees(this.getEmployees())
  }
}
