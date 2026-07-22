import { getProductDefinition, isCheckoutDefinition, isShelfDefinition, isStorageDefinition } from '@market-tycoon/catalog'
import type { PlacedBuilding, StoreSimulation } from '@market-tycoon/simulation-engine'
import type { ZoneSummary } from '@market-tycoon/store-zones'
import { storeZoneManager, zoneRuntime } from '../zones/zoneRuntime'

export interface StoreNeedCosts {
  electricity: number
  cleaning: number
  maintenance: number
  heating: number
  security: number
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
  zones: ZoneSummary[]
  zonedArea: number
  invalidZonedArea: number
  zoneIssues: string[]
  compliancePenalty: number
}

const EMPTY_COSTS: StoreNeedCosts = { electricity: 0, cleaning: 0, maintenance: 0, heating: 0, security: 0, waste: 0, losses: 0, total: 0 }

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
    zones: [],
    zonedArea: 0,
    invalidZonedArea: 0,
    zoneIssues: [],
    compliancePenalty: 0,
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

    let equipmentElectricity = 0
    let equipmentMaintenance = 0
    let breakdowns = 0
    let preventedBreakdowns = 0

    for (const building of buildings) {
      const definition = building.definition
      if (isShelfDefinition(definition) || isStorageDefinition(definition)) equipmentElectricity += definition.electricityCostPerDay ?? 0
      if (isCheckoutDefinition(definition)) equipmentElectricity += definition.requiresEmployee ? 1.2 : 3.8

      const condition = this.conditions.get(building.id) ?? { buildingId: building.id, name: definition.name, wear: 0, status: 'healthy' as const, breakdowns: 0 }
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
        equipmentMaintenance += Math.max(8, definition.price * .035) * Math.max(.45, 1 - technicianQuality / 160)
        condition.wear = Math.max(18, condition.wear - (technicianQuality > 0 ? 22 : 12))
      } else {
        if (technicianQuality > 0 && roll < breakdownChance * 2.2) preventedBreakdowns += 1
        condition.status = condition.wear >= 80 ? 'critical' : condition.wear >= 55 ? 'warning' : 'healthy'
        equipmentMaintenance += definition.price * .0015 * Math.max(.55, 1 - technicianQuality / 220)
      }
      this.conditions.set(building.id, condition)
    }

    const zones = storeZoneManager.getSummaries()
    const zoneCosts = storeZoneManager.getDailyCosts()
    const validation = zoneRuntime.validation
    const invalidCellKeys = new Set(validation.invalidCellKeys)
    const invalidZonedArea = invalidCellKeys.size
    const compliancePenalty = round(invalidZonedArea * .35 + validation.issues.length * 2)
    const zonedArea = zones.reduce((sum, zone) => sum + zone.area, 0)
    const fallbackCleaning = zonedArea ? 0 : Math.max(2, buildings.length * .55)
    const activityCleaning = servedCustomers * .14
    const cleaning = zoneCosts.cleaning + fallbackCleaning + activityCleaning + invalidZonedArea * .08
    const cleanliness = Math.max(20, Math.round(100 - servedCustomers * .6 - Math.max(buildings.length * .25, zonedArea * .08) - invalidZonedArea * .45))
    const { wasteUnits, wasteCost } = this.applyProductLosses(simulation)
    const losses = breakdowns * Math.max(2, servedCustomers * .3) + compliancePenalty
    const costs = {
      electricity: round(equipmentElectricity + zoneCosts.electricity + invalidZonedArea * .12),
      cleaning: round(cleaning),
      maintenance: round(equipmentMaintenance + zoneCosts.maintenance),
      heating: round(zoneCosts.heating + invalidZonedArea * .18),
      security: round(zoneCosts.security),
      waste: round(wasteCost),
      losses: round(losses),
      total: 0,
    }
    costs.total = round(costs.electricity + costs.cleaning + costs.maintenance + costs.heating + costs.security + costs.waste + costs.losses)

    const alreadyChargedElectricity = round(equipmentElectricity)
    const additionalOperatingCosts = round(costs.total - alreadyChargedElectricity)
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
      zones,
      zonedArea,
      invalidZonedArea,
      zoneIssues: validation.issues.map(issue => issue.message),
      compliancePenalty,
    }
    this.history.unshift(this.latest)
    this.history.splice(14)
    return this.latest
  }

  getLatestReport() { return this.latest }
  getHistory() { return this.history.map(report => ({ ...report, costs: { ...report.costs }, equipment: report.equipment.map(item => ({ ...item })), zones: report.zones.map(zone => ({ ...zone, costs: { ...zone.costs })), zoneIssues: [...report.zoneIssues] })) }
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
