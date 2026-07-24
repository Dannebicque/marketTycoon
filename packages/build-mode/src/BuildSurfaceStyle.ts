export interface BuildSurfaceStyleDefinition {
  key: string
  name: string
  color: number
  pricePerTile: number
  textureKey?: string
}

export const BUILD_SURFACE_STYLES: readonly BuildSurfaceStyleDefinition[] = [
  { key: 'concrete-light', name: 'Béton clair', color: 0x94a3b8, pricePerTile: 8 },
  { key: 'tile-white', name: 'Carrelage blanc', color: 0xe2e8f0, pricePerTile: 12 },
  { key: 'tile-blue', name: 'Carrelage bleu', color: 0x38bdf8, pricePerTile: 14 },
  { key: 'tile-green', name: 'Carrelage vert', color: 0x4ade80, pricePerTile: 14 },
  { key: 'wood-warm', name: 'Bois chaleureux', color: 0xb45309, pricePerTile: 20 },
  { key: 'anthracite', name: 'Anthracite', color: 0x334155, pricePerTile: 16 },
]

export function getBuildSurfaceStyle(key: string) {
  return BUILD_SURFACE_STYLES.find(style => style.key === key)
}
