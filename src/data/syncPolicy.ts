// Règles de synchronisation, sans aucun accès réseau : testables isolément.
import type { GameState } from "../domain/types";

/** Ce que cet appareil sait de la sauvegarde en ligne. */
export interface SyncMeta {
  /** Compte auquel la partie locale est rattachée. */
  userId: string | null;
  /** Révision en ligne sur laquelle la partie locale est basée. */
  baseRevision: number | null;
  /** Vrai si la partie locale a changé depuis la dernière synchronisation. */
  dirty: boolean;
}

export interface RemoteSave {
  revision: number;
  state: GameState;
}

export type SyncDecision =
  | "noop"
  | "create-remote"
  | "push"
  | "adopt-remote"
  | "conflict";

/** Partie toute neuve sur cet appareil : rien à perdre si on la remplace. */
export function isPristine(state: GameState): boolean {
  return state.xp === 0 && state.counters.questsDone === 0 && state.counters.bossesDefeated === 0;
}

/**
 * Décide quoi faire en comparant la partie locale et la sauvegarde en ligne.
 * Principe : on n'écrase jamais une progression sans l'accord du joueur ; en cas de doute, conflit.
 */
export function decideSync(local: GameState | null, meta: SyncMeta, userId: string, remote: RemoteSave | null): SyncDecision {
  if (!remote) return local ? "create-remote" : "noop";
  if (!local || isPristine(local)) return "adopt-remote";

  const linkedToThisAccount = meta.userId === userId && meta.baseRevision !== null;
  if (!linkedToThisAccount) {
    // Premier rattachement de cet appareil : deux parties existent peut-être.
    return local.updatedAt === remote.state.updatedAt ? "adopt-remote" : "conflict";
  }

  const base = meta.baseRevision as number;
  if (remote.revision === base) return meta.dirty ? "push" : "noop";
  if (remote.revision > base) return meta.dirty ? "conflict" : "adopt-remote";
  // La sauvegarde en ligne a été recréée (révision plus basse) : la partie locale fait foi.
  return "push";
}
