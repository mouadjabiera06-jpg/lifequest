import { useRef } from "react";
import { daysBetween, formatShort } from "../../domain/dates";
import { attackBoss } from "../../domain/game";
import { statInfo } from "../../domain/rules";
import type { Boss, GameState } from "../../domain/types";
import { play, systemClock } from "../../state/store";
import { Avatar } from "../components/Avatar";
import { Empty, ProgressBar, SectionTitle } from "../components/basics";
import { Icon } from "../components/Icon";
import { openBossForm } from "../forms/forms";

function dueLabel(boss: Boss, today: string): { text: string; late: boolean } {
  if (!boss.deadline || boss.defeatedOn) return { text: "", late: false };
  const n = daysBetween(today, boss.deadline);
  if (n < 0) return { text: `En retard de ${-n} j : il t'attaque !`, late: true };
  if (n === 0) return { text: "Échéance aujourd'hui", late: false };
  if (n === 1) return { text: "Échéance demain", late: false };
  return { text: `Échéance dans ${n} j`, late: false };
}

function BossCard({ boss, today }: { boss: Boss; today: string }) {
  const card = useRef<HTMLDivElement>(null);
  const s = statInfo(boss.stat);
  const due = dueLabel(boss, today);

  const attack = () => {
    const el = card.current;
    if (el) {
      el.classList.remove("shake");
      void el.offsetWidth; // relance l'animation
      el.classList.add("shake");
    }
    play((g, c) => attackBoss(g, boss.id, c));
  };

  return (
    <article ref={card} className={`boss${boss.defeatedOn ? " dead" : ""}`} aria-label={`Boss : ${boss.name}`}>
      <div className="boss-top">
        <Avatar style="bottts" seed={boss.name + boss.id} label="" color="#FB7185" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="name">{boss.name}</div>
          {boss.alias && <div className="alias">alias « {boss.alias} »</div>}
        </div>
        <button className="more" type="button" aria-label={`Modifier le boss ${boss.name}`} onClick={() => openBossForm(boss)}><Icon name="dots" size={18} /></button>
      </div>
      <ProgressBar value={boss.hp} max={boss.maxHp} label={`PV du boss ${boss.name}`} />
      <div className="boss-foot">
        <span className="hpv"><Icon name="heart" size={14} /> {boss.hp} / {boss.maxHp}</span>
        <span className="st" style={{ color: `var(--${boss.stat})` }}><Icon name={boss.stat} size={14} /> {s.name}</span>
        {(boss.defeatedOn || !due.late) && (due.text || boss.defeatedOn) && (
          <span><Icon name={boss.defeatedOn ? "trophy" : "clock"} size={14} /> {boss.defeatedOn ? `vaincu le ${formatShort(boss.defeatedOn)}` : due.text}</span>
        )}
        <span className="sp" />
        {!boss.defeatedOn && <button className="btn small primary" type="button" onClick={attack}><Icon name="sword" size={15} /> Étape faite</button>}
      </div>
      {due.late && <div className="late"><Icon name="alert" size={14} /> {due.text}</div>}
    </article>
  );
}

export function BossScreen({ game }: { game: GameState }) {
  const today = systemClock().today;
  const alive = game.bosses.filter((b) => !b.defeatedOn);
  const dead = game.bosses.filter((b) => b.defeatedOn).reverse();
  return (
    <>
      <SectionTitle count={alive.length}>Boss en cours</SectionTitle>
      {alive.length === 0 ? (
        <Empty>
          Un boss, c'est un gros objectif découpé en étapes : un partiel, un projet, un déménagement…
          <br />Chaque étape réussie lui retire 1 PV. Ajoute-en un avec <b>+</b>.
        </Empty>
      ) : (
        <div className="list boss-list">{alive.map((b) => <BossCard key={b.id} boss={b} today={today} />)}</div>
      )}
      {dead.length > 0 && (
        <>
          <SectionTitle count={dead.length}>Vaincus</SectionTitle>
          <div className="list boss-list">{dead.map((b) => <BossCard key={b.id} boss={b} today={today} />)}</div>
        </>
      )}
    </>
  );
}
