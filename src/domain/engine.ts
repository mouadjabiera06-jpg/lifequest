// Primitives partagées par toutes les commandes du jeu.
// Chaque commande travaille sur une copie (draft) puis passe par `finalize`,
// ce qui garantit que succès, journal et horodatage sont toujours tenus à jour.
import { newlyUnlocked } from "./achievements";
import { addDays } from "./dates";
import { heroLevel, rankFor } from "./progression";
import { ACTIVITY_DAYS_KEPT, JOURNAL_LIMIT, MAX_HP } from "./rules";
import type { Clock, DayISO, GameEvent, GameState, Outcome, Reward, StatId } from "./types";

export interface Draft {
  state: GameState;
  events: GameEvent[];
  clock: Clock;
}

export function begin(state: GameState, clock: Clock): Draft {
  return { state: structuredClone(state), events: [], clock };
}

export function addJournal(d: Draft, text: string): void {
  d.state.journal.unshift({ at: d.clock.now, text });
  if (d.state.journal.length > JOURNAL_LIMIT) d.state.journal.length = JOURNAL_LIMIT;
}

/** Accorde XP et or, soigne de 1 PV, et gère la montée de niveau (PV restaurés). */
export function grant(d: Draft, stat: StatId, reward: Reward, label: string): void {
  const s = d.state;
  const before = heroLevel(s.xp).level;
  s.xp += reward.xp;
  s.statXp[stat] += reward.xp;
  s.gold += reward.gold;
  s.hp = Math.min(MAX_HP, s.hp + 1);
  s.activity[d.clock.today] = (s.activity[d.clock.today] ?? 0) + 1;
  addJournal(d, `✅ ${label} (+${reward.xp} XP, +${reward.gold} or)`);
  d.events.push({ kind: "reward", label, stat, xp: reward.xp, gold: reward.gold });

  const after = heroLevel(s.xp).level;
  if (after > before) {
    s.hp = MAX_HP;
    const oldRank = rankFor(before).name;
    const newRank = rankFor(after).name;
    addJournal(d, `⬆️ Niveau ${after} !`);
    d.events.push({ kind: "levelUp", level: after, newRank: newRank !== oldRank ? newRank : null });
  }
}

/** Retire un gain accordé par erreur (quête décochée). Les PV soignés ne sont pas repris. */
export function revoke(d: Draft, stat: StatId, reward: Reward, day: DayISO): void {
  const s = d.state;
  s.xp = Math.max(0, s.xp - reward.xp);
  s.statXp[stat] = Math.max(0, s.statXp[stat] - reward.xp);
  s.gold = Math.max(0, s.gold - reward.gold);
  const count = s.activity[day] ?? 0;
  if (count > 1) s.activity[day] = count - 1;
  else s.activity = Object.fromEntries(Object.entries(s.activity).filter(([d]) => d !== day));
}

function pruneActivity(state: GameState, today: DayISO): void {
  const oldest = addDays(today, -ACTIVITY_DAYS_KEPT);
  state.activity = Object.fromEntries(Object.entries(state.activity).filter(([day]) => day >= oldest));
}

export function finalize(d: Draft): Outcome {
  for (const a of newlyUnlocked(d.state)) {
    d.state.achievements[a.id] = d.clock.today;
    addJournal(d, `🏆 Succès : ${a.name}`);
    d.events.push({ kind: "achievement", id: a.id, name: a.name });
  }
  pruneActivity(d.state, d.clock.today);
  d.state.updatedAt = d.clock.now;
  return { state: d.state, events: d.events };
}

/** Résultat d'une commande refusée : l'état est inchangé, le joueur est informé. */
export function refuse(state: GameState, message: string): Outcome {
  return { state, events: [{ kind: "info", message }] };
}

export function unchanged(state: GameState): Outcome {
  return { state, events: [] };
}
