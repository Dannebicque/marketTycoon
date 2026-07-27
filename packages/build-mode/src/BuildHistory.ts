export interface BuildCommand {
  readonly label: string
  execute(): boolean
  undo(): boolean
}

export interface BuildHistorySnapshot {
  undoCount: number
  redoCount: number
  nextUndoLabel?: string
  nextRedoLabel?: string
}

export type BuildHistoryListener = (snapshot: BuildHistorySnapshot) => void

export class BuildHistory {
  private readonly undoStack: BuildCommand[] = []
  private readonly redoStack: BuildCommand[] = []
  private readonly listeners = new Set<BuildHistoryListener>()

  constructor(private readonly maximumEntries = 100) {}

  execute(command: BuildCommand) {
    if (!command.execute()) return false
    this.record(command)
    return true
  }

  record(command: BuildCommand) {
    this.undoStack.push(command)
    if (this.undoStack.length > this.maximumEntries) this.undoStack.shift()
    this.redoStack.length = 0
    this.notify()
  }

  undo() {
    const command = this.undoStack.pop()
    if (!command) return false
    if (!command.undo()) {
      this.undoStack.push(command)
      return false
    }
    this.redoStack.push(command)
    this.notify()
    return true
  }

  redo() {
    const command = this.redoStack.pop()
    if (!command) return false
    if (!command.execute()) {
      this.redoStack.push(command)
      return false
    }
    this.undoStack.push(command)
    this.notify()
    return true
  }

  clear() {
    this.undoStack.length = 0
    this.redoStack.length = 0
    this.notify()
  }

  snapshot(): BuildHistorySnapshot {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      nextUndoLabel: this.undoStack.at(-1)?.label,
      nextRedoLabel: this.redoStack.at(-1)?.label,
    }
  }

  subscribe(listener: BuildHistoryListener) {
    this.listeners.add(listener)
    listener(this.snapshot())
    return () => this.listeners.delete(listener)
  }

  private notify() {
    const snapshot = this.snapshot()
    for (const listener of this.listeners) listener(snapshot)
  }
}
