export const SAVE_GAME_VERSION = 1;
export const SAVE_GAME_STORAGE_KEY = 'market-tycoon.save.v1';
export function storeSaveGame(save) {
    localStorage.setItem(SAVE_GAME_STORAGE_KEY, JSON.stringify(save));
}
export function readSaveGame() {
    const raw = localStorage.getItem(SAVE_GAME_STORAGE_KEY);
    if (!raw)
        return null;
    try {
        const parsed = JSON.parse(raw);
        return parsed.version === SAVE_GAME_VERSION ? parsed : null;
    }
    catch {
        return null;
    }
}
export function deleteSaveGame() { localStorage.removeItem(SAVE_GAME_STORAGE_KEY); }
export function hasSaveGame() { return Boolean(localStorage.getItem(SAVE_GAME_STORAGE_KEY)); }
