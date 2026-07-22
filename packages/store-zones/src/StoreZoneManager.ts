import type { ZoneCell, ZoneDefinition, ZoneSummary } from './contracts'

const cellKey = (x: number, y: number) => `${x}:${y}`

export class StoreZoneManager {
  private readonly cells = new Map<string, ZoneCell>()

  constructor(private readonly definitions: readonly ZoneDefinition[]) {}

  paint(x: number, y: number, zoneKey: string) {
    if (!this.getDefinition(zoneKey)) return false
    this.cells.set(cellKey(x, y), { x, y, zoneKey })
    return true
  }

  erase(x: number, y: number) { return this.cells.delete(cellKey(x, y)) }
  clear() { this.cells.clear() }
  getZoneKeyAt(x: number, y: number) { return this.cells.get(cellKey(x, y))?.zoneKey }
  getDefinition(key: string) { return this.definitions.find(item => item.key === key) }
  getCells() { return [...this.cells.values()].map(cell => ({ ...cell })) }
  getCellsForZone(zoneKey: string) { return this.getCells().filter(cell => cell.zoneKey === zoneKey) }

  getSummaries(): ZoneSummary[] {
    return this.definitions.map(definition => {
      const area = this.getCellsForZone(definition.key).length
      const electricityPerCell = definition.costs.electricityPerCell
      const cleaningPerCell = definition.costs.cleaningPerCell
      const maintenancePerCell = definition.costs.maintenancePerCell
      const heatingPerCell = definition.costs.heatingPerCell ?? 0
      const securityPerCell = definition.costs.securityPerCell ?? 0
      return {
        key: definition.key,
        name: definition.name,
        icon: definition.icon,
        color: definition.color,
        area,
        costs: {
          electricityPerCell,
          cleaningPerCell,
          maintenancePerCell,
          heatingPerCell,
          securityPerCell,
          total: area * (electricityPerCell + cleaningPerCell + maintenancePerCell + heatingPerCell + securityPerCell),
        },
      }
    }).filter(summary => summary.area > 0)
  }

  getDailyCosts() {
    return this.getSummaries().reduce((total, zone) => ({
      electricity: total.electricity + zone.area * zone.costs.electricityPerCell,
      cleaning: total.cleaning + zone.area * zone.costs.cleaningPerCell,
      maintenance: total.maintenance + zone.area * zone.costs.maintenancePerCell,
      heating: total.heating + zone.area * (zone.costs.heatingPerCell ?? 0),
      security: total.security + zone.area * (zone.costs.securityPerCell ?? 0),
    }), { electricity: 0, cleaning: 0, maintenance: 0, heating: 0, security: 0 })
  }

  isBuildingAllowed(zoneKey: string | undefined, category: string) {
    if (!zoneKey) return true
    const definition = this.getDefinition(zoneKey)
    return !definition?.allowedBuildingCategories?.length || definition.allowedBuildingCategories.includes(category)
  }

  exportState() { return this.getCells() }
  importState(cells: ZoneCell[] = []) { this.clear(); cells.forEach(cell => this.paint(cell.x, cell.y, cell.zoneKey)) }
}
