import type { AvatarStyle, Difficulty, StatId } from "./types";

export const MAX_HP = 50;
export const JOURNAL_LIMIT = 80;
export const ACTIVITY_DAYS_KEPT = 120;
export const TITLE_MAX = 80;
export const NAME_MAX = 24;

export interface StatInfo {
  id: StatId;
  name: string;
  icon: string;
  hint: string;
}

export const STATS: readonly StatInfo[] = [
  { id: "force", name: "Force", icon: "💪", hint: "Sport, santé, sommeil" },
  { id: "intel", name: "Intelligence", icon: "🧠", hint: "Études, lecture, apprentissage" },
  { id: "charisme", name: "Charisme", icon: "🗣️", hint: "Amis, famille, réseau" },
  { id: "discipline", name: "Discipline", icon: "🎯", hint: "Habitudes, rangement, routine" },
  { id: "richesse", name: "Richesse", icon: "💰", hint: "Budget, épargne, projets pro" },
];

export const STAT_IDS: readonly StatId[] = STATS.map((s) => s.id);

export function statInfo(id: StatId): StatInfo {
  // STATS couvre tout le type StatId : la recherche ne peut pas échouer.
  return STATS.find((s) => s.id === id) as StatInfo;
}

export interface DifficultyInfo {
  name: string;
  xp: number;
  gold: number;
  /** PV perdus le lendemain si la quotidienne n'a pas été faite. */
  damage: number;
}

export const DIFFICULTIES: Readonly<Record<Difficulty, DifficultyInfo>> = {
  facile: { name: "Facile", xp: 10, gold: 5, damage: 3 },
  moyen: { name: "Moyen", xp: 25, gold: 10, damage: 5 },
  difficile: { name: "Difficile", xp: 50, gold: 20, damage: 8 },
};

export const DIFFICULTY_IDS = Object.keys(DIFFICULTIES) as Difficulty[];

export const BOSS = {
  hit: { xp: 15, gold: 5 },
  /** Butin de victoire, par PV maximum du boss. */
  lootPerHp: { xp: 20, gold: 10 },
  minHp: 2,
  maxHp: 30,
  /** Dégâts infligés par jour de retard, plafonnés pour qu'une absence ne soit pas punie sans fin. */
  lateDamagePerDay: 5,
  maxLateDays: 3,
} as const;

export const POTION = { cost: 30, heal: 20 } as const;

export interface Rank {
  minLevel: number;
  name: string;
  color: string;
}

export const RANKS: readonly Rank[] = [
  { minLevel: 1, name: "Novice", color: "#A9A2BF" },
  { minLevel: 5, name: "Apprenti", color: "#34D399" },
  { minLevel: 10, name: "Aventurier", color: "#60A5FA" },
  { minLevel: 20, name: "Héros", color: "#A78BFA" },
  { minLevel: 35, name: "Champion", color: "#F472B6" },
  { minLevel: 50, name: "Légende", color: "#FBBF24" },
];

export const AVATAR_STYLES: readonly AvatarStyle[] = ["pixel-art", "adventurer", "lorelei", "fun-emoji"];
