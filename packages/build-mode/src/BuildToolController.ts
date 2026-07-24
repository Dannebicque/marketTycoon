export type BuildToolKind = 'select' | 'place' | 'move' | 'remove' | 'rotate' | 'wall' | 'room' | 'floor' | 'fill'

export interface BuildToolState {
  activeTool: BuildToolKind
  selectedDefinitionKey?: string
  rotation: 0 | 1 | 2 | 3
}

export type BuildToolListener = (state: Readonly<BuildToolState>) => void

export class BuildToolController {
  private state: BuildToolState = { activeTool: 'select', rotation: 0 }
  private readonly listeners = new Set<BuildToolListener>()

  get snapshot(): Readonly<BuildToolState> {
    return { ...this.state }
  }

  activate(tool: BuildToolKind, definitionKey?: string) {
    this.state = {
      activeTool: tool,
      selectedDefinitionKey: definitionKey,
      rotation: tool === 'place' || tool === 'wall' ? this.state.rotation : 0,
    }
    this.notify()
  }

  selectDefinition(definitionKey: string, tool: BuildToolKind = 'place') {
    this.activate(tool, definitionKey)
  }

  rotate(step: -1 | 1 = 1) {
    this.state = {
      ...this.state,
      rotation: ((this.state.rotation + step + 4) % 4) as 0 | 1 | 2 | 3,
    }
    this.notify()
    return this.state.rotation
  }

  clearSelection() {
    this.state = { activeTool: 'select', rotation: 0 }
    this.notify()
  }

  subscribe(listener: BuildToolListener) {
    this.listeners.add(listener)
    listener(this.snapshot)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    const snapshot = this.snapshot
    for (const listener of this.listeners) listener(snapshot)
  }
}
