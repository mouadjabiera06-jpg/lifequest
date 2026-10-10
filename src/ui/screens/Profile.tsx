import { useState, type CSSProperties } from "react";
import { ACHIEVEMENTS } from "../../domain/achievements";
import { addDays, formatShort } from "../../domain/dates";
import { setPaused } from "../../domain/game";
import { statLevel } from "../../domain/progression";
import { STATS } from "../../domain/rules";
import { parseSaveText } from "../../domain/schema";
import type { GameState } from "../../domain/types";
import { play, replaceGame, systemClock, toast } from "../../state/store";
import { ProgressBar, SectionTitle } from "../components/basics";
import { Icon } from "../components/Icon";
import { openHeroForm } from "../forms/forms";
import { askConfirm, closeSheet, openSheet } from "../sheet";
import { AccountPanel } from "./Account";

function Heatmap({ game }: { game: GameState }) {
  const today = systemClock().today;
  const days = Array.from({ length: 28 }, (_, i) => addDays(today, i - 27));
  const max = Math.max(1, ...days.map((d) => game.activity[d] ?? 0));
  return (
    <div className="heat" role="img" aria-label="Quêtes terminées sur les 4 dernières semaines">
      {days.map((d) => {
        const n = game.activity[d] ?? 0;
        return <i key={d} title={`${formatShort(d)} : ${n} quête(s)`} style={n ? { background: `rgba(139,92,246,${(0.25 + (0.75 * n) / max).toFixed(2)})` } : undefined} />;
      })}
    </div>
  );
}

// Intégrée dans une autre page (iframe), l'app ne peut souvent pas déclencher de téléchargement.
const canDownload = (() => {
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
})();

function ExportSheet({ game }: { game: GameState }) {
  const json = JSON.stringify(game);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      toast("📋 Sauvegarde copiée");
    } catch {
      const area = document.getElementById("export-text") as HTMLTextAreaElement | null;
      area?.select();
      toast("Texte sélectionné : copie-le avec Ctrl+C ou un appui long");
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(game, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifequest-sauvegarde-${systemClock().today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <h3>Exporter ma partie</h3>
      <p className="note">Garde ce texte ou ce fichier en lieu sûr. Pour restaurer ta partie : Profil → Importer.</p>
      <label className="field">
        <span>Ta sauvegarde</span>
        <textarea id="export-text" readOnly value={json} />
      </label>
      <div className="row">
        <button className="btn primary" type="button" onClick={() => void copy()}>Copier</button>
        {canDownload && <button className="btn" type="button" onClick={download}>Télécharger le fichier</button>}
      </div>
    </>
  );
}

function ImportSheet() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const apply = (raw: string) => {
    const parsed = parseSaveText(raw);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    closeSheet();
    askConfirm({
      title: "Remplacer ta partie ?",
      body: `La partie de ${parsed.state.hero.name} va remplacer celle en cours sur cet appareil.`,
      confirmLabel: "Remplacer",
      onConfirm: () => {
        replaceGame(parsed.state, "local");
        toast(parsed.migrated ? "⬆️ Partie de la V1 importée et convertie" : "⬆️ Partie importée");
      },
    });
  };
  return (
    <>
      <h3>Importer une partie</h3>
      <p className="note">Colle le texte d'une sauvegarde (V1 ou V2), ou choisis un fichier .json.</p>
      <label className="field">
        <span>Texte de la sauvegarde</span>
        <textarea id="import-text" value={text} onChange={(e) => { setText(e.target.value); setError(null); }} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <label className="btn" htmlFor="import-file" style={{ cursor: "pointer" }}>Choisir un fichier</label>
        <button className="btn primary" type="button" onClick={() => apply(text)}>Importer</button>
      </div>
      <input
        id="import-file"
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 1_000_000) {
            setError("Fichier trop volumineux pour une sauvegarde");
            return;
          }
          void file.text().then(apply);
        }}
      />
    </>
  );
}

export function ProfileScreen({ game }: { game: GameState }) {
  const unlocked = ACHIEVEMENTS.filter((a) => game.achievements[a.id]).length;
  return (
    <>
      <SectionTitle>Statistiques</SectionTitle>
      <div className="list stat-grid">
        {STATS.map((s) => {
          const lvl = statLevel(game.statXp[s.id]);
          return (
            <div key={s.id} className="stat-card" style={{ "--sc": `var(--${s.id})` } as CSSProperties}>
              <div className="hd"><span className="sic"><Icon name={s.id} size={16} /></span>{s.name}<span className="lv">Niv. {lvl.level}</span></div>
              <div className="sub">{s.hint} · {game.statXp[s.id]} XP au total</div>
              <ProgressBar value={lvl.current} max={lvl.needed} label={`${s.name} vers le niveau suivant`} />
            </div>
          );
        })}
      </div>

      <SectionTitle>4 dernières semaines</SectionTitle>
      <Heatmap game={game} />

      <SectionTitle count={`${unlocked}/${ACHIEVEMENTS.length}`}>Succès</SectionTitle>
      <div className="ach">
        {ACHIEVEMENTS.map((a) => (
          <div key={a.id} className={game.achievements[a.id] ? "on" : ""}>
            <b aria-hidden="true">{a.icon}</b>
            {a.name}
            <br />
            <small style={{ color: "var(--dim)" }}>{a.description}</small>
            <span className="sr-only">{game.achievements[a.id] ? " (obtenu)" : " (pas encore obtenu)"}</span>
          </div>
        ))}
      </div>

      <SectionTitle>Compte et synchronisation</SectionTitle>
      <AccountPanel />

      <SectionTitle>Réglages</SectionTitle>
      <div className="settings">
        <button className="btn block" type="button" onClick={openHeroForm}><Icon name="edit" size={16} /> Modifier mon héros</button>
        <label className="toggle">
          <span>Mode pause<small>Vacances ou maladie : pas de dégâts, les séries sont gelées.</small></span>
          <input id="pause-toggle" type="checkbox" checked={game.paused} onChange={(e) => play((s, c) => setPaused(s, e.target.checked, c))} />
        </label>
        <div className="row">
          <button className="btn" type="button" onClick={() => openSheet(<ExportSheet game={game} />)}><Icon name="download" size={16} /> Exporter ma partie</button>
          <button className="btn" type="button" onClick={() => openSheet(<ImportSheet />)}><Icon name="upload" size={16} /> Importer une partie</button>
        </div>
        <button
          className="btn danger block"
          type="button"
          onClick={() =>
            askConfirm({
              title: "Recommencer à zéro ?",
              body: "Ton héros, tes niveaux, ton or et tes quêtes seront effacés de cet appareil. Exporte ta partie avant si tu veux la garder.",
              confirmLabel: "Tout effacer",
              onConfirm: () => replaceGame(null, "local"),
            })
          }
        >
          <Icon name="trash" size={16} /> Recommencer à zéro
        </button>
      </div>

      <SectionTitle>Journal</SectionTitle>
      <div className="log">
        {game.journal.slice(0, 40).map((entry, i) => {
          const d = new Date(entry.at);
          const stamp = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
          return (
            <div key={`${entry.at}-${i}`}>
              <time dateTime={d.toISOString()}>{stamp}</time>
              <span>{entry.text}</span>
            </div>
          );
        })}
      </div>
      <p style={{ color: "var(--dim)", fontSize: 12, textAlign: "center", marginTop: 28 }}>
        LifeQuest v2 · avatars générés avec DiceBear
      </p>
    </>
  );
}
