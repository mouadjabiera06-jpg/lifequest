import type { CSSProperties } from "react";
import { clearDoneMissions, quoteOfTheDay, toggleDaily, toggleMission } from "../../domain/game";
import { streakMultiplier } from "../../domain/progression";
import { DIFFICULTIES, statInfo } from "../../domain/rules";
import type { Daily, GameState, Mission } from "../../domain/types";
import { play, systemClock } from "../../state/store";
import { Empty, SectionTitle } from "../components/basics";
import { Icon } from "../components/Icon";
import { openBonusQuest, openQuestForm } from "../forms/forms";

function QuestRow({ title, stat, meta, streak = 0, done, onToggle, onEdit, bonus = false }: {
  title: string;
  stat: Daily["stat"];
  meta: string[];
  streak?: number;
  done: boolean;
  onToggle: () => void;
  onEdit: () => void;
  bonus?: boolean;
}) {
  const s = statInfo(stat);
  return (
    <div className={`item${done ? " done" : ""}`} style={{ "--sc": `var(--${stat})` } as CSSProperties}>
      <button className="check" type="button" role="checkbox" aria-checked={done} aria-label={`${done ? "Décocher" : "Valider"} : ${title}`} onClick={onToggle}>
        {done && <Icon name="check" size={18} stroke={3} />}
      </button>
      <div className="it-body">
        <div className="it-title">
          {bonus && <span className="tag">Bonus</span>}
          {title}
        </div>
        <div className="it-meta">
          <span className="st"><Icon name={stat} size={13} /> {s.name}</span>
          {meta.map((m) => <span key={m}>{m}</span>)}
          {streak > 0 && <span className="streak"><Icon name="flame" size={13} /> {streak} j</span>}
        </div>
      </div>
      <button className="more" type="button" aria-label={`Modifier : ${title}`} onClick={onEdit}>
        <Icon name="dots" size={18} />
      </button>
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
    return [`${diff.name} · ${xp} XP`];
  };
  const missionMeta = (m: Mission) => [`${DIFFICULTIES[m.difficulty].name} · ${DIFFICULTIES[m.difficulty].xp} XP`];

  return (
    <>
      <blockquote className="quote">
        <p>{quote.text}</p>
        <cite>{quote.author}</cite>
      </blockquote>

      <SectionTitle count={`${doneToday}/${game.dailies.length}`}>Quotidiennes</SectionTitle>
      {game.dailies.length === 0 ? (
        <Empty>Aucune quête quotidienne. Ajoute tes habitudes avec le bouton <b>+</b>.</Empty>
      ) : (
        <div className="list">
          {game.dailies.map((d) => (
            <QuestRow key={d.id} title={d.title} stat={d.stat} meta={dailyMeta(d)} streak={d.streak} done={d.lastDoneOn === today}
              onToggle={() => play((s, c) => toggleDaily(s, d.id, c))} onEdit={() => openQuestForm("daily", d)} />
          ))}
        </div>
      )}

      <SectionTitle count={open.length} action={<button className="btn small" type="button" onClick={openBonusQuest}><Icon name="dice" size={15} /> Quête bonus</button>}>
        Missions
      </SectionTitle>
      {game.missions.length === 0 ? (
        <Empty>Pas de mission en cours. Ajoute un objectif ponctuel, ou tire une quête bonus au hasard.</Empty>
      ) : (
        <div className="list">
          {[...open, ...closed].map((m) => (
            <QuestRow key={m.id} title={m.title} stat={m.stat} meta={missionMeta(m)} done={Boolean(m.doneOn)} bonus={m.isBonus}
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
