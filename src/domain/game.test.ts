import { describe, expect, it } from "vitest";
import { addBoss, addDaily, addShopItem, cleanText, createGame } from "./editing";
import {
  acceptBonusQuest, attackBoss, buyPotion, buyShopItem, drawBonusQuest, quoteOfTheDay,
  setPaused, startNewDay, toggleDaily, toggleMission,
} from "./game";
import { heroLevel, rankFor, statLevel, streakMultiplier } from "./progression";
import { MAX_HP } from "./rules";
import { clockAt, newGame } from "./testing";
import type { GameState } from "./types";

const DAY = "2026-10-08";
const NEXT = "2026-10-09";
const c = clockAt(DAY);
const first = (s: GameState) => s.dailies[0]!;

describe("progression", () => {
  it("demande 100 XP pour le niveau 2, puis 150 de plus pour le 3", () => {
    expect(heroLevel(0)).toEqual({ level: 1, current: 0, needed: 100 });
    expect(heroLevel(99).level).toBe(1);
    expect(heroLevel(100)).toEqual({ level: 2, current: 0, needed: 150 });
    expect(heroLevel(250).level).toBe(3);
  });

  it("donne un niveau de stat indépendant", () => {
    expect(statLevel(59).level).toBe(1);
    expect(statLevel(60).level).toBe(2);
  });

  it("attribue les rangs par paliers de niveau", () => {
    expect(rankFor(1).name).toBe("Novice");
    expect(rankFor(9).name).toBe("Apprenti");
    expect(rankFor(50).name).toBe("Légende");
  });

  it("plafonne le bonus de série à +50 %", () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(30)).toBe(1.5);
    expect(streakMultiplier(300)).toBe(1.5);
  });
});

describe("nouvelle partie", () => {
  it("refuse un nom vide ou un style inconnu", () => {
    expect(createGame({ name: "   ", avatarStyle: "pixel-art" }, c).ok).toBe(false);
    expect(createGame({ name: "Mouad", avatarStyle: "inconnu" }, c).ok).toBe(false);
  });

  it("démarre avec tous les PV et des quêtes d'exemple", () => {
    const g = newGame();
    expect(g.hp).toBe(MAX_HP);
    expect(g.dailies.length).toBeGreaterThan(0);
    expect(g.lastActiveDay).toBe(DAY);
  });
});

describe("quotidiennes", () => {
  it("accorde XP, or et stat, puis rend tout si on décoche le jour même", () => {
    const g = newGame();
    const done = toggleDaily(g, first(g).id, c).state;
    expect(done.xp).toBe(10);
    expect(done.gold).toBe(5);
    expect(done.statXp.force).toBe(10);
    expect(first(done).streak).toBe(1);
    expect(done.activity[DAY]).toBe(1);

    const undone = toggleDaily(done, first(done).id, c).state;
    expect(undone.xp).toBe(0);
    expect(undone.gold).toBe(0);
    expect(first(undone).streak).toBe(0);
    expect(first(undone).lastDoneOn).toBeNull();
    expect(undone.activity[DAY]).toBeUndefined();
  });

  it("ne modifie jamais l'état d'origine", () => {
    const g = newGame();
    const snapshot = structuredClone(g);
    toggleDaily(g, first(g).id, c);
    expect(g).toEqual(snapshot);
  });

  it("augmente l'XP avec la série", () => {
    let g = newGame();
    const id = first(g).id;
    g = toggleDaily(g, id, c).state;
    g = startNewDay(g, clockAt(NEXT)).state;
    g = toggleDaily(g, id, clockAt(NEXT)).state;
    expect(first(g).streak).toBe(2);
    expect(first(g).lastReward?.xp).toBe(Math.round(10 * streakMultiplier(2)));
  });

  it("monte de niveau et restaure les PV", () => {
    let g = { ...newGame(), xp: 95, hp: 10 };
    const out = toggleDaily(g, first(g).id, c);
    g = out.state;
    expect(heroLevel(g.xp).level).toBe(2);
    expect(g.hp).toBe(MAX_HP);
    expect(out.events.some((e) => e.kind === "levelUp")).toBe(true);
  });

  it("débloque le succès « Premier pas » une seule fois", () => {
    const g = newGame();
    const out = toggleDaily(g, first(g).id, c);
    expect(out.events.filter((e) => e.kind === "achievement")).toHaveLength(1);
    const again = toggleDaily(out.state, out.state.dailies[1]!.id, c);
    expect(again.events.filter((e) => e.kind === "achievement")).toHaveLength(0);
  });
});

