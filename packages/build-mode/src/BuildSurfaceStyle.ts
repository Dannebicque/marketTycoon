import { constructionMaterialCatalog } from '@market-tycoon/construction'
import type { ConstructionMaterialDefinition } from '@market-tycoon/construction'

export type BuildSurfaceStyleDefinition = ConstructionMaterialDefinition

export const BUILD_SURFACE_STYLES: readonly BuildSurfaceStyleDefinition[] = constructionMaterialCatalog.getByKind('floor')

export function getBuildSurfaceStyle(key: string) {
  const material = constructionMaterialCatalog.get(key)
  return material?.kind === 'floor' ? material : undefined
}
