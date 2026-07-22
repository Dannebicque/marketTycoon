import { getProductDefinition, isCheckoutDefinition, isShelfDefinition, isStorageDefinition } from '@market-tycoon/catalog'
import type { PlacedBuilding, StoreSimulation } from '@market-tycoon/simulation-engine'

export interface StoreNeedCosts {
  electricity: number
  cleaning: number
  maintenance: number
  waste: number
  losses: number
  total: number
}

export interface EquipmentCondition {
  buildingId: string
  name: string
  wear: number
  status: 'healthy' | 'warning' | 'critical' | 'broken'
  breakdowns: number
  lastBreakdownDay?: number
}

export interface StoreNeedsReport {
  day: number
  costs: StoreNeedCosts
  wasteUnits: number
  breakdowns: number
  preventedBreakdowns: number
  technicianQuality: number
  cleanliness: number
  equipment: EquipmentCondition[]
}

const EMPTY_COSTS: StoreNeedCosts = { electricity: 0, cleaning: 0, maintenance: 0, waste: 0, losses: 0, total: 0 }

export class StoreNeedsManager {
  private readonly conditions = new Map<string, EquipmentCondition>()
  private readonly history: StoreNeedsReport[] = []
  private readonly technicianQualities = new Map<string, number>()
  private latest: StoreNeedsReport = {
    day: 0,
    costs: { ...EMPTY_COSTS },
    wasteUnits: 0,
    breakdowns: 0,
    preventedBreakdowns: 0,
    technicianQuality: 0,
    cleanliness: 100,
    equipment: [],
  }

  registerEmployee(employee: { id: string; roleKey: string; quality: number }) {
    if (employee.roleKey === 'technician') this.technicianQualities.set(employee.id, employee.quality)
  }

  unregisterEmployee(employeeId: string) { this.technicianQualities.delete(employeeId) }
  resetEmployees(employees: Array<{ id: string; roleKey: string; quality: number }>) {
    this.technicianQualities.clear()
    employees.forEach(employee => this.registerEmployee(employee))
  }

  processDay(day: number, simulation: StoreSimulation, buildings: PlacedBuilding[], servedCustomers: number) {
    if (this.latest.day === day) return this.latest
    const technicianQuality = this.getTechnicianQuality()
    const activeIds = new Set(buildings.map(building => building.id))
    for (const id of this.conditions.keys()) if (!activeIds.has(id)) this.conditions.delete(id)

    let electricity = 0
    let maintenance = 0
    let breakdowns = 0
    let preventedBreakdowns = 0

    for (const building of buildings) {
      const definition = building.definition
      if (isShelfDefinition(definition) || isStorageDefinition(definition)) electricity += definition.electricityCostPerDay ?? 0
      if (isCheckoutDefinition(definition)) electricity += definition.requiresEmployee ? 1.2 : 3.8

      const condition = this.conditions.get(building.id) ?? {
        buildingId: building.id,
        name: definition.name,
        wear: 0,
        status: 'healthy' as const,
        breakdowns: 0,
      }
      const usageWear = definition.category === 'checkout' ? Math.min(4, servedCustomers * .08) : definition.category === 'shelf' ? Math.min(2.5, servedCustomers * .035) : .45
      const electricalWear = (isShelfDefinition(definition) || isStorageDefinition(definition)) && (definition.electricityCostPerDay ?? 0) > 0 ? .5 : 0
      condition.wear = Math.min(100, condition.wear + .7 + usageWear + electricalWear)

      const technicianFactor = Math.max(.2, 1 - technicianQuality / 120)
      const breakdownChance = Math.max(0, (condition.wear - 35) / 750) * technicianFactor
      const roll = Math.random()
      if (roll < breakdownChance) {
        condition.breakdowns += 1
        condition.lastBreakdownDay = day
        condition.status = 'broken'
        breakdowns += 1
        maintenance += Math.max(8, definition.price * .035) * Math.max(.45, 1 - technicianQuality / 160)
        condition.wear = Math.max(18, condition.wear - (technicianQuality > 0 ? 22 : 12))
      } else {
        if (technicianQuality > 0 && roll < breakdownChance * 2.2) preventedBreakdowns += 1
        condition.status = condition.wear >= 80 ? 'critical' : condition.wear >= 55 ? 'warning' : 'healthy'
        maintenance += definition.price * .0015 * Math.max(.55, 1 - technicianQuality / 220)
      }
      this.conditions.set(building.id, condition)
    }

    const cleaning = Math.max(2, buildings.length * .55 + servedCustomers * .14)
    const cleanliness = Math.max(25, Math.round(100 - servedCustomers * .6 - buildings.length * .25))
    const { wasteUnits, wasteCost } = this.applyProductLosses(simulation)
    const losses = breakdowns * Math.max(2, servedCustomers * .3)
    const costs = {
      electricity: round(electricity),
      cleaning: round(cleaning),
      maintenance: round(maintenance),
      waste: round(wasteCost),
      losses: round(losses),
      total: 0,
    }
    costs.total = round(costs.electricity + costs.cleaning + costs.maintenance + costs.waste + costs.losses)

    const additionalOperatingCosts = round(costs.cleaning + costs.maintenance + costs.waste + costs.losses)
    simulation.metrics.cash -= additionalOperatingCosts
    simulation.metrics.operatingExpenses += additionalOperatingCosts
    simulation.metrics.profit = simulation.metrics.revenue - simulation.metrics.constructionExpenses - simulation.metrics.merchandiseExpenses - simulation.metrics.operatingExpenses

    this.latest = {
      day,
      costs,
      wasteUnits,
      breakdowns,
      preventedBreakdowns,
      technicianQuality,
      cleanliness,
      equipment: [...this.conditions.values()].map(item => ({ ...item })).sort((a, b) => b.wear - a.wear),
    }
    this.history.unshift(this.latest)
    this.history.splice(14)
    return this.latest
  }

  getLatestReport() { return this.latest }
  getHistory() { return this.history.map(report => ({ ...report, costs: { ...report.costs }, equipment: report.equipment.map(item => ({ ...item })) })) }
  getTechnicianQuality() {
    const values = [...this.technicianQualities.values()]
    return values.length ? Math.round(values.reduce((sum, quality) => sum + quality, 0) / values.length) : 0
  }

  private applyProductLosses(simulation: StoreSimulation) {
    let wasteUnits = 0
    let wasteCost = 0
    for (const inventory of simulation.getEquipmentInventories()) {
      for (const compartment of inventory.compartments) {
        if (!compartment.productKey || compartment.quantity <= 0) continue
        const product = getProductDefinition(compartment.productKey)
        if (!product?.shelfLifeDays) continue
        const lossRate = Math.min(.18, 1 / Math.max(8, product.shelfLifeDays * 10))
        const lost = Math.min(compartment.quantity, Math.floor(compartment.quantity * lossRate + Math.random() * .8))
        if (lost <= 0) continue
        compartment.quantity -= lost
        wasteUnits += lost
        wasteCost += lost * product.purchasePrice
      }
    }
    return { wasteUnits, wasteCost }
  }
}

export const storeNeedsManager = new StoreNeedsManager()

function round(value: number) { return Math.round(value * 100) / 100 }
