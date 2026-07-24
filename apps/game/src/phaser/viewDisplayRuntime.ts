export type WallDisplayMode = 'auto' | 'full' | 'low'

const STORAGE_KEY = 'market-tycoon.wall-display-mode'
const listeners = new Set<() => void>()
let wallMode = readMode()

export const viewDisplayRuntime = {
  get wallMode() { return wallMode },
  setWallMode(mode: WallDisplayMode) {
    wallMode = mode
    localStorage.setItem(STORAGE_KEY, mode)
    listeners.forEach(listener => listener())
    window.dispatchEvent(new CustomEvent('market-tycoon:view-display-changed'))
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

function readMode(): WallDisplayMode {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'full' || saved === 'low' || saved === 'auto' ? saved : 'auto'
}
