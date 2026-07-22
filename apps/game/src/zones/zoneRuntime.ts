import { StoreZoneManager, ZONES, type ZoneDefinition, type ZoneValidationReport } from '@market-tycoon/store-zones'

export const storeZoneManager = new StoreZoneManager(ZONES)

let activeZoneKey: string | null = null
let eraseMode = false
let redraw: (() => void) | undefined
let validate: (() => ZoneValidationReport) | undefined
let validation: ZoneValidationReport = { valid: true, issues: [], components: [], invalidCellKeys: [] }
const listeners = new Set<() => void>()

export const zoneRuntime = {
  get definitions(): readonly ZoneDefinition[] { return ZONES },
  get activeZoneKey() { return activeZoneKey },
  get eraseMode() { return eraseMode },
  get validation() { return validation },
  select(zoneKey: string) { activeZoneKey = zoneKey; eraseMode = false; emit(); redraw?.() },
  selectEraser() { activeZoneKey = null; eraseMode = true; emit(); redraw?.() },
  close() { activeZoneKey = null; eraseMode = false; emit(); redraw?.() },
  isEditing() { return Boolean(activeZoneKey) || eraseMode },
  setRedraw(handler: () => void) { redraw = handler },
  setValidator(handler: () => ZoneValidationReport) { validate = handler; this.revalidate() },
  revalidate() { validation = validate?.() ?? { valid: true, issues: [], components: [], invalidCellKeys: [] }; emit(); redraw?.(); return validation },
  notifyChanged() {
    validation = validate?.() ?? validation
    emit(); redraw?.()
    localStorage.setItem('market-tycoon.zones.v1', JSON.stringify(storeZoneManager.exportState()))
  },
  restore() {
    try { storeZoneManager.importState(JSON.parse(localStorage.getItem('market-tycoon.zones.v1') ?? '[]')) }
    catch { storeZoneManager.clear() }
    validation = validate?.() ?? validation
    emit(); redraw?.()
  },
  subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener) },
}

function emit() { listeners.forEach(listener => listener()) }
