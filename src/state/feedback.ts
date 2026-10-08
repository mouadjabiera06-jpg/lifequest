// Traduit les événements du jeu en messages pour le joueur (notifications et écrans plein écran).
import { statInfo } from "../domain/rules";
import type { GameEvent } from "../domain/types";

export interface Toast {
  id: number;
  text: string;
}

export interface Overlay {
  id: number;
  icon: string;
  title: string;
  body: string;
  cta: string;
  celebrate: boolean;
}

export interface Feedback {
  toasts: string[];
  overlays: Omit<Overlay, "id">[];
}

export function describeEvents(events: readonly GameEvent[]): Feedback {
  const toasts: string[] = [];
  const overlays: Omit<Overlay, "id">[] = [];

  for (const e of events) {
    switch (e.kind) {
      case "reward":
        toasts.push(`+${e.xp} XP ${statInfo(e.stat).icon}  ·  +${e.gold} 🪙`);
        break;
      case "info":
        toasts.push(e.message);
        break;
      case "achievement":
        toasts.push(`🏆 Succès débloqué : ${e.name}`);
        break;
      case "levelUp":
        overlays.push({
          icon: "⬆️",
          title: `Niveau ${e.level} !`,
          body: e.newRank ? `Nouveau rang : ${e.newRank}. Tes PV sont restaurés.` : "Tes PV sont restaurés. Continue comme ça !",
          cta: "Continuer",
          celebrate: true,
        });
        break;
      case "bossDefeated":
        overlays.push({
          icon: "🏆",
          title: "Boss vaincu !",
          body: `${e.name} est tombé. Butin : +${e.xp} XP et +${e.gold} pièces d'or.`,
          cta: "Victoire !",
          celebrate: true,
        });
        break;
      case "dayPassed": {
        const parts: string[] = [];
        if (e.missed.length) parts.push(`Quêtes ratées hier : ${e.missed.join(", ")}.`);
        if (e.bossHits.length) parts.push(`Boss en retard qui t'attaquent : ${e.bossHits.join(", ")}.`);
        parts.push(
          e.knockedOut
            ? `Tu perds ${e.goldLost} pièces d'or, mais tu repars avec tous tes PV.`
            : "Tes PV remontent quand tu termines des quêtes.",
        );
        overlays.push({
          icon: e.knockedOut ? "☠️" : "💥",
          title: e.knockedOut ? "K.O. !" : `Aïe… −${e.damage} PV`,
          body: parts.join(" "),
          cta: "Je me relève",
          celebrate: false,
        });
        break;
      }
    }
  }
  return { toasts, overlays };
}
