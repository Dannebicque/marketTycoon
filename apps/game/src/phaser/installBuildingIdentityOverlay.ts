import Phaser from 'phaser'
import type { WorldMapRuntime } from '@market-tycoon/world-map'
import { StoreScene } from './StoreScene'
import { requireWorldMapRuntime } from '../world/worldMapRuntime'

interface BuildingVisuals {
  layer: Phaser.GameObjects.Graphics
  labels: Phaser.GameObjects.Text[]
}

let installed = false
let activeScene: StoreScene | undefined
let activeRuntime: WorldMapRuntime | undefined
const visuals = new WeakMap<StoreScene, BuildingVisuals>()

export function installBuildingIdentityOverlay() {
  if (installed) return
  installed = true

  const originalCreate = StoreScene.prototype.create
  StoreScene.prototype.create = function createWithBuildingIdentity(this: StoreScene) {
    originalCreate.call(this)
    activeScene = this
    activeRuntime = requireWorldMapRuntime()
    drawBuildingIdentity(this, activeRuntime)
  }

  window.addEventListener('market-tycoon:parcel-action-result', event => {
    const success = (event as CustomEvent<{ success: boolean }>).detail?.success
    if (success && activeScene && activeRuntime) drawBuildingIdentity(activeScene, activeRuntime)
  })
}

function drawBuildingIdentity(scene: StoreScene, runtime: WorldMapRuntime) {
  const previous = visuals.get(scene)
  previous?.layer.destroy()
  previous?.labels.forEach(label => label.destroy())

  const current: BuildingVisuals = {
    layer: scene.add.graphics().setDepth(6),
    labels: [],
  }
  visuals.set(scene, current)

  const building = runtime.getPlayerBuilding()
  const state = runtime.getPlayerBuildingState()
  if (!building || !state) return

  for (const entrance of state.entrances) {
    const point = scene.grid.gridToScreen(entrance.x, entrance.y)
    const y = point.y + scene.grid.tileHeight / 2
    current.layer.fillStyle(0x38bdf8, .95).lineStyle(2, 0xe0f2fe, .95)
    current.layer.fillRoundedRect(point.x - 10, y - 5, 20, 10, 3).strokeRoundedRect(point.x - 10, y - 5, 20, 10, 3)
  }

  const firstArea = state.interiorAreas[0]
  if (!firstArea) return
  const anchor = scene.grid.gridToScreen(firstArea.x, firstArea.y)
  const facade = state.facadeStyle ? `Façade · ${state.facadeStyle}` : 'Façade standard'
  current.labels.push(scene.add.text(anchor.x, anchor.y - 28, `${building.name}\n${facade}`, {
    fontFamily: 'Arial',
    fontSize: '11px',
    align: 'center',
    color: '#e0f2fe',
    backgroundColor: '#0f172acc',
    padding: { x: 7, y: 4 },
  }).setOrigin(.5, 1).setDepth(7))
}
