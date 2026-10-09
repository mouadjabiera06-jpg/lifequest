import { heroLevel, statLevel } from "./progression";
import { STAT_IDS } from "./rules";
import type { GameState } from "./types";

export interface Achievement {
  id: string;
  icon: string;
  name: string;
  description: string;
  isUnlocked: (state: GameState) => boolean;
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: "first", icon: "👣", name: "Premier pas", description: "Terminer 1 quête", isUnlocked: (s) => s.counters.questsDone >= 1 },
  { id: "q50", icon: "⚒️", name: "Travailleur", description: "Terminer 50 quêtes", isUnlocked: (s) => s.counters.questsDone >= 50 },
  { id: "q250", icon: "🏛️", name: "Bâtisseur", description: "Terminer 250 quêtes", isUnlocked: (s) => s.counters.questsDone >= 250 },
  { id: "streak7", icon: "🔥", name: "Régulier", description: "Série de 7 jours", isUnlocked: (s) => s.counters.bestStreak >= 7 },
  { id: "streak30", icon: "☄️", name: "Inarrêtable", description: "Série de 30 jours", isUnlocked: (s) => s.counters.bestStreak >= 30 },
  { id: "lvl5", icon: "🌱", name: "Apprenti", description: "Atteindre le niveau 5", isUnlocked: (s) => heroLevel(s.xp).level >= 5 },
  { id: "lvl10", icon: "🗺️", name: "Aventurier", description: "Atteindre le niveau 10", isUnlocked: (s) => heroLevel(s.xp).level >= 10 },
  { id: "lvl20", icon: "🛡️", name: "Héros", description: "Atteindre le niveau 20", isUnlocked: (s) => heroLevel(s.xp).level >= 20 },
  { id: "boss1", icon: "⚔️", name: "Tueur de boss", description: "Vaincre 1 boss", isUnlocked: (s) => s.counters.bossesDefeated >= 1 },
  { id: "boss5", icon: "🐉", name: "Chasseur", description: "Vaincre 5 boss", isUnlocked: (s) => s.counters.bossesDefeated >= 5 },
  { id: "reward1", icon: "🎁", name: "Bien mérité", description: "Acheter 1 récompense", isUnlocked: (s) => s.counters.rewardsBought >= 1 },
  { id: "bonus5", icon: "🎲", name: "Curieux", description: "Finir 5 quêtes bonus", isUnlocked: (s) => s.counters.bonusDone >= 5 },
  {
    id: "all3",
    icon: "⭐",
    name: "Polyvalent",
    description: "Toutes les stats au niveau 3",
    isUnlocked: (s) => STAT_IDS.every((id) => statLevel(s.statXp[id]).level >= 3),
  },
  { id: "rich", icon: "👑", name: "Trésor", description: "Avoir 500 pièces d'or", isUnlocked: (s) => s.gold >= 500 },
];

/** Retourne les succès nouvellement obtenus. Un succès acquis reste acquis, même si la condition retombe. */
export function newlyUnlocked(state: GameState): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !state.achievements[a.id] && a.isUnlocked(state));
}
