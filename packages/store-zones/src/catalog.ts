import type { ZoneDefinition } from './contracts'

interface ZoneModule { default: ZoneDefinition }
const modules = import.meta.glob<ZoneModule>('./zones/*.zone.ts', { eager: true })

const registry = new Map<string, ZoneDefinition>()
for (const [filename, module] of Object.entries(modules)) {
  const zone = module.default
  if (!zone.key || !zone.name || !zone.icon) throw new Error(`${filename} : définition de zone invalide.`)
  if (registry.has(zone.key)) throw new Error(`Zone dupliquée : ${zone.key}`)
  registry.set(zone.key, zone)
}

export const ZONES = [...registry.values()].sort((a, b) => a.order - b.order)
export const getZoneDefinition = (key: string) => registry.get(key)
