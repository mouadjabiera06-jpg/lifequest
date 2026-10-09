// Validation de toute sauvegarde venue de l'extérieur (stockage local, import, cloud)
// et migration des sauvegardes de la V1 (fichier HTML unique).
import { z } from "zod";
import { MAX_HP, NAME_MAX, TITLE_MAX } from "./rules";
import type { GameState } from "./types";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const id = z.string().min(1).max(64);
const count = z.number().int().min(0).max(1e9);
const stat = z.enum(["force", "intel", "charisme", "discipline", "richesse"]);
const difficulty = z.enum(["facile", "moyen", "difficile"]);
const reward = z.object({ xp: count, gold: count });

export const gameStateSchema = z.object({
  version: z.literal(2),
  hero: z.object({
    name: z.string().min(1).max(NAME_MAX),
    avatarSeed: z.string().max(40),
    avatarStyle: z.enum(["pixel-art", "adventurer", "lorelei", "fun-emoji"]),
  }),
  xp: count,
  gold: count,
  hp: z.number().int().min(-1000).max(MAX_HP),
  statXp: z.object({ force: count, intel: count, charisme: count, discipline: count, richesse: count }),
  dailies: z.array(z.object({
    id, title: z.string().min(1).max(TITLE_MAX), stat, difficulty,
    streak: count, bestStreak: count,
    lastDoneOn: day.nullable(), previousDoneOn: day.nullable(), lastReward: reward.nullable(), createdOn: day,
  })).max(200),
  missions: z.array(z.object({
    id, title: z.string().min(1).max(TITLE_MAX), stat, difficulty, isBonus: z.boolean(), doneOn: day.nullable(), createdOn: day,
  })).max(500),
  bosses: z.array(z.object({
    id, name: z.string().min(1).max(60), alias: z.string().max(60), stat,
    hp: count, maxHp: z.number().int().min(1).max(100), deadline: day.nullable(), createdOn: day, defeatedOn: day.nullable(),
  })).max(200),
  shop: z.array(z.object({ id, title: z.string().min(1).max(60), cost: z.number().int().min(1).max(99_999), icon: z.string().max(8), timesBought: count })).max(100),
  achievements: z.record(z.string().max(32), day),
  journal: z.array(z.object({ at: z.number(), text: z.string().max(300) })).max(200),
  activity: z.record(day, count),
  counters: z.object({ questsDone: count, bossesDefeated: count, bonusDone: count, rewardsBought: count, bestStreak: count }),
  paused: z.boolean(),
  lastActiveDay: day,
  createdOn: day,
  updatedAt: z.number(),
});

// Typage vérifié à la compilation : le schéma et le type du domaine ne peuvent pas diverger.
type SchemaOut = z.infer<typeof gameStateSchema>;
const assertSame = (s: SchemaOut): GameState => s;
void assertSame;

export type ParseResult = { ok: true; state: GameState; migrated: boolean } | { ok: false; error: string };

export function parseSave(raw: unknown): ParseResult {
  const candidate = isV1(raw) ? migrateV1(raw) : raw;
  const result = gameStateSchema.safeParse(candidate);
  if (!result.success) return { ok: false, error: "Ce n'est pas une sauvegarde LifeQuest valide" };
  return { ok: true, state: result.data, migrated: candidate !== raw };
}

export function parseSaveText(text: string): ParseResult {
  try {
    return parseSave(JSON.parse(text));
  } catch {
    return { ok: false, error: "Ce texte n'est pas une sauvegarde LifeQuest valide" };
  }
}

// ---------- Migration V1 ----------

type Loose = Record<string, unknown>;

function isV1(raw: unknown): raw is Loose {
  return typeof raw === "object" && raw !== null && (raw as Loose).v === 1 && typeof (raw as Loose).hero === "object";
}

const arr = (v: unknown): Loose[] => (Array.isArray(v) ? (v.filter((x) => typeof x === "object" && x !== null) as Loose[]) : []);
const num = (v: unknown, fallback = 0): number => (typeof v === "number" && Number.isFinite(v) ? Math.floor(v) : fallback);
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const rec = (v: unknown): Loose => (typeof v === "object" && v !== null ? (v as Loose) : {});

function migrateV1(v1: Loose): unknown {
  const hero = rec(v1.hero);
  const stats = rec(v1.stats);
  const counters = rec(v1.counters);
  const today = str(v1.lastDay);
  return {
    version: 2,
    hero: { name: str(hero.name, "Héros").slice(0, NAME_MAX), avatarSeed: str(hero.seed, str(hero.name)).slice(0, 40), avatarStyle: str(hero.style, "pixel-art") },
    xp: num(v1.xp),
    gold: num(v1.gold),
    hp: Math.min(MAX_HP, num(v1.hp, MAX_HP)),
    statXp: { force: num(stats.force), intel: num(stats.intel), charisme: num(stats.charisme), discipline: num(stats.discipline), richesse: num(stats.richesse) },
    dailies: arr(v1.dailies).map((d) => ({
      id: str(d.id), title: str(d.title), stat: d.stat, difficulty: d.diff,
      streak: num(d.streak), bestStreak: num(d.best),
      lastDoneOn: strOrNull(d.doneOn), previousDoneOn: strOrNull(d.prevDoneOn),
      lastReward: d.gain ? { xp: num(rec(d.gain).xp), gold: num(rec(d.gain).gold) } : null,
      createdOn: str(d.created, today),
    })),
    missions: arr(v1.quests).map((q) => ({
      id: str(q.id), title: str(q.title), stat: q.stat, difficulty: q.diff, isBonus: q.bonus === true,
      doneOn: q.done ? str(q.doneAt, today) : null, createdOn: str(q.created, today),
    })),
    bosses: arr(v1.bosses).map((b) => ({
      id: str(b.id), name: str(b.name), alias: str(b.alias), stat: b.stat, hp: num(b.hp), maxHp: num(b.maxHp, 1),
      deadline: strOrNull(b.deadline), createdOn: str(b.created, today), defeatedOn: strOrNull(b.defeatedAt),
    })),
    shop: arr(v1.rewards).map((r) => ({ id: str(r.id), title: str(r.title), cost: num(r.cost, 1), icon: str(r.icon, "🎁"), timesBought: num(r.bought) })),
    achievements: rec(v1.ach),
    journal: arr(v1.log).map((l) => ({ at: num(l.t), text: str(l.txt).slice(0, 300) })),
    activity: rec(v1.history),
    counters: {
      questsDone: num(counters.quests), bossesDefeated: num(counters.bosses), bonusDone: num(counters.bonus),
      rewardsBought: num(counters.rewards), bestStreak: num(counters.bestStreak),
    },
    paused: v1.pause === true,
    lastActiveDay: today,
    createdOn: str(v1.created, today),
    // 0 : une sauvegarde migrée est toujours considérée comme plus ancienne que toute partie en cours.
    updatedAt: 0,
  };
}
