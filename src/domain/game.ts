// Commandes de jeu : chacune prend un état et renvoie un nouvel état + les événements produits.
import { BONUS_QUESTS, QUOTES, type BonusQuest, type Quote } from "./content";
import { daysBetween } from "./dates";
import { addJournal, begin, finalize, grant, refuse, revoke, unchanged } from "./engine";
import { streakMultiplier } from "./progression";
import { BOSS, DIFFICULTIES, MAX_HP, POTION } from "./rules";
import type { Clock, GameState, Outcome } from "./types";

export function toggleDaily(state: GameState, id: string, clock: Clock): Outcome {
  const d = begin(state, clock);
  const daily = d.state.dailies.find((x) => x.id === id);
  if (!daily) return unchanged(state);

  if (daily.lastDoneOn === clock.today) {
    if (daily.lastReward) revoke(d, daily.stat, daily.lastReward, clock.today);
    daily.lastDoneOn = daily.previousDoneOn;
    daily.streak = Math.max(0, daily.streak - 1);
    daily.lastReward = null;
    d.state.counters.questsDone = Math.max(0, d.state.counters.questsDone - 1);
    d.events.push({ kind: "info", message: "Quête décochée" });
    return finalize(d);
  }

  daily.previousDoneOn = daily.lastDoneOn;
  daily.lastDoneOn = clock.today;
  daily.streak += 1;
  daily.bestStreak = Math.max(daily.bestStreak, daily.streak);
  d.state.counters.bestStreak = Math.max(d.state.counters.bestStreak, daily.streak);
  d.state.counters.questsDone += 1;
  const base = DIFFICULTIES[daily.difficulty];
  const reward = { xp: Math.round(base.xp * streakMultiplier(daily.streak)), gold: base.gold };
  daily.lastReward = reward;
  grant(d, daily.stat, reward, daily.title);
  return finalize(d);
}

export function toggleMission(state: GameState, id: string, clock: Clock): Outcome {
  const d = begin(state, clock);
  const mission = d.state.missions.find((x) => x.id === id);
  if (!mission) return unchanged(state);
  const base = DIFFICULTIES[mission.difficulty];
  const reward = { xp: base.xp, gold: base.gold };
  const counters = d.state.counters;

  if (mission.doneOn) {
    revoke(d, mission.stat, reward, mission.doneOn);
    mission.doneOn = null;
    counters.questsDone = Math.max(0, counters.questsDone - 1);
    if (mission.isBonus) counters.bonusDone = Math.max(0, counters.bonusDone - 1);
    d.events.push({ kind: "info", message: "Mission décochée" });
    return finalize(d);
  }

  mission.doneOn = clock.today;
  counters.questsDone += 1;
  if (mission.isBonus) counters.bonusDone += 1;
  grant(d, mission.stat, reward, mission.title);
  return finalize(d);
}

export function clearDoneMissions(state: GameState, clock: Clock): Outcome {
  const d = begin(state, clock);
  d.state.missions = d.state.missions.filter((m) => !m.doneOn);
  return finalize(d);
}

export function attackBoss(state: GameState, id: string, clock: Clock): Outcome {
  const d = begin(state, clock);
  const boss = d.state.bosses.find((b) => b.id === id);
  if (!boss || boss.defeatedOn) return unchanged(state);

  boss.hp = Math.max(0, boss.hp - 1);
  grant(d, boss.stat, BOSS.hit, `Attaque sur ${boss.name}`);

  if (boss.hp === 0) {
    boss.defeatedOn = clock.today;
    d.state.counters.bossesDefeated += 1;
    const loot = { xp: boss.maxHp * BOSS.lootPerHp.xp, gold: boss.maxHp * BOSS.lootPerHp.gold };
    grant(d, boss.stat, loot, `Boss vaincu : ${boss.name}`);
    d.events.push({ kind: "bossDefeated", name: boss.name, xp: loot.xp, gold: loot.gold });
  }
  return finalize(d);
}

export function buyShopItem(state: GameState, id: string, clock: Clock): Outcome {
  const item = state.shop.find((x) => x.id === id);
  if (!item) return unchanged(state);
  if (state.gold < item.cost) return refuse(state, `Il te manque ${item.cost - state.gold} pièces d'or`);

  const d = begin(state, clock);
  const draftItem = d.state.shop.find((x) => x.id === id);
  if (!draftItem) return unchanged(state);
  d.state.gold -= draftItem.cost;
  draftItem.timesBought += 1;
  d.state.counters.rewardsBought += 1;
  addJournal(d, `🎁 Récompense : ${draftItem.title} (−${draftItem.cost} or)`);
  d.events.push({ kind: "info", message: `${draftItem.icon} Profite bien : tu l'as mérité !` });
  return finalize(d);
}

