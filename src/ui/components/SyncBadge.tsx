import { useApp } from "../../state/store";

const LABELS = {
  idle: "☁️ Synchronisé",
  syncing: "⏳ Synchronisation…",
  offline: "📴 Hors ligne",
  error: "⚠️ Synchro en échec",
  conflict: "⚠️ Choix à faire",
} as const;

/** Petit indicateur sous le nom du héros, visible seulement quand un compte est connecté. */
export function SyncBadge() {
  const phase = useApp((s) => s.sync.phase);
  if (phase === "signed-out") return null;
  return <span className="sync-pill">{LABELS[phase]}</span>;
}
