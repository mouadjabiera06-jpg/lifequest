import { describe, expect, it } from "vitest";
import { parseSave, parseSaveText } from "./schema";
import { newGame } from "./testing";

describe("validation des sauvegardes", () => {
  it("accepte une partie valide telle quelle", () => {
    const g = newGame();
    const r = parseSave(JSON.parse(JSON.stringify(g)));
    expect(r).toEqual({ ok: true, state: g, migrated: false });
  });

  it("refuse un texte qui n'est pas du JSON ou une partie trafiquée", () => {
    expect(parseSaveText("bonjour").ok).toBe(false);
    expect(parseSave({ ...newGame(), gold: -5 }).ok).toBe(false);
    expect(parseSave({ ...newGame(), hero: { name: "<script>".repeat(10), avatarSeed: "", avatarStyle: "pixel-art" } }).ok).toBe(false);
  });

  it("migre une sauvegarde de la V1", () => {
    const v1 = {
      v: 1,
      hero: { name: "Mouad", seed: "Mouad", style: "lorelei" },
      xp: 130, gold: 42, hp: 47,
      stats: { force: 60, intel: 70, charisme: 0, discipline: 0, richesse: 0 },
      dailies: [{ id: "a", title: "Sport", stat: "force", diff: "moyen", streak: 3, best: 5, doneOn: "2026-10-08", created: "2026-10-01", gain: { xp: 26, gold: 10 } }],
      quests: [{ id: "b", title: "Ranger", stat: "discipline", diff: "facile", done: true, doneAt: "2026-10-07", bonus: true, created: "2026-10-01" }],
      bosses: [{ id: "c", name: "Partiel", alias: "", stat: "intel", hp: 0, maxHp: 3, deadline: null, created: "2026-10-01", defeatedAt: "2026-10-08" }],
      rewards: [{ id: "d", title: "Resto", cost: 250, icon: "🍔", bought: 1 }],
      ach: { first: "2026-10-01" },
      log: [{ t: 1, txt: "Bonjour" }],
      history: { "2026-10-08": 2 },
      counters: { quests: 12, bosses: 1, bonus: 1, rewards: 1, bestStreak: 5 },
      pause: false, lastDay: "2026-10-08", created: "2026-10-01",
    };
    const r = parseSave(v1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.migrated).toBe(true);
    expect(r.state.hero.avatarStyle).toBe("lorelei");
    expect(r.state.dailies[0]).toMatchObject({ difficulty: "moyen", bestStreak: 5, lastReward: { xp: 26, gold: 10 } });
    expect(r.state.missions[0]).toMatchObject({ isBonus: true, doneOn: "2026-10-07" });
    expect(r.state.bosses[0]!.defeatedOn).toBe("2026-10-08");
    expect(r.state.shop[0]!.timesBought).toBe(1);
    expect(r.state.counters.questsDone).toBe(12);
  });
});
