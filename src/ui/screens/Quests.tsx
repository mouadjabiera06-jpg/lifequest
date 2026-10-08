import type { CSSProperties } from "react";
import { clearDoneMissions, quoteOfTheDay, toggleDaily, toggleMission } from "../../domain/game";
import { streakMultiplier } from "../../domain/progression";
import { DIFFICULTIES, statInfo } from "../../domain/rules";
import type { Daily, GameState, Mission } from "../../domain/types";
import { play, systemClock } from "../../state/store";
import { Empty, SectionTitle } from "../components/basics";
import { openBonusQuest, openQuestForm } from "../forms/forms";

function QuestRow({ title, stat, meta, done, onToggle, onEdit, prefix = "" }: {
  title: string;
  stat: Daily["stat"];
  meta: string[];
  done: boolean;
  onToggle: () => void;
  onEdit: () => void;
  prefix?: string;
}) {
  const s = statInfo(stat);
  return (
    <div className={`item${done ? " done" : ""}`} style={{ "--sc": `var(--${stat})` } as CSSProperties}>
      <button className="check" type="button" role="checkbox" aria-checked={done} aria-label={`${done ? "Décocher" : "Valider"} : ${title}`} onClick={onToggle}>
        {done ? "✓" : ""}
      </button>
      <div className="it-body">
        <div className="it-title">{prefix}{title}</div>
        <div className="it-meta">
          <span className="st">{s.icon} {s.name}</span>
          {meta.map((m) => <span key={m}>{m}</span>)}
        </div>
      </div>
      <button className="more" type="button" aria-label={`Modifier : ${title}`} onClick={onEdit}>⋯</button>
    </div>
  );
}

export function QuestsScreen({ game }: { game: GameState }) {
  const today = systemClock().today;
  const quote = quoteOfTheDay(today);
  const doneToday = game.dailies.filter((d) => d.lastDoneOn === today).length;
  const open = game.missions.filter((m) => !m.doneOn);
  const closed = game.missions.filter((m) => m.doneOn);

  const dailyMeta = (d: Daily) => {
    const done = d.lastDoneOn === today;
    const diff = DIFFICULTIES[d.difficulty];
    const xp = Math.round(diff.xp * streakMultiplier(d.streak + (done ? 0 : 1)));
    return [`${diff.name} · ${xp} XP`, ...(d.streak ? [`🔥 ${d.streak} j`] : [])];
  };
  const missionMeta = (m: Mission) => [`${DIFFICULTIES[m.difficulty].name} · ${DIFFICULTIES[m.difficulty].xp} XP`];

  return (
    <>
      <blockquote className="quote">
        « <b>{quote.text}</b> » — {quote.author}
      </blockquote>

      <SectionTitle count={`${doneToday}/${game.dailies.length}`}>⚔️ Quotidiennes</SectionTitle>
      {game.dailies.length === 0 ? (
        <Empty>Aucune quête quotidienne. Ajoute tes habitudes avec le bouton <b>+</b>.</Empty>
      ) : (
        <div className="list">
          {game.dailies.map((d) => (
            <QuestRow key={d.id} title={d.title} stat={d.stat} meta={dailyMeta(d)} done={d.lastDoneOn === today}
              onToggle={() => play((s, c) => toggleDaily(s, d.id, c))} onEdit={() => openQuestForm("daily", d)} />
          ))}
        </div>
      )}

      <SectionTitle count={open.length} action={<button className="btn small" type="button" onClick={openBonusQuest}>🎲 Quête bonus</button>}>
        📜 Missions
      </SectionTitle>
      {game.missions.length === 0 ? (
        <Empty>Pas de mission en cours. Ajoute un objectif ponctuel, ou tire une quête bonus au hasard.</Empty>
      ) : (
        <div className="list">
          {[...open, ...closed].map((m) => (
            <QuestRow key={m.id} title={m.title} stat={m.stat} meta={missionMeta(m)} done={Boolean(m.doneOn)} prefix={m.isBonus ? "🎲 " : ""}
              onToggle={() => play((s, c) => toggleMission(s, m.id, c))} onEdit={() => openQuestForm("mission", m)} />
          ))}
        </div>
      )}
      {closed.length > 0 && (
        <div style={{ marginTop: 10, textAlign: "right" }}>
          <button className="btn small" type="button" onClick={() => play(clearDoneMissions)}>
            Ranger les missions terminées ({closed.length})
          </button>
        </div>
      )}
    </>
  );
}
