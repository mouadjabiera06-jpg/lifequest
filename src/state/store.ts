// État global de l'application. Le jeu lui-même est calculé par le domaine (fonctions pures) ;
// ce store se contente d'appliquer les résultats, de les persister et d'en informer l'interface.
import { create } from "zustand";
import { toDayISO } from "../domain/dates";
import type { EditResult } from "../domain/editing";
import { startNewDay } from "../domain/game";
import type { Clock, GameState, Outcome } from "../domain/types";
import { isCloudConfigured } from "../data/cloud";
import { loadGame, loadSyncMeta, loadTab, saveGame, saveSyncMeta, saveTab } from "../data/localStore";
import type { RemoteSave } from "../data/syncPolicy";
import { describeEvents, type Overlay, type Toast } from "./feedback";

export type Tab = "quetes" | "boss" | "boutique" | "profil";
const TABS: readonly Tab[] = ["quetes", "boss", "boutique", "profil"];

export type SyncPhase = "signed-out" | "idle" | "syncing" | "offline" | "error" | "conflict";

export interface SyncState {
  configured: boolean;
  userId: string | null;
  email: string | null;
  phase: SyncPhase;
  message: string | null;
  lastSyncedAt: number | null;
  conflict: RemoteSave | null;
}

interface AppState {
  game: GameState | null;
  storageWarning: string | null;
  tab: Tab;
  toasts: Toast[];
  overlays: Overlay[];
  sync: SyncState;
}

export function systemClock(): Clock {
  return { today: toDayISO(new Date()), now: Date.now(), newId: () => crypto.randomUUID() };
}

const initialLoad = loadGame();
const savedTab = loadTab();

export const useApp = create<AppState>(() => ({
  game: initialLoad.game,
  storageWarning: initialLoad.recoveredFromCorruption
    ? "Ta sauvegarde locale était illisible. Une copie a été mise de côté ; tu peux importer une sauvegarde depuis le Profil."
    : null,
  tab: TABS.includes(savedTab as Tab) ? (savedTab as Tab) : "quetes",
  toasts: [],
  overlays: [],
  sync: {
    configured: isCloudConfigured,
    userId: null,
    email: null,
    phase: "signed-out",
    message: null,
    lastSyncedAt: null,
    conflict: null,
  },
}));

// ---------- Retours visuels ----------

let feedbackId = 0;
const TOAST_MS = 2600;

export function toast(text: string): void {
  const id = ++feedbackId;
  // Deux notifications au plus à l'écran : au-delà, elles masquent le héros.
  useApp.setState((s) => ({ toasts: [...s.toasts.slice(-1), { id, text }] }));
  setTimeout(() => useApp.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), TOAST_MS);
}

export function dismissOverlay(id: number): void {
  useApp.setState((s) => ({ overlays: s.overlays.filter((o) => o.id !== id) }));
}

export function showOverlay(overlay: Omit<Overlay, "id">): void {
  useApp.setState((s) => ({ overlays: [...s.overlays, { ...overlay, id: ++feedbackId }] }));
}

function announce(outcome: Outcome): void {
  const { toasts, overlays } = describeEvents(outcome.events);
  toasts.forEach(toast);
  if (overlays.length) {
    useApp.setState((s) => ({ overlays: [...s.overlays, ...overlays.map((o) => ({ ...o, id: ++feedbackId }))] }));
  }
  if (outcome.events.some((e) => e.kind === "reward")) {
    try {
      navigator.vibrate?.(25);
    } catch {
      /* vibration indisponible */
    }
  }
}

// ---------- Persistance ----------

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let localChangeListener: (() => void) | null = null;
/** Incrémenté à chaque modification locale : permet à la synchro de savoir si on a joué pendant un envoi. */
export let localVersion = 0;

function persistSoon(): void {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 400);
}

export function flushSave(): void {
  clearTimeout(saveTimer);
  if (!saveGame(useApp.getState().game)) {
    useApp.setState({ storageWarning: "Impossible d'enregistrer sur cet appareil (stockage plein ou bloqué). Exporte ta partie pour ne rien perdre." });
  }
}

export function onLocalChange(listener: () => void): void {
  localChangeListener = listener;
}

function markLocalChange(): void {
  localVersion += 1;
  const meta = loadSyncMeta();
  if (!meta.dirty) saveSyncMeta({ ...meta, dirty: true });
  localChangeListener?.();
}

// ---------- Actions ----------

/** Applique une commande de jeu à la partie en cours. */
export function play(command: (state: GameState, clock: Clock) => Outcome): void {
  const game = useApp.getState().game;
  if (!game) return;
  const outcome = command(game, systemClock());
  announce(outcome);
  if (outcome.state === game) return;
  useApp.setState({ game: outcome.state });
  persistSoon();
  markLocalChange();
}

/** Applique une modification saisie dans un formulaire ; renvoie le message d'erreur éventuel. */
export function edit(command: (state: GameState, clock: Clock) => EditResult): string | null {
  const game = useApp.getState().game;
  if (!game) return "Aucune partie en cours";
  const result = command(game, systemClock());
  if (!result.ok) return result.error;
  play(() => result.outcome);
  return null;
}

/** Remplace toute la partie (nouvelle partie, import, ou version venue du cloud). */
export function replaceGame(game: GameState | null, origin: "local" | "remote"): void {
  useApp.setState({ game });
  flushSave();
  if (origin === "local") markLocalChange();
  if (game) play(startNewDay);
}

export function setTab(tab: Tab): void {
  useApp.setState({ tab });
  saveTab(tab);
}

export function setSync(patch: Partial<SyncState>): void {
  useApp.setState((s) => ({ sync: { ...s.sync, ...patch } }));
}

/** À appeler au retour sur l'app : gère le passage à un nouveau jour. */
export function refreshDay(): void {
  play(startNewDay);
}