describe("passage au jour suivant", () => {
  it("ne fait rien si le jour n'a pas changé", () => {
    const g = newGame();
    expect(startNewDay(g, c).state).toBe(g);
  });

  it("inflige les dégâts des quotidiennes ratées et garde les séries tenues", () => {
    let g = newGame();
    for (const d of g.dailies.slice(0, 4)) g = toggleDaily(g, d.id, c).state;
    const out = startNewDay(g, clockAt(NEXT));
    const missed = g.dailies[4]!;
    expect(out.state.hp).toBe(MAX_HP - 3);
    expect(out.state.dailies[0]!.streak).toBe(1);
    expect(out.state.dailies[4]!.streak).toBe(0);
    expect(out.events).toContainEqual(expect.objectContaining({ kind: "dayPassed", damage: 3, missed: [missed.title] }));
    expect(out.state.lastActiveDay).toBe(NEXT);
  });

  it("casse les séries après plusieurs jours d'absence, sans punir plusieurs fois", () => {
    let g = newGame();
    for (const d of g.dailies) g = toggleDaily(g, d.id, c).state;
    const out = startNewDay(g, clockAt("2026-10-12"));
    expect(out.state.hp).toBe(MAX_HP);
    expect(out.state.dailies.every((d) => d.streak === 0)).toBe(true);
  });

  it("met K.O. à 0 PV : moitié de l'or perdue, PV restaurés", () => {
    const g = { ...newGame(), hp: 5, gold: 101 };
    const out = startNewDay(g, clockAt(NEXT));
    expect(out.state.gold).toBe(51);
    expect(out.state.hp).toBe(MAX_HP);
    expect(out.events).toContainEqual(expect.objectContaining({ kind: "dayPassed", knockedOut: true, goldLost: 50 }));
  });

  it("ne punit pas en mode pause", () => {
    const g = setPaused(newGame(), true, c).state;
    const out = startNewDay(g, clockAt(NEXT));
    expect(out.state.hp).toBe(MAX_HP);
    expect(out.events).toHaveLength(0);
  });

  it("ignore les quotidiennes créées après le dernier jour actif", () => {
    const g = { ...newGame(), dailies: [] };
    const added = addDaily(g, { title: "Méditer", stat: "discipline", difficulty: "moyen" }, clockAt(NEXT));
    if (!added.ok) throw new Error(added.error);
    const out = startNewDay(added.outcome.state, clockAt(NEXT));
    expect(out.state.hp).toBe(MAX_HP);
  });
});

describe("boss", () => {
  function withBoss(steps = 2, deadline = "") {
    const r = addBoss({ ...newGame(), dailies: [] }, { name: "Partiel", alias: "", stat: "intel", steps, deadline }, c);
    if (!r.ok) throw new Error(r.error);
    return r.outcome.state;
  }

  it("refuse un nombre d'étapes hors limites", () => {
    expect(addBoss(newGame(), { name: "X", alias: "", stat: "intel", steps: 1, deadline: "" }, c).ok).toBe(false);
  });

  it("donne le butin une seule fois à la victoire", () => {
    let g = withBoss(2);
    const id = g.bosses[0]!.id;
    g = attackBoss(g, id, c).state;
    const win = attackBoss(g, id, c);
    expect(win.state.bosses[0]!.defeatedOn).toBe(DAY);
    expect(win.state.counters.bossesDefeated).toBe(1);
    expect(win.events).toContainEqual({ kind: "bossDefeated", name: "Partiel", xp: 40, gold: 20 });
    expect(attackBoss(win.state, id, c).state).toBe(win.state);
  });

  it("attaque le joueur après la date limite, avec un retard plafonné", () => {
    const g = withBoss(5, "2026-10-01");
    // Un jour écoulé depuis la dernière visite : un seul coup.
    expect(startNewDay(g, clockAt(NEXT)).state.hp).toBe(MAX_HP - 5);
    // Une semaine d'absence : 3 coups au maximum.
    expect(startNewDay(g, clockAt("2026-10-15")).state.hp).toBe(MAX_HP - 15);
  });
});

describe("boutique et missions", () => {
  it("refuse un achat sans assez d'or, sans modifier l'état", () => {
    const g = newGame();
    const out = buyShopItem(g, g.shop[0]!.id, c);
    expect(out.state).toBe(g);
    expect(out.events[0]).toEqual({ kind: "info", message: "Il te manque 30 pièces d'or" });
  });

  it("débite l'or et compte l'achat", () => {
    const g = { ...newGame(), gold: 40 };
    const out = buyShopItem(g, g.shop[0]!.id, c);
    expect(out.state.gold).toBe(10);
    expect(out.state.shop[0]!.timesBought).toBe(1);
    expect(out.state.achievements.reward1).toBe(DAY);
  });

  it("refuse une potion quand les PV sont pleins", () => {
    expect(buyPotion({ ...newGame(), gold: 100 }, c).state.gold).toBe(100);
    expect(buyPotion({ ...newGame(), gold: 100, hp: 10 }, c).state.hp).toBe(30);
  });

  it("compte les quêtes bonus terminées", () => {
    let g = acceptBonusQuest(newGame(), drawBonusQuest(0.5), c).state;
    g = toggleMission(g, g.missions[0]!.id, c).state;
    expect(g.counters.bonusDone).toBe(1);
    g = toggleMission(g, g.missions[0]!.id, c).state;
    expect(g.counters.bonusDone).toBe(0);
    expect(g.xp).toBe(0);
  });

  it("valide les récompenses créées", () => {
    expect(addShopItem(newGame(), { title: "Ciné", cost: 0, icon: "🎬" }, c).ok).toBe(false);
    expect(addShopItem(newGame(), { title: "Ciné", cost: 50, icon: "💣" }, c).ok).toBe(false);
    expect(addShopItem(newGame(), { title: "Ciné", cost: 50, icon: "🎬" }, c).ok).toBe(true);
  });
});

describe("divers", () => {
  it("nettoie les saisies", () => {
    expect(cleanText("  Lire\n  un   livre ", 80, "x")).toEqual({ ok: true, value: "Lire un livre" });
    expect(cleanText("a".repeat(81), 80, "x").ok).toBe(false);
  });

  it("tire toujours une quête bonus valide, même en bord d'intervalle", () => {
    expect(drawBonusQuest(0).title).toBeTruthy();
    expect(drawBonusQuest(0.9999999).title).toBeTruthy();
  });

  it("change de citation chaque jour", () => {
    expect(quoteOfTheDay(DAY)).not.toEqual(quoteOfTheDay(NEXT));
  });
});
