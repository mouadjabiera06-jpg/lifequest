import { RANKS, type Rank } from "./rules";

export interface LevelProgress {
  level: number;
  /** XP accumulée dans le niveau en cours. */
  current: number;
  /** XP nécessaire pour passer au niveau suivant. */
  needed: number;
}

/**
 * Courbe linéaire : le niveau n demande `base + (n - 1) * step` XP.
 * Elle garde les premiers niveaux rapides (motivation) sans exploser plus tard.
 */
function curve(base: number, step: number, totalXp: number): LevelProgress {
  let level = 1;
  let needed = base;
  let rest = Math.max(0, Math.floor(totalXp));
  while (rest >= needed) {
    rest -= needed;
    level += 1;
    needed = base + (level - 1) * step;
  }
  return { level, current: rest, needed };
}

export function heroLevel(totalXp: number): LevelProgress {
  return curve(100, 50, totalXp);
}

export function statLevel(statXp: number): LevelProgress {
  return curve(60, 30, statXp);
}

export function rankFor(level: number): Rank {
  let rank = RANKS[0] as Rank;
  for (const r of RANKS) if (level >= r.minLevel) rank = r;
  return rank;
}

/** Bonus d'XP lié à la série : +1/60 par jour, plafonné à +50 % (30 jours). */
export function streakMultiplier(streak: number): number {
  return 1 + Math.min(Math.max(streak, 0), 30) / 60;
}