export function buyPotion(state: GameState, clock: Clock): Outcome {
  if (state.hp >= MAX_HP) return refuse(state, "Tes PV sont déjà au maximum");
  if (state.gold < POTION.cost) return refuse(state, `Il te manque ${POTION.cost - state.gold} pièces d'or`);
  const d = begin(state, clock);
  d.state.gold -= POTION.cost;
  d.state.hp = Math.min(MAX_HP, d.state.hp + POTION.heal);
  addJournal(d, `🧪 Potion de soin (+${POTION.heal} PV)`);
  d.events.push({ kind: "info", message: `🧪 +${POTION.heal} PV` });
  return finalize(d);
}

export function setPaused(state: GameState, paused: boolean, clock: Clock): Outcome {
  if (state.paused === paused) return unchanged(state);
  const d = begin(state, clock);
  d.state.paused = paused;
  addJournal(d, paused ? "🏖️ Mode pause activé" : "⚔️ Retour à l'aventure");
  return finalize(d);
}

/**
 * Passage au jour suivant : chaque quotidienne non faite le dernier jour actif coûte des PV
 * et casse sa série ; un boss en retard frappe (au plus 3 jours de retard comptés).
 * Un jour sans ouvrir l'app casse les séries, mais ne pénalise qu'une fois.
 */
export function startNewDay(state: GameState, clock: Clock): Outcome {
  const last = state.lastActiveDay;
  if (last >= clock.today) return unchanged(state);

  const d = begin(state, clock);
  const s = d.state;
  const gap = daysBetween(last, clock.today);
  const missed: string[] = [];
  const bossHits: string[] = [];
  let damage = 0;

  if (!s.paused) {
    for (const daily of s.dailies) {
      if (daily.createdOn > last) continue;
      if (daily.lastDoneOn !== last) {
        missed.push(daily.title);
        damage += DIFFICULTIES[daily.difficulty].damage;
        daily.streak = 0;
      } else if (gap > 1) {
        daily.streak = 0;
      }
    }
    for (const boss of s.bosses) {
      if (boss.defeatedOn || !boss.deadline || boss.deadline >= clock.today) continue;
      const from = boss.deadline > last ? boss.deadline : last;
      const lateDays = Math.min(daysBetween(from, clock.today), BOSS.maxLateDays);
      if (lateDays > 0) {
        damage += BOSS.lateDamagePerDay * lateDays;
        bossHits.push(boss.name);
      }
    }
  }

  s.lastActiveDay = clock.today;
  if (damage === 0) return finalize(d);

  s.hp -= damage;
  addJournal(d, `💥 −${damage} PV (quêtes ratées)`);
  let goldLost = 0;
  const knockedOut = s.hp <= 0;
  if (knockedOut) {
    goldLost = Math.floor(s.gold / 2);
    s.gold -= goldLost;
    s.hp = MAX_HP;
    addJournal(d, `☠️ K.O. ! −${goldLost} or`);
  }
  d.events.push({ kind: "dayPassed", damage, missed, bossHits, knockedOut, goldLost });
  return finalize(d);
}

/** `random` dans [0, 1[ — injecté pour que le tirage soit testable. */
export function drawBonusQuest(random: number): BonusQuest {
  const index = Math.min(BONUS_QUESTS.length - 1, Math.floor(random * BONUS_QUESTS.length));
  return BONUS_QUESTS[index] as BonusQuest;
}

export function acceptBonusQuest(state: GameState, quest: BonusQuest, clock: Clock): Outcome {
  const d = begin(state, clock);
  d.state.missions.unshift({
    id: clock.newId(),
    title: quest.title,
    stat: quest.stat,
    difficulty: "moyen",
    isBonus: true,
    doneOn: null,
    createdOn: clock.today,
  });
  d.events.push({ kind: "info", message: "🎲 Quête bonus ajoutée" });
  return finalize(d);
}

export function quoteOfTheDay(today: string): Quote {
  const n = QUOTES.length;
  const index = ((daysBetween("2024-01-01", today) % n) + n) % n;
  return QUOTES[index] as Quote;
}
