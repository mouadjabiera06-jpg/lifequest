// Orchestration de la synchronisation : connexion, envoi, récupération et conflits.
// Les décisions elles-mêmes sont prises par decideSync (pur, testé).
import type { Session } from "@supabase/supabase-js";
import {
  CloudError, createRemoteSave, currentSession, deleteRemoteSave, fetchRemoteSave, isCloudConfigured,
  onSessionChange, overwriteRemoteSave, pushRemoteSave, sendLoginCode, signOut, verifyLoginCode,
} from "../data/cloud";
import { loadSyncMeta, saveGame, saveSyncMeta } from "../data/localStore";
import { decideSync } from "../data/syncPolicy";
import type { GameState } from "../domain/types";
import { localVersion, onLocalChange, replaceGame, setSync, toast, useApp } from "./store";

const PUSH_DELAY_MS = 1500;
let pushTimer: ReturnType<typeof setTimeout> | undefined;
let running: Promise<void> | null = null;
let rerun = false;

function applySession(session: Session | null): void {
  const user = session?.user ?? null;
  const wasSignedIn = useApp.getState().sync.userId;
  setSync({
    userId: user?.id ?? null,
    email: user?.email ?? null,
    phase: user ? "idle" : "signed-out",
    message: null,
    conflict: null,
  });
  if (user && user.id !== wasSignedIn) void syncNow();
}

export async function initSync(): Promise<void> {
  if (!isCloudConfigured) return;
  onLocalChange(() => {
    if (!useApp.getState().sync.userId) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => void syncNow(), PUSH_DELAY_MS);
  });
  window.addEventListener("online", () => void syncNow());
  try {
    applySession(await currentSession());
    await onSessionChange(applySession);
  } catch (e) {
    setSync({ phase: "error", message: messageOf(e) });
  }
}

function messageOf(e: unknown): string {
  return e instanceof CloudError ? e.message : "La synchronisation a échoué. Réessaie plus tard.";
}

/** Synchronise maintenant. Les appels concurrents sont regroupés en une seule passe supplémentaire. */
export function syncNow(): Promise<void> {
  if (running) {
    rerun = true;
    return running;
  }
  running = runSync().finally(() => {
    running = null;
    if (rerun) {
      rerun = false;
      void syncNow();
    }
  });
  return running;
}

async function runSync(attempt = 0): Promise<void> {
  const { sync, game } = useApp.getState();
  const userId = sync.userId;
  if (!userId || sync.phase === "conflict") return;
  if (!navigator.onLine) {
    setSync({ phase: "offline", message: "Hors ligne : ta progression sera envoyée au retour du réseau." });
    return;
  }

  setSync({ phase: "syncing", message: null });
  const versionAtStart = localVersion;
  try {
    const remote = await fetchRemoteSave(userId);
    const meta = loadSyncMeta();
    const decision = decideSync(game, meta, userId, remote);
    const linkTo = (revision: number) =>
      saveSyncMeta({ userId, baseRevision: revision, dirty: localVersion !== versionAtStart });

    switch (decision) {
      case "noop":
        if (remote) linkTo(remote.revision);
        break;
      case "create-remote":
        linkTo(await createRemoteSave(userId, game as GameState));
        break;
      case "push":
        linkTo(await pushRemoteSave(userId, game as GameState, (remote?.revision ?? meta.baseRevision) as number));
        break;
      case "adopt-remote": {
        const r = remote as NonNullable<typeof remote>;
        saveSyncMeta({ userId, baseRevision: r.revision, dirty: false });
        replaceGame(r.state, "remote");
        break;
      }
      case "conflict":
        setSync({ phase: "conflict", conflict: remote, message: null });
        return;
    }
    setSync({ phase: "idle", lastSyncedAt: Date.now(), message: null });
  } catch (e) {
    if (e instanceof CloudError && e.kind === "conflict" && attempt === 0) return runSync(1);
    if (e instanceof CloudError && e.kind === "network") {
      setSync({ phase: "offline", message: e.message });
      return;
    }
    console.error("[sync]", e instanceof Error ? e.message : e);
    setSync({ phase: "error", message: messageOf(e) });
  }
}

/** Le joueur choisit quelle partie garder quand deux appareils ont divergé. */
export async function resolveConflict(keep: "device" | "cloud"): Promise<void> {
  const { sync, game } = useApp.getState();
  const remote = sync.conflict;
  if (!sync.userId || !remote) return;
  setSync({ phase: "syncing" });
  try {
    if (keep === "cloud") {
      // Filet de sécurité : la partie écartée reste récupérable sur cet appareil.
      if (game) backupDiscarded(game);
      saveSyncMeta({ userId: sync.userId, baseRevision: remote.revision, dirty: false });
      replaceGame(remote.state, "remote");
    } else if (game) {
      const revision = await overwriteRemoteSave(sync.userId, game);
      saveSyncMeta({ userId: sync.userId, baseRevision: revision, dirty: false });
    }
    setSync({ phase: "idle", conflict: null, lastSyncedAt: Date.now() });
    toast(keep === "cloud" ? "☁️ Partie en ligne récupérée" : "📱 Partie de cet appareil enregistrée en ligne");
  } catch (e) {
    setSync({ phase: "conflict", message: messageOf(e) });
  }
}

function backupDiscarded(game: GameState): void {
  try {
    localStorage.setItem("lifequest:backup", JSON.stringify(game));
  } catch {
    /* sauvegarde de secours impossible : on continue */
  }
}

export async function requestCode(email: string): Promise<string | null> {
  try {
    await sendLoginCode(email);
    return null;
  } catch (e) {
    return messageOf(e);
  }
}

export async function confirmCode(email: string, code: string): Promise<string | null> {
  try {
    await verifyLoginCode(email, code);
    return null;
  } catch (e) {
    return messageOf(e);
  }
}

export async function logout(): Promise<void> {
  try {
    await signOut();
  } finally {
    setSync({ userId: null, email: null, phase: "signed-out", conflict: null, message: null });
  }
}

export async function deleteCloudData(): Promise<string | null> {
  const userId = useApp.getState().sync.userId;
  if (!userId) return "Tu n'es pas connecté";
  try {
    await deleteRemoteSave(userId);
    saveSyncMeta({ userId: null, baseRevision: null, dirty: true });
    await logout();
    saveGame(useApp.getState().game);
    return null;
  } catch (e) {
    return messageOf(e);
  }
}
