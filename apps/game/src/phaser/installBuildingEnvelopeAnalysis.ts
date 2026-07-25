import { analyzeBuildingEnvelope, type BuildingEnvelopeMetrics, type WallMap } from '@market-tycoon/construction'
import { StoreScene } from './StoreScene'
import { requireWorldMapRuntime } from '../world/worldMapRuntime'

interface EnvelopeScene extends StoreScene {
  buildWalls?: WallMap
}

let installed = false
let activeScene: EnvelopeScene | undefined

export function installBuildingEnvelopeAnalysis() {
  if (installed) return
  installed = true

  const prototype = StoreScene.prototype as StoreScene & Record<string, any>
  const originalCreate = prototype.create
  prototype.create = function () {
    originalCreate.call(this)
    activeScene = this as EnvelopeScene
    emitEnvelopeMetrics(activeScene)
  }

  window.addEventListener('market-tycoon:structural-runtime-changed', () => {
    if (activeScene) emitEnvelopeMetrics(activeScene)
  })
  window.addEventListener('market-tycoon:building-runtime-changed', () => {
    if (activeScene) emitEnvelopeMetrics(activeScene)
  })
  window.addEventListener('market-tycoon:building-envelope-request', () => {
    if (activeScene) emitEnvelopeMetrics(activeScene)
  })
}

function emitEnvelopeMetrics(scene: EnvelopeScene) {
  const walls = scene.buildWalls
  const world = requireWorldMapRuntime()
  const metrics: BuildingEnvelopeMetrics = analyzeBuildingEnvelope(
    walls?.entries() ?? [],
    point => world.isStoreInterior(point),
  )
  window.dispatchEvent(new CustomEvent('market-tycoon:building-envelope-changed', { detail: metrics }))
}
