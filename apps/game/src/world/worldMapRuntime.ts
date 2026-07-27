import { JsonWorldMapSource, WorldMapLoader, WorldMapRuntime } from '@market-tycoon/world-map'

export type DemoMapKey = 'retail-park' | 'city-center'

let runtime: WorldMapRuntime | null = null
let loading: Promise<WorldMapRuntime> | null = null

export function getWorldMapRuntime() {
  return runtime
}

export function requireWorldMapRuntime() {
  if (!runtime) throw new Error('World map runtime is not installed.')
  return runtime
}

export function loadWorldMap(mapKey: DemoMapKey = 'retail-park') {
  if (runtime?.definition.id === mapKey) return Promise.resolve(runtime)
  if (loading) return loading

  loading = new WorldMapLoader()
    .load(new JsonWorldMapSource(`/maps/${mapKey}/map.json`))
    .then(definition => {
      runtime = new WorldMapRuntime(definition)
      window.dispatchEvent(new CustomEvent('market-tycoon:world-map-ready', { detail: runtime }))
      return runtime
    })
    .finally(() => {
      loading = null
    })

  return loading
}
