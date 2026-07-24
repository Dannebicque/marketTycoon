import type { ProductCategory } from '@market-tycoon/catalog'

export interface CommercialSectorDefinition {
  key: string
  name: string
  description: string
  icon: string
  color: number
  defaultProductCategories?: ProductCategory[]
  requiredUnlockKey?: string
  custom?: boolean
}

export interface CommercialZoneCell { x: number; y: number }

export interface CommercialZoneInstance {
  id: string
  sectorKey: string
  name: string
  cells: CommercialZoneCell[]
  createdAt: number
}

export interface CommercialZoneState {
  definitions?: CommercialSectorDefinition[]
  zones: CommercialZoneInstance[]
}

const cellKey = (x: number, y: number) => `${x}:${y}`

export const DEFAULT_COMMERCIAL_SECTORS: CommercialSectorDefinition[] = [
  { key: 'produce', name: 'Fruits et légumes', description: 'Produits frais végétaux.', icon: '🥕', color: 0x22c55e, defaultProductCategories: ['fruit', 'vegetable'] },
  { key: 'fresh', name: 'Produits frais', description: 'Crèmerie, viande et produits réfrigérés.', icon: '🧀', color: 0x38bdf8, defaultProductCategories: ['fresh'] },
  { key: 'grocery', name: 'Épicerie', description: 'Produits alimentaires ambiants.', icon: '🥫', color: 0xf59e0b, defaultProductCategories: ['grocery'] },
  { key: 'drinks', name: 'Boissons', description: 'Boissons fraîches et ambiantes.', icon: '🥤', color: 0x8b5cf6, defaultProductCategories: ['drink'] },
  { key: 'hygiene', name: 'Hygiène', description: 'Hygiène et entretien.', icon: '🧴', color: 0xec4899, defaultProductCategories: ['hygiene'] },
  { key: 'frozen', name: 'Surgelés', description: 'Produits conservés à température négative.', icon: '❄️', color: 0x06b6d4, defaultProductCategories: ['frozen'] },
  { key: 'bakery', name: 'Boulangerie', description: 'Pain, viennoiseries et produits de boulangerie.', icon: '🥖', color: 0xd97706, defaultProductCategories: ['bakery'] },
]

export class CommercialZoneManager {
  private readonly definitions = new Map<string, CommercialSectorDefinition>()
  private readonly zones = new Map<string, CommercialZoneInstance>()
  private readonly cells = new Map<string, string>()

  constructor(definitions: readonly CommercialSectorDefinition[] = DEFAULT_COMMERCIAL_SECTORS) {
    definitions.forEach(definition => this.registerDefinition(definition))
  }

  registerDefinition(definition: CommercialSectorDefinition) {
    if (!definition.key || !definition.name) return false
    this.definitions.set(definition.key, cloneDefinition(definition))
    return true
  }

  createCustomSector(input: Omit<CommercialSectorDefinition, 'key' | 'custom'> & { key?: string }) {
    const base = slug(input.key ?? input.name) || `sector-${this.definitions.size + 1}`
    let key = base
    let suffix = 2
    while (this.definitions.has(key)) key = `${base}-${suffix++}`
    const definition: CommercialSectorDefinition = { ...input, key, custom: true }
    this.registerDefinition(definition)
    return cloneDefinition(definition)
  }

  createZone(sectorKey: string, name?: string) {
    const definition = this.definitions.get(sectorKey)
    if (!definition) return null
    const id = crypto.randomUUID()
    const zone: CommercialZoneInstance = { id, sectorKey, name: name?.trim() || definition.name, cells: [], createdAt: Date.now() }
    this.zones.set(id, zone)
    return cloneZone(zone)
  }

  renameZone(zoneId: string, name: string) {
    const zone = this.zones.get(zoneId)
    if (!zone || !name.trim()) return false
    zone.name = name.trim()
    return true
  }

  deleteZone(zoneId: string) {
    if (!this.zones.delete(zoneId)) return false
    for (const [key, value] of this.cells) if (value === zoneId) this.cells.delete(key)
    return true
  }

  paint(zoneId: string, x: number, y: number) {
    const zone = this.zones.get(zoneId)
    if (!zone) return false
    const key = cellKey(x, y)
    const previousZoneId = this.cells.get(key)
    if (previousZoneId && previousZoneId !== zoneId) this.removeCell(previousZoneId, x, y)
    this.cells.set(key, zoneId)
    if (!zone.cells.some(cell => cell.x === x && cell.y === y)) zone.cells.push({ x, y })
    return true
  }

  erase(x: number, y: number) {
    const key = cellKey(x, y)
    const zoneId = this.cells.get(key)
    if (!zoneId) return false
    this.cells.delete(key)
    this.removeCell(zoneId, x, y)
    return true
  }

  clear() { this.zones.clear(); this.cells.clear() }
  getDefinitions() { return [...this.definitions.values()].map(cloneDefinition) }
  getDefinition(key: string) { const definition = this.definitions.get(key); return definition ? cloneDefinition(definition) : undefined }
  getZones() { return [...this.zones.values()].map(cloneZone) }
  getZone(zoneId: string) { const zone = this.zones.get(zoneId); return zone ? cloneZone(zone) : undefined }
  getZoneAt(x: number, y: number) { const zoneId = this.cells.get(cellKey(x, y)); return zoneId ? this.getZone(zoneId) : undefined }
  getSectorAt(x: number, y: number) { const zone = this.getZoneAt(x, y); return zone ? this.getDefinition(zone.sectorKey) : undefined }

  exportState(): CommercialZoneState {
    return { definitions: this.getDefinitions().filter(definition => definition.custom), zones: this.getZones() }
  }

  importState(state?: CommercialZoneState) {
    this.clear()
    for (const definition of state?.definitions ?? []) this.registerDefinition({ ...definition, custom: true })
    for (const source of state?.zones ?? []) {
      if (!this.definitions.has(source.sectorKey)) continue
      const zone: CommercialZoneInstance = { ...source, cells: [] }
      this.zones.set(zone.id, zone)
      for (const cell of source.cells ?? []) this.paint(zone.id, cell.x, cell.y)
    }
  }

  private removeCell(zoneId: string, x: number, y: number) {
    const zone = this.zones.get(zoneId)
    if (zone) zone.cells = zone.cells.filter(cell => cell.x !== x || cell.y !== y)
  }
}

function cloneDefinition(definition: CommercialSectorDefinition): CommercialSectorDefinition {
  return { ...definition, defaultProductCategories: definition.defaultProductCategories ? [...definition.defaultProductCategories] : undefined }
}
function cloneZone(zone: CommercialZoneInstance): CommercialZoneInstance { return { ...zone, cells: zone.cells.map(cell => ({ ...cell })) } }
function slug(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
