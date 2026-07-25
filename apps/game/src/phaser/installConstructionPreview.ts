import {
  constructionMaterialCatalog,
  createRectangleBounds,
  getRectangleCells,
  getRectanglePerimeterUnits,
  type ConstructionPreview,
  type ConstructionPoint,
} from '@market-tycoon/construction'
import { StoreScene } from './StoreScene'
import type { BuildToolController } from '@market-tycoon/build-mode'
import { requireWorldMapRuntime } from '../world/worldMapRuntime'

interface PreviewScene extends StoreScene {
  buildTools?: BuildToolController
  constructionPreviewLayer?: Phaser.GameObjects.Graphics
  constructionPreviewLabel?: Phaser.GameObjects.Text
}

let installed = false
let start: ConstructionPoint | undefined
let materialKey = 'concrete-light'

export function installConstructionPreview() {
  if (installed) return
  installed = true

  const prototype = StoreScene.prototype as StoreScene & Record<string, any>
  const originalCreate = prototype.create
  prototype.create = function () {
    originalCreate.call(this)
    const scene = this as PreviewScene & Record<string, any>
    scene.constructionPreviewLayer = scene.add.graphics().setDepth(39)
    scene.constructionPreviewLabel = scene.add.text(0, 0, '', {
      fontFamily: 'Arial', fontSize: '12px', color: '#f8fafc', backgroundColor: '#020617dd', padding: { x: 8, y: 6 },
    }).setDepth(41).setVisible(false)
    scene.input.on('pointermove', () => drawPreview(scene))
  }

  window.addEventListener('market-tycoon:build-surface-selection', event => {
    start = (event as CustomEvent<{ start?: ConstructionPoint | null }>).detail?.start ?? undefined
  })
  window.addEventListener('market-tycoon:build-tool-changed', event => {
    const tool = (event as CustomEvent<{ activeTool: string }>).detail?.activeTool
    if (tool !== 'room' && tool !== 'floor') start = undefined
  })
  window.addEventListener('market-tycoon:floor-style-change', event => {
    const key = (event as CustomEvent<{ styleKey: string }>).detail?.styleKey
    if (key && constructionMaterialCatalog.get(key)?.kind === 'floor') materialKey = key
  })
}

function drawPreview(scene: PreviewScene & Record<string, any>) {
  const layer = scene.constructionPreviewLayer
  const label = scene.constructionPreviewLabel
  layer?.clear()
  label?.setVisible(false)
  const tool = scene.buildTools?.snapshot.activeTool
  if (!layer || !label || !start || (tool !== 'room' && tool !== 'floor')) return

  const end = scene.hovered as ConstructionPoint
  if (!scene.grid.isInside(end.x, end.y)) return
  const bounds = createRectangleBounds(start, end)
  const cells = getRectangleCells(bounds)
  const world = requireWorldMapRuntime()
  const valid = tool === 'room'
    ? cells.every(cell => world.isBuildable(cell))
    : cells.every(cell => world.isStoreInterior(cell))
  const material = constructionMaterialCatalog.get(materialKey)
  const materialCost = material ? constructionMaterialCatalog.calculateCost(material.key, cells.length) : 0
  const structuralCost = tool === 'room'
    ? constructionMaterialCatalog.calculateCost('wall-standard', getRectanglePerimeterUnits(bounds))
    : 0
  const preview: ConstructionPreview = {
    kind: tool,
    bounds,
    cells,
    valid,
    message: valid ? undefined : tool === 'room' ? 'Terrain non constructible' : 'Hors du bâtiment',
    materialKey,
    materialCost,
    structuralCost,
    totalCost: materialCost + structuralCost,
  }

  for (const cell of preview.cells) drawCell(scene, layer, cell, preview.valid ? 0x22c55e : 0xef4444)
  const center = scene.grid.gridToScreen(bounds.x + Math.floor(bounds.width / 2), bounds.y + Math.floor(bounds.height / 2))
  label.setPosition(center.x, center.y - 32).setText([
    `${bounds.width} × ${bounds.height} · ${cells.length} cases`,
    `${preview.totalCost.toLocaleString('fr-FR')} €`,
    preview.message ?? material?.name ?? '',
  ]).setOrigin(.5).setVisible(true)
  window.dispatchEvent(new CustomEvent('market-tycoon:construction-preview', { detail: preview }))
}

function drawCell(scene: StoreScene, layer: Phaser.GameObjects.Graphics, cell: ConstructionPoint, color: number) {
  const center = scene.grid.gridToScreen(cell.x, cell.y)
  const halfWidth = scene.grid.tileWidth / 2
  const halfHeight = scene.grid.tileHeight / 2
  layer.fillStyle(color, .22).lineStyle(1, color, .8)
  layer.beginPath().moveTo(center.x, center.y).lineTo(center.x + halfWidth, center.y + halfHeight).lineTo(center.x, center.y + scene.grid.tileHeight).lineTo(center.x - halfWidth, center.y + halfHeight).closePath().fillPath().strokePath()
}
