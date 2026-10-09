import { buyPotion, buyShopItem } from "../../domain/game";
import { POTION } from "../../domain/rules";
import type { GameState } from "../../domain/types";
import { play } from "../../state/store";
import { SectionTitle } from "../components/basics";
import { openShopItemForm } from "../forms/forms";

export function ShopScreen({ game }: { game: GameState }) {
  return (
    <>
      <SectionTitle action={<span className="chip gold">🪙 {game.gold}</span>}>🛒 Boutique</SectionTitle>
      <div className="grid2">
        <div className="reward">
          <span className="em" aria-hidden="true">🧪</span>
          <span className="t">
            Potion de soin
            <br />
            <small style={{ color: "var(--mut)", fontWeight: 500 }}>+{POTION.heal} PV</small>
          </span>
          <button className="btn gold small" type="button" onClick={() => play(buyPotion)} aria-label={`Acheter une potion de soin pour ${POTION.cost} pièces d'or`}>
            {POTION.cost} 🪙
          </button>
        </div>
        {game.shop.map((item) => (
          <div key={item.id} className="reward">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="em" aria-hidden="true">{item.icon}</span>
              <button className="more" type="button" aria-label={`Modifier : ${item.title}`} onClick={() => openShopItemForm(item)}>⋯</button>
            </div>
            <span className="t">
              {item.title}
              {item.timesBought > 0 && (
                <>
                  <br />
                  <small style={{ color: "var(--dim)", fontWeight: 500 }}>obtenu {item.timesBought} fois</small>
                </>
              )}
            </span>
            <button className="btn gold small" type="button" disabled={game.gold < item.cost} onClick={() => play((s, c) => buyShopItem(s, item.id, c))}
              aria-label={`Acheter ${item.title} pour ${item.cost} pièces d'or`}>
              {item.cost} 🪙
            </button>
          </div>
        ))}
      </div>
      <p style={{ color: "var(--dim)", fontSize: 13, margin: "14px 4px" }}>
        Fixe-toi de vraies récompenses (une série, un resto, un jeu…) et ne te les offre qu'avec ton or. C'est ce qui rend le jeu sérieux.
      </p>
    </>
  );
}
