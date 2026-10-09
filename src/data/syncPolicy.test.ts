import { describe, expect, it } from "vitest";
import { toggleDaily } from "../domain/game";
import { clockAt, newGame } from "../domain/testing";
import { decideSync, type SyncMeta } from "./syncPolicy";

const user = "user-1";
const played = (() => {
  const g = newGame();
  return toggleDaily(g, g.dailies[0]!.id, clockAt("2026-10-08", 2)).state;
})();
const otherPlayed = { ...played, xp: 500, updatedAt: 99 };
const linked = (base: number, dirty: boolean): SyncMeta => ({ userId: user, baseRevision: base, dirty });
const unlinked: SyncMeta = { userId: null, baseRevision: null, dirty: true };

describe("décision de synchronisation", () => {
  it("crée la sauvegarde en ligne si elle n'existe pas", () => {
    expect(decideSync(played, unlinked, user, null)).toBe("create-remote");
  });

  it("récupère la sauvegarde en ligne sur un appareil neuf", () => {
    expect(decideSync(null, unlinked, user, { revision: 4, state: otherPlayed })).toBe("adopt-remote");
    expect(decideSync(newGame(), unlinked, user, { revision: 4, state: otherPlayed })).toBe("adopt-remote");
  });

  it("signale un conflit au premier rattachement si deux parties différentes existent", () => {
    expect(decideSync(played, unlinked, user, { revision: 4, state: otherPlayed })).toBe("conflict");
  });

  it("envoie les changements locaux quand personne d'autre n'a écrit", () => {
    expect(decideSync(played, linked(4, true), user, { revision: 4, state: otherPlayed })).toBe("push");
    expect(decideSync(played, linked(4, false), user, { revision: 4, state: otherPlayed })).toBe("noop");
  });

  it("prend la version en ligne si un autre appareil a avancé et que celui-ci n'a rien changé", () => {
    expect(decideSync(played, linked(4, false), user, { revision: 6, state: otherPlayed })).toBe("adopt-remote");
  });

  it("signale un conflit si les deux appareils ont changé", () => {
    expect(decideSync(played, linked(4, true), user, { revision: 6, state: otherPlayed })).toBe("conflict");
  });

  it("traite un autre compte comme un premier rattachement", () => {
    expect(decideSync(played, { userId: "user-2", baseRevision: 4, dirty: false }, user, { revision: 4, state: otherPlayed })).toBe("conflict");
  });
});
