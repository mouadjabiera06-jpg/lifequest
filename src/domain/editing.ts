// Création et modification du contenu du joueur, avec validation des saisies.
import { isDayISO } from "./dates";
import { begin, finalize, addJournal } from "./engine";
import { AVATAR_STYLES, BOSS, DIFFICULTY_IDS, MAX_HP, NAME_MAX, STAT_IDS, TITLE_MAX } from "./rules";
import type { AvatarStyle, Clock, DayISO, Difficulty, GameState, Outcome, StatId } from "./types";

export type EditResult = { ok: true; outcome: Outcome } | { ok: false; error: string };

type Check<T> = { ok: true; value: T } | { ok: false; error: string };

export function cleanText(raw: string, max: number, label: string): Check<string> {
  // Les retours à la ligne et espaces multiples n'ont pas de sens dans un titre de quête.
  const value = raw.replace(/\s+/g, " ").trim();
  if (!value) return { ok: false, error: `${label} est obligatoire` };
  if (value.length > max) return { ok: false, error: `${label} : ${max} caractères maximum` };
  return { ok: true, value };
}

function isStat(v: string): v is StatId {
  return (STAT_IDS as readonly string[]).includes(v);
}
function isDifficulty(v: string): v is Difficulty {
  return (DIFFICULTY_IDS as readonly string[]).includes(v);
}
export function isAvatarStyle(v: string): v is AvatarStyle {
  return (AVATAR_STYLES as readonly string[]).includes(v);
}

export interface QuestInput {
  title: string;
  stat: string;
  difficulty: string;
}

function checkQuest(input: QuestInput): Check<{ title: string; stat: StatId; difficulty: Difficulty }> {
  const title = cleanText(input.title, TITLE_MAX, "L'intitulé");
  if (!title.ok) return title;
  if (!isStat(input.stat)) return { ok: false, error: "Statistique inconnue" };
  if (!isDifficulty(input.difficulty)) return { ok: false, error: "Difficulté inconnue" };
  return { ok: true, value: { title: title.value, stat: input.stat, difficulty: input.difficulty } };
}

// ---------- Nouvelle partie ----------

export interface NewGameInput {
  name: string;
  avatarStyle: string;
}

export function createGame(input: NewGameInput, clock: Clock): Check<GameState> {
  const name = cleanText(input.name, NAME_MAX, "Le nom du héros");
  if (!name.ok) return name;
  if (!isAvatarStyle(input.avatarStyle)) return { ok: false, error: "Style d'avatar inconnu" };
  const t = clock.today;
  const daily = (title: string, stat: StatId, difficulty: Difficulty) => ({
    id: clock.newId(), title, stat, difficulty, streak: 0, bestStreak: 0,
    lastDoneOn: null, previousDoneOn: null, lastReward: null, createdOn: t,
  });
  const mission = (title: string, stat: StatId, difficulty: Difficulty) => ({
    id: clock.newId(), title, stat, difficulty, isBonus: false, doneOn: null, createdOn: t,
  });
  const item = (title: string, cost: number, icon: string) => ({ id: clock.newId(), title, cost, icon, timesBought: 0 });

  return {
    ok: true,
    value: {
      version: 2,
      hero: { name: name.value, avatarSeed: name.value, avatarStyle: input.avatarStyle },
      xp: 0,
      gold: 0,
      hp: MAX_HP,
      statXp: { force: 0, intel: 0, charisme: 0, discipline: 0, richesse: 0 },
      dailies: [
        daily("Boire 1,5 L d'eau", "force", "facile"),
        daily("20 minutes de sport", "force", "moyen"),
        daily("30 minutes de révision", "intel", "moyen"),
        daily("Lire 10 pages", "intel", "facile"),
        daily("Noter mes dépenses", "richesse", "facile"),
      ],
      missions: [
        mission("Ranger complètement ma chambre", "discipline", "moyen"),
        mission("Appeler un ami pour prendre des nouvelles", "charisme", "facile"),
      ],
      bosses: [],
      shop: [item("Un épisode de série", 30, "📺"), item("Une soirée jeux vidéo", 80, "🎮"), item("Un resto", 250, "🍔")],
      achievements: {},
      journal: [{ at: clock.now, text: `🌅 ${name.value} commence son aventure` }],
      activity: {},
      counters: { questsDone: 0, bossesDefeated: 0, bonusDone: 0, rewardsBought: 0, bestStreak: 0 },
      paused: false,
      lastActiveDay: t,
      createdOn: t,
      updatedAt: clock.now,
    },
  };
}

// ---------- Quêtes ----------

export function addDaily(state: GameState, input: QuestInput, clock: Clock): EditResult {
  const q = checkQuest(input);
  if (!q.ok) return q;
  const d = begin(state, clock);
  d.state.dailies.push({
    id: clock.newId(), ...q.value, streak: 0, bestStreak: 0,
    lastDoneOn: null, previousDoneOn: null, lastReward: null, createdOn: clock.today,
  });
  return { ok: true, outcome: finalize(d) };
}

export function addMission(state: GameState, input: QuestInput, clock: Clock): EditResult {
  const q = checkQuest(input);
  if (!q.ok) return q;
  const d = begin(state, clock);
  d.state.missions.unshift({ id: clock.newId(), ...q.value, isBonus: false, doneOn: null, createdOn: clock.today });
  return { ok: true, outcome: finalize(d) };
}

