// Persistance sur l'appareil. Toutes les lectures/écritures sont protégées :
// navigation privée, quota plein ou stockage bloqué ne doivent jamais faire planter l'app.
import { parseSave } from "../domain/schema";
import type { GameState } from "../domain/types";
import type { SyncMeta } from "./syncPolicy";

const KEYS = {
  game: "lifequest:game",
  sync: "lifequest:sync",
  tab: "lifequest:tab",
  legacy: "lifequest.v1",
} as const;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* stockage indisponible : rien à effacer */
  }
}

export interface LoadResult {
  game: GameState | null;
  /** Vrai si une sauvegarde existait mais était illisible (mise de côté, pas effacée). */
  recoveredFromCorruption: boolean;
}

export function loadGame(): LoadResult {
  const raw = read(KEYS.game) ?? read(KEYS.legacy);
  if (!raw) return { game: null, recoveredFromCorruption: false };
  try {
    const parsed = parseSave(JSON.parse(raw));
    if (parsed.ok) return { game: parsed.state, recoveredFromCorruption: false };
  } catch {
    /* JSON invalide : traité ci-dessous */
  }
  // On garde une copie de la sauvegarde illisible pour pouvoir la récupérer à la main.
  write(`lifequest:corrupt:${Date.now()}`, raw);
  return { game: null, recoveredFromCorruption: true };
}

export function saveGame(game: GameState | null): boolean {
  if (!game) {
    remove(KEYS.game);
    remove(KEYS.legacy);
    return true;
  }
  return write(KEYS.game, JSON.stringify(game));
}

const EMPTY_META: SyncMeta = { userId: null, baseRevision: null, dirty: true };

export function loadSyncMeta(): SyncMeta {
  const raw = read(KEYS.sync);
  if (!raw) return EMPTY_META;
  try {
    const m = JSON.parse(raw) as Partial<SyncMeta>;
    return {
      userId: typeof m.userId === "string" ? m.userId : null,
      baseRevision: typeof m.baseRevision === "number" ? m.baseRevision : null,
      dirty: m.dirty !== false,
    };
  } catch {
    return EMPTY_META;
  }
}

export function saveSyncMeta(meta: SyncMeta): void {
  write(KEYS.sync, JSON.stringify(meta));
}

export function loadTab(): string | null {
  return read(KEYS.tab);
}

export function saveTab(tab: string): void {
  write(KEYS.tab, tab);
}
