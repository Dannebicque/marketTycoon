import type { WorldMapDefinition } from './contracts'
import { requireValidWorldMap } from './WorldMapValidator'

export interface WorldMapSource {
  load(): Promise<unknown>
}

export class WorldMapLoader {
  async load(source: WorldMapSource): Promise<WorldMapDefinition> {
    const raw = await source.load()
    return requireValidWorldMap(raw as WorldMapDefinition)
  }
}

export class JsonWorldMapSource implements WorldMapSource {
  constructor(private readonly url: string) {}

  async load(): Promise<unknown> {
    const response = await fetch(this.url)
    if (!response.ok) throw new Error(`Unable to load world map ${this.url}: ${response.status}`)
    return response.json()
  }
}
