export type ConstructionMaterialKind = 'floor' | 'wall' | 'roof' | 'facade'

export interface ConstructionMaterialDefinition {
  key: string
  kind: ConstructionMaterialKind
  name: string
  color: number
  pricePerUnit: number
  textureKey?: string
  requiredLevel?: number
}

export class MaterialCatalog {
  private readonly materials = new Map<string, ConstructionMaterialDefinition>()

  constructor(definitions: readonly ConstructionMaterialDefinition[] = []) {
    definitions.forEach(definition => this.register(definition))
  }

  register(definition: ConstructionMaterialDefinition) {
    if (!definition.key.trim()) throw new Error('A construction material requires a key.')
    if (definition.pricePerUnit < 0) throw new Error(`Invalid material price for ${definition.key}.`)
    this.materials.set(definition.key, { ...definition })
    return this
  }

  get(key: string) { return this.materials.get(key) }

  getByKind(kind: ConstructionMaterialKind) {
    return [...this.materials.values()].filter(material => material.kind === kind)
  }

  calculateCost(key: string, units: number) {
    const material = this.get(key)
    return material ? Math.max(0, Math.ceil(units)) * material.pricePerUnit : 0
  }
}

export const DEFAULT_CONSTRUCTION_MATERIALS: readonly ConstructionMaterialDefinition[] = [
  { key: 'concrete-light', kind: 'floor', name: 'Béton clair', color: 0x94a3b8, pricePerUnit: 8 },
  { key: 'tile-white', kind: 'floor', name: 'Carrelage blanc', color: 0xe2e8f0, pricePerUnit: 12 },
  { key: 'tile-blue', kind: 'floor', name: 'Carrelage bleu', color: 0x38bdf8, pricePerUnit: 14 },
  { key: 'tile-green', kind: 'floor', name: 'Carrelage vert', color: 0x4ade80, pricePerUnit: 14 },
  { key: 'wood-warm', kind: 'floor', name: 'Bois chaleureux', color: 0xb45309, pricePerUnit: 20 },
  { key: 'anthracite', kind: 'floor', name: 'Anthracite', color: 0x334155, pricePerUnit: 16 },
  { key: 'wall-standard', kind: 'wall', name: 'Cloison standard', color: 0xcbd5e1, pricePerUnit: 35 },
  { key: 'door-standard', kind: 'wall', name: 'Porte standard', color: 0x92400e, pricePerUnit: 120 },
  { key: 'window-standard', kind: 'wall', name: 'Fenêtre standard', color: 0x7dd3fc, pricePerUnit: 160 },
  { key: 'storefront-standard', kind: 'wall', name: 'Vitrine standard', color: 0x67e8f9, pricePerUnit: 240 },
  { key: 'facade-standard', kind: 'facade', name: 'Façade standard', color: 0xf8fafc, pricePerUnit: 90 },
]

export const constructionMaterialCatalog = new MaterialCatalog(DEFAULT_CONSTRUCTION_MATERIALS)
