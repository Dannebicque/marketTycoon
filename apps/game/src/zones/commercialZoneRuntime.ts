import { CommercialZoneManager, type CommercialSectorDefinition, type CommercialZoneInstance } from '@market-tycoon/store-zones'

export const COMMERCIAL_ZONE_STORAGE_KEY = 'market-tycoon.commercial-zones.v1'
export const commercialZoneManager = new CommercialZoneManager()

let activeZoneId: string | null = null
let eraseMode = false
let editing = false
let redraw: (() => void) | undefined
const listeners = new Set<() => void>()

export const commercialZoneRuntime = {
  get definitions(): CommercialSectorDefinition[] { return commercialZoneManager.getDefinitions() },
  get zones(): CommercialZoneInstance[] { return commercialZoneManager.getZones() },
  get activeZoneId() { return activeZoneId },
  get eraseMode() { return eraseMode },
  isEditing() { return editing },
  select(zoneId: string) { activeZoneId = zoneId; eraseMode = false; editing = true; emit(); redraw?.() },
  selectEraser() { activeZoneId = null; eraseMode = true; editing = true; emit(); redraw?.() },
  selectCursor() { activeZoneId = null; eraseMode = false; editing = false; emit(); redraw?.() },
  createZone(sectorKey: string, name?: string) { const zone = commercialZoneManager.createZone(sectorKey, name); if (zone) this.select(zone.id); persist(); return zone },
  createCustomSector(name: string, color = 0x64748b, icon = '🏷️') { const sector = commercialZoneManager.createCustomSector({ name, description: 'Secteur commercial personnalisé.', color, icon }); persist(); emit(); return sector },
  renameZone(zoneId: string, name: string) { const changed = commercialZoneManager.renameZone(zoneId, name); if (changed) { persist(); emit() } return changed },
  deleteZone(zoneId: string) { const changed = commercialZoneManager.deleteZone(zoneId); if (changed) { if (activeZoneId === zoneId) this.selectCursor(); persist(); emit(); redraw?.() } return changed },
  notifyChanged() { persist(); emit(); redraw?.() },
  setRedraw(handler: () => void) { redraw = handler },
  restore() { try { commercialZoneManager.importState(JSON.parse(localStorage.getItem(COMMERCIAL_ZONE_STORAGE_KEY) ?? '{"zones":[]}')) } catch { commercialZoneManager.clear() }; emit(); redraw?.() },
  subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener) },
}

function persist() { localStorage.setItem(COMMERCIAL_ZONE_STORAGE_KEY, JSON.stringify(commercialZoneManager.exportState())) }
function emit() { listeners.forEach(listener => listener()) }
