// Aides de test : horloge déterministe et partie de départ.
import { createGame } from "./editing";
import type { Clock, DayISO, GameState } from "./types";

export function clockAt(today: DayISO, now = 1_700_000_000_000): Clock {
  let n = 0;
  return { today, now, newId: () => `id-${++n}` };
}

export function newGame(today: DayISO = "2026-10-08"): GameState {
  const r = createGame({ name: "Mouad", avatarStyle: "pixel-art" }, clockAt(today));
  if (!r.ok) throw new Error(r.error);
  return r.value;
}
