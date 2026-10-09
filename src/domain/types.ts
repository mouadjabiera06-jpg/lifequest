/** Jour calendaire local au format AAAA-MM-JJ. */
export type DayISO = string;

export type StatId = "force" | "intel" | "charisme" | "discipline" | "richesse";
export type Difficulty = "facile" | "moyen" | "difficile";
export type AvatarStyle = "pixel-art" | "adventurer" | "lorelei" | "fun-emoji";

export interface Hero {
  name: string;
  avatarSeed: string;
  avatarStyle: AvatarStyle;
}

export interface Reward {
  xp: number;
  gold: number;
}

/** Habitude à refaire chaque jour. */
export interface Daily {
  id: string;
  title: string;
  stat: StatId;
  difficulty: Difficulty;
  streak: number;
  bestStreak: number;
  lastDoneOn: DayISO | null;
  /** Valeur de lastDoneOn avant la validation du jour, pour pouvoir l'annuler proprement. */
  previousDoneOn: DayISO | null;
  /** Gain accordé à la dernière validation, retiré si on l'annule le jour même. */
  lastReward: Reward | null;
  createdOn: DayISO;
}

/** Objectif ponctuel. */
export interface Mission {
  id: string;
  title: string;
  stat: StatId;
  difficulty: Difficulty;
  isBonus: boolean;
  doneOn: DayISO | null;
  createdOn: DayISO;
}

/** Gros objectif découpé en étapes : chaque étape retire 1 PV au boss. */
export interface Boss {
  id: string;
  name: string;
  alias: string;
  stat: StatId;
  hp: number;
  maxHp: number;
  deadline: DayISO | null;
  createdOn: DayISO;
  defeatedOn: DayISO | null;
}

export interface ShopItem {
  id: string;
  title: string;
  cost: number;
  icon: string;
  timesBought: number;
}

export interface JournalEntry {
  at: number;
  text: string;
}

export interface Counters {
  questsDone: number;
  bossesDefeated: number;
  bonusDone: number;
  rewardsBought: number;
  bestStreak: number;
}

export interface GameState {
  version: 2;
  hero: Hero;
  xp: number;
  gold: number;
  hp: number;
  statXp: Record<StatId, number>;
  dailies: Daily[];
  missions: Mission[];
  bosses: Boss[];
  shop: ShopItem[];
  /** Succès débloqués : identifiant → jour d'obtention. */
  achievements: Record<string, DayISO>;
  journal: JournalEntry[];
  /** Nombre de quêtes terminées par jour (fenêtre glissante). */
  activity: Record<DayISO, number>;
  counters: Counters;
  paused: boolean;
  lastActiveDay: DayISO;
  createdOn: DayISO;
  /** Horodatage de la dernière modification, utilisé pour départager deux appareils. */
  updatedAt: number;
}

/** Ce qu'une action a produit, pour que l'interface puisse le raconter au joueur. */
export type GameEvent =
  | { kind: "reward"; label: string; stat: StatId; xp: number; gold: number }
  | { kind: "levelUp"; level: number; newRank: string | null }
  | { kind: "achievement"; id: string; name: string }
  | { kind: "bossDefeated"; name: string; xp: number; gold: number }
  | { kind: "dayPassed"; damage: number; missed: string[]; bossHits: string[]; knockedOut: boolean; goldLost: number }
  | { kind: "info"; message: string };

export interface Outcome {
  state: GameState;
  events: GameEvent[];
}

/** Dépendances non déterministes, injectées pour garder le domaine pur et testable. */
export interface Clock {
  today: DayISO;
  now: number;
  newId: () => string;
}
