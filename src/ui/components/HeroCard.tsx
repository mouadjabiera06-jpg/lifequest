import type { CSSProperties } from "react";
import { heroLevel, rankFor, statLevel } from "../../domain/progression";
import { MAX_HP, STATS } from "../../domain/rules";
import type { GameState } from "../../domain/types";
import { Avatar } from "./Avatar";
import { ProgressBar } from "./basics";
import { Icon } from "./Icon";
import { SyncBadge } from "./SyncBadge";

export function HeroCard({ game }: { game: GameState }) {
  const lvl = heroLevel(game.xp);
  const rank = rankFor(lvl.level);
  const hp = Math.max(0, game.hp);
  return (
    <section className="hero" style={{ "--rank": rank.color } as CSSProperties} aria-label="Ton héros">
      <div className="hero-top">
        <Avatar className="avatar" style={game.hero.avatarStyle} seed={game.hero.avatarSeed} label={`Avatar de ${game.hero.name}`} color={rank.color} />
        <div style={{ minWidth: 0 }}>
          <div className="hero-name">{game.hero.name}</div>
          <div className="hero-rank">{rank.name}</div>
          <SyncBadge />
        </div>
        <div className="lvl-badge">
          <b>{lvl.level}</b>
          <span>Niveau</span>
        </div>
      </div>
      <div className="bars">
        <div className="bar-row">
          <span className="lab">XP</span>
          <ProgressBar className="xp" value={lvl.current} max={lvl.needed} label="Expérience vers le niveau suivant" />
          <span className="val">{lvl.current} / {lvl.needed}</span>
        </div>
        <div className="bar-row">
          <span className="lab">PV</span>
          <ProgressBar className="hp" value={hp} max={MAX_HP} label="Points de vie" />
          <span className="val">{hp} / {MAX_HP}</span>
        </div>
      </div>
      <div className="hero-foot">
        <span className="chip gold" title="Pièces d'or"><Icon name="coin" size={15} /> {game.gold}</span>
        {STATS.map((s) => (
          <span key={s.id} className="chip" title={`${s.name} : niveau ${statLevel(game.statXp[s.id]).level}`} style={{ "--sc": `var(--${s.id})` } as CSSProperties}>
            <Icon name={s.id} size={14} className="sc" /> {statLevel(game.statXp[s.id]).level}
            <span className="sr-only"> en {s.name}</span>
          </span>
        ))}
        {game.paused && <span className="chip"><Icon name="pause" size={14} /> Pause</span>}
      </div>
    </section>
  );
}
