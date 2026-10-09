import { useState, type FormEvent } from "react";
import { createGame } from "../../domain/editing";
import type { AvatarStyle } from "../../domain/types";
import { replaceGame, showOverlay, systemClock, useApp } from "../../state/store";
import { Avatar } from "../components/Avatar";
import { StylePicker } from "../forms/forms";
import { openSheet } from "../sheet";
import { AccountSheet } from "./Account";

export function Onboarding() {
  const [name, setName] = useState("");
  const [style, setStyle] = useState<AvatarStyle>("pixel-art");
  const [error, setError] = useState<string | null>(null);
  const cloud = useApp((s) => s.sync.configured);
  const seed = name.trim() || "héros";

  const start = (e: FormEvent) => {
    e.preventDefault();
    const result = createGame({ name, avatarStyle: style }, systemClock());
    if (!result.ok) {
      setError(result.error);
      return;
    }
    replaceGame(result.value, "local");
    showOverlay({
      icon: "🗡️",
      title: `Bienvenue, ${result.value.hero.name} !`,
      body: "J'ai préparé quelques quêtes pour démarrer. Modifie-les avec ⋯ ou ajoute les tiennes avec +. Une quotidienne ratée te coûte des PV le lendemain : choisis des objectifs réalistes.",
      cta: "C'est parti",
      celebrate: false,
    });
  };

  return (
    <main className="onb">
      <form className="box" onSubmit={start} noValidate>
        <Avatar className="avatar" style={style} seed={seed} label="Aperçu de ton avatar" />
        <h1>LifeQuest</h1>
        <p>Ta vie devient un jeu vidéo. Termine tes quêtes, gagne de l'XP, bats tes boss.</p>
        <label className="field">
          <span>Nom de ton héros</span>
          <input id="onb-name" type="text" maxLength={24} placeholder="Ex. Mouad" value={name} onChange={(e) => { setName(e.target.value); setError(null); }} autoComplete="nickname" />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <StylePicker seed={seed} value={style} onChange={setStyle} />
        <button className="btn primary block" type="submit" style={{ padding: 14 }}>⚔️ Commencer l'aventure</button>
        {cloud && (
          <button className="btn block" type="button" style={{ marginTop: 10 }} onClick={() => openSheet(<AccountSheet />)}>
            ☁️ J'ai déjà un compte : récupérer ma partie
          </button>
        )}
        <p style={{ fontSize: 12, color: "var(--dim)", marginTop: 14 }}>
          {cloud ? "Sans compte, tout reste sur ton appareil. Avec un compte, ta partie te suit partout." : "Tout reste sur ton appareil. Aucun compte, aucun serveur."}
        </p>
      </form>
    </main>
  );
}
