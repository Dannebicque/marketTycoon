import {
  SAVE_GAME_STORAGE_KEY,
  parseSaveGame,
  serializeSaveGame,
  type SaveGameV1,
} from '@market-tycoon/save'

export function storeSaveGame(save: SaveGameV1) {
  localStorage.setItem(SAVE_GAME_STORAGE_KEY, serializeSaveGame(save))
}

export function readSaveGame(): SaveGameV1 | null {
  const raw = localStorage.getItem(SAVE_GAME_STORAGE_KEY)
  return raw ? parseSaveGame(raw) : null
}

export function deleteSaveGame() {
  localStorage.removeItem(SAVE_GAME_STORAGE_KEY)
}

export function hasSaveGame() {
  const save = readSaveGame()
  if (!save) return false
  // En développement, une sauvegarde vide ne doit pas empêcher le chargement
  // du magasin de démonstration. Elle peut notamment rester après un HMR.
  if (import.meta.env.DEV && save.buildings.length === 0 && save.edges.length === 0) return false
  return true
}
