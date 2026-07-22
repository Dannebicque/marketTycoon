import { StoreZoneManager, ZONES, type ZoneDefinition, type ZoneValidationReport } from '@market-tycoon/store-zones'

export type ToolMode = 'cursor' | 'building' | 'zone'

export const storeZoneManager = new StoreZoneManager(ZONES)

let activeZoneKey: string | null = null
let eraseMode = false
let toolMode: ToolMode = 'cursor'
let redraw: (() => void) | undefined
let validate: (() => ZoneValidationReport) | undefined
let validation: ZoneValidationReport = { valid: true, issues: [], components: [], invalidCellKeys: [] }
const listeners = new Set<() => void>()

export const zoneRuntime = {
  get definitions(): readonly ZoneDefinition[] { return ZONES },
  get activeZoneKey() { return activeZoneKey },
  get eraseMode() { return eraseMode },
  get toolMode() { return toolMode },
  get validation() { return validation },
  select(zoneKey: string) { activeZoneKey = zoneKey; eraseMode = false; toolMode = 'zone'; closeConstructionPalette(); syncBodyClass(); emit(); redraw?.() },
  selectEraser() { activeZoneKey = null; eraseMode = true; toolMode = 'zone'; closeConstructionPalette(); syncBodyClass(); emit(); redraw?.() },
  selectCursor() { activeZoneKey = null; eraseMode = false; toolMode = 'cursor'; closeConstructionPalette(); syncBodyClass(); emit(); redraw?.() },
  activateBuildingTool() { activeZoneKey = null; eraseMode = false; toolMode = 'building'; syncBodyClass(); emit(); redraw?.() },
  close() { activeZoneKey = null; eraseMode = false; toolMode = 'cursor'; closeConstructionPalette(); syncBodyClass(); emit(); redraw?.() },
  isEditing() { return toolMode === 'zone' },
  isBuildingMode() { return toolMode === 'building' },
  setRedraw(handler: () => void) { redraw = handler },
  setValidator(handler: () => ZoneValidationReport) { validate = handler; validation = validate(); emit(); redraw?.() },
  revalidate() { validation = validate?.() ?? { valid: true, issues: [], components: [], invalidCellKeys: [] }; emit(); redraw?.(); return validation },
  notifyChanged() {
    validation = validate?.() ?? validation
    emit(); redraw?.()
    localStorage.setItem('market-tycoon.zones.v1', JSON.stringify(storeZoneManager.exportState()))
  },
  restore() {
    try { storeZoneManager.importState(JSON.parse(localStorage.getItem('market-tycoon.zones.v1') ?? '[]')) }
    catch { storeZoneManager.clear() }
    toolMode = 'cursor'
    activeZoneKey = null
    eraseMode = false
    validation = validate?.() ?? validation
    syncBodyClass()
    emit(); redraw?.()
  },
  subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener) },
}

function emit() { listeners.forEach(listener => listener()) }
function closeConstructionPalette() {
  window.setTimeout(() => (document.querySelector('.palette-close') as HTMLButtonElement | null)?.click(), 0)
}
function syncBodyClass() {
  document.body.classList.toggle('zone-mode-active', toolMode === 'zone')
  document.body.classList.toggle('building-mode-active', toolMode === 'building')
  document.body.classList.toggle('cursor-mode-active', toolMode === 'cursor')
}