export function updateQuest(state: GameState, id: string, input: QuestInput, clock: Clock): EditResult {
  const q = checkQuest(input);
  if (!q.ok) return q;
  const d = begin(state, clock);
  const target = d.state.dailies.find((x) => x.id === id) ?? d.state.missions.find((x) => x.id === id);
  if (!target) return { ok: false, error: "Cette quête n'existe plus" };
  Object.assign(target, q.value);
  return { ok: true, outcome: finalize(d) };
}

export function removeQuest(state: GameState, id: string, clock: Clock): Outcome {
  const d = begin(state, clock);
  d.state.dailies = d.state.dailies.filter((x) => x.id !== id);
  d.state.missions = d.state.missions.filter((x) => x.id !== id);
  return finalize(d);
}

// ---------- Boss ----------

export interface BossInput {
  name: string;
  alias: string;
  stat: string;
  /** Nombre d'étapes ; ignoré lors d'une modification. */
  steps: number;
  deadline: string;
}

function checkBoss(input: BossInput): Check<{ name: string; alias: string; stat: StatId; deadline: DayISO | null }> {
  const name = cleanText(input.name, 60, "L'objectif");
  if (!name.ok) return name;
  const aliasRaw = input.alias.replace(/\s+/g, " ").trim();
  if (aliasRaw.length > 60) return { ok: false, error: "Nom de monstre : 60 caractères maximum" };
  if (!isStat(input.stat)) return { ok: false, error: "Statistique inconnue" };
  if (input.deadline && !isDayISO(input.deadline)) return { ok: false, error: "Date limite invalide" };
  return { ok: true, value: { name: name.value, alias: aliasRaw, stat: input.stat, deadline: input.deadline || null } };
}

export function addBoss(state: GameState, input: BossInput, clock: Clock): EditResult {
  const b = checkBoss(input);
  if (!b.ok) return b;
  if (!Number.isInteger(input.steps) || input.steps < BOSS.minHp || input.steps > BOSS.maxHp) {
    return { ok: false, error: `Le boss doit avoir entre ${BOSS.minHp} et ${BOSS.maxHp} étapes` };
  }
  const d = begin(state, clock);
  d.state.bosses.push({ id: clock.newId(), ...b.value, hp: input.steps, maxHp: input.steps, createdOn: clock.today, defeatedOn: null });
  addJournal(d, `🐉 Nouveau boss : ${b.value.name}`);
  return { ok: true, outcome: finalize(d) };
}

export function updateBoss(state: GameState, id: string, input: BossInput, clock: Clock): EditResult {
  const b = checkBoss(input);
  if (!b.ok) return b;
  const d = begin(state, clock);
  const boss = d.state.bosses.find((x) => x.id === id);
  if (!boss) return { ok: false, error: "Ce boss n'existe plus" };
  Object.assign(boss, b.value);
  return { ok: true, outcome: finalize(d) };
}

export function removeBoss(state: GameState, id: string, clock: Clock): Outcome {
  const d = begin(state, clock);
  d.state.bosses = d.state.bosses.filter((x) => x.id !== id);
  return finalize(d);
}

// ---------- Boutique ----------

export interface ShopItemInput {
  title: string;
  cost: number;
  icon: string;
}

export const SHOP_ICONS = ["🎁", "📺", "🎮", "🍔", "🍕", "🍫", "🎬", "👟", "📚", "✈️", "🎧", "☕"] as const;

function checkItem(input: ShopItemInput): Check<ShopItemInput> {
  const title = cleanText(input.title, 60, "La récompense");
  if (!title.ok) return title;
  if (!Number.isInteger(input.cost) || input.cost < 1 || input.cost > 99_999) return { ok: false, error: "Le prix doit être entre 1 et 99 999" };
  if (!(SHOP_ICONS as readonly string[]).includes(input.icon)) return { ok: false, error: "Icône inconnue" };
  return { ok: true, value: { title: title.value, cost: input.cost, icon: input.icon } };
}

export function addShopItem(state: GameState, input: ShopItemInput, clock: Clock): EditResult {
  const v = checkItem(input);
  if (!v.ok) return v;
  const d = begin(state, clock);
  d.state.shop.push({ id: clock.newId(), ...v.value, timesBought: 0 });
  return { ok: true, outcome: finalize(d) };
}

export function updateShopItem(state: GameState, id: string, input: ShopItemInput, clock: Clock): EditResult {
  const v = checkItem(input);
  if (!v.ok) return v;
  const d = begin(state, clock);
  const item = d.state.shop.find((x) => x.id === id);
  if (!item) return { ok: false, error: "Cette récompense n'existe plus" };
  Object.assign(item, v.value);
  return { ok: true, outcome: finalize(d) };
}

export function removeShopItem(state: GameState, id: string, clock: Clock): Outcome {
  const d = begin(state, clock);
  d.state.shop = d.state.shop.filter((x) => x.id !== id);
  return finalize(d);
}

// ---------- Héros ----------

export interface HeroInput {
  name: string;
  avatarSeed: string;
  avatarStyle: string;
}

export function updateHero(state: GameState, input: HeroInput, clock: Clock): EditResult {
  const name = cleanText(input.name, NAME_MAX, "Le nom du héros");
  if (!name.ok) return name;
  const seed = input.avatarSeed.trim().slice(0, 40) || name.value;
  if (!isAvatarStyle(input.avatarStyle)) return { ok: false, error: "Style d'avatar inconnu" };
  const d = begin(state, clock);
  d.state.hero = { name: name.value, avatarSeed: seed, avatarStyle: input.avatarStyle };
  return { ok: true, outcome: finalize(d) };
}
