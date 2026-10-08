// Formulaires de création / modification. La validation métier est faite par le domaine
// (domain/editing.ts) ; ici on se contente d'afficher l'erreur qu'il renvoie.
import { useState, type CSSProperties, type FormEvent } from "react";
import { MONSTER_NAMES } from "../../domain/content";
import {
  addBoss, addDaily, addMission, addShopItem, removeBoss, removeQuest, removeShopItem, SHOP_ICONS,
  updateBoss, updateHero, updateQuest, updateShopItem,
} from "../../domain/editing";
import { acceptBonusQuest, drawBonusQuest } from "../../domain/game";
import { AVATAR_STYLES, BOSS, DIFFICULTIES, DIFFICULTY_IDS, statInfo, STATS } from "../../domain/rules";
import type { AvatarStyle, Boss, Daily, Difficulty, Mission, ShopItem, StatId } from "../../domain/types";
import { edit, play, useApp } from "../../state/store";
import { Avatar } from "../components/Avatar";
import { OptionGroup, type Option } from "../components/basics";
import { askConfirm, closeSheet, openSheet } from "../sheet";

export const statOptions: Option<StatId>[] = STATS.map((s) => ({ value: s.id, label: `${s.icon} ${s.name}`, color: `var(--${s.id})` }));
const difficultyOptions: Option<Difficulty>[] = DIFFICULTY_IDS.map((d) => ({ value: d, label: `${DIFFICULTIES[d].name} · ${DIFFICULTIES[d].xp} XP` }));

function FormError({ message }: { message: string | null }) {
  return message ? <p className="error" role="alert">{message}</p> : null;
}

// ---------- Quêtes ----------

type QuestKind = "daily" | "mission";

function QuestForm({ kind: initialKind, quest }: { kind: QuestKind; quest?: Daily | Mission }) {
  const [kind, setKind] = useState<QuestKind>(initialKind);
  const [title, setTitle] = useState(quest?.title ?? "");
  const [stat, setStat] = useState<StatId>(quest?.stat ?? "discipline");
  const [difficulty, setDifficulty] = useState<Difficulty>(quest?.difficulty ?? "moyen");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input = { title, stat, difficulty };
    const err = quest
      ? edit((s, c) => updateQuest(s, quest.id, input, c))
      : edit((s, c) => (kind === "daily" ? addDaily(s, input, c) : addMission(s, input, c)));
    if (err) setError(err);
    else closeSheet();
  };

  return (
    <form onSubmit={submit} noValidate>
      <h3>{quest ? "Modifier la quête" : "Nouvelle quête"}</h3>
      <label className="field">
        <span>Intitulé</span>
        <input id="quest-title" type="text" maxLength={80} placeholder="Ex. Méditer 10 minutes" value={title} onChange={(e) => setTitle(e.target.value)} autoComplete="off" />
      </label>
      <FormError message={error} />
      {!quest && (
        <OptionGroup<QuestKind>
          label="Type"
          value={kind}
          onChange={setKind}
          options={[{ value: "daily", label: "🔁 Quotidienne" }, { value: "mission", label: "📜 Mission unique" }]}
        />
      )}
      <OptionGroup label="Statistique" options={statOptions} value={stat} onChange={setStat} />
      <OptionGroup label="Difficulté" options={difficultyOptions} value={difficulty} onChange={setDifficulty} />
      <button className="btn primary block" type="submit">{quest ? "Enregistrer" : "Ajouter"}</button>
      {quest && (
        <button
          className="btn danger block"
          type="button"
          style={{ marginTop: 8 }}
          onClick={() => askConfirm({ title: "Supprimer cette quête ?", body: `« ${quest.title} » sera retirée de ta liste.`, confirmLabel: "Supprimer", onConfirm: () => play((s, c) => removeQuest(s, quest.id, c)) })}
        >
          Supprimer
        </button>
      )}
    </form>
  );
}

export const openQuestForm = (kind: QuestKind, quest?: Daily | Mission) => openSheet(<QuestForm kind={kind} {...(quest ? { quest } : {})} />);

// ---------- Quête bonus ----------

function BonusQuestSheet() {
  const [quest, setQuest] = useState(() => drawBonusQuest(Math.random()));
  const s = statInfo(quest.stat);
  return (
    <>
      <h3>🎲 Quête bonus</h3>
      <div className="item" style={{ "--sc": `var(--${quest.stat})`, marginBottom: 14 } as CSSProperties}>
        <div className="it-body">
          <div className="it-title">{quest.title}</div>
          <div className="it-meta">
            <span className="st">{s.icon} {s.name}</span>
            <span>Moyen · {DIFFICULTIES.moyen.xp} XP</span>
          </div>
        </div>
      </div>
      <div className="row">
        <button className="btn" type="button" onClick={() => setQuest(drawBonusQuest(Math.random()))}>🔄 Une autre</button>
        <button className="btn primary" type="button" onClick={() => { play((g, c) => acceptBonusQuest(g, quest, c)); closeSheet(); }}>Accepter</button>
      </div>
    </>
  );
}

export const openBonusQuest = () => openSheet(<BonusQuestSheet />);

// ---------- Boss ----------

function BossForm({ boss }: { boss?: Boss }) {
  const [name, setName] = useState(boss?.name ?? "");
  const [alias, setAlias] = useState(boss?.alias ?? "");
  const [steps, setSteps] = useState(String(boss?.maxHp ?? 5));
  const [deadline, setDeadline] = useState(boss?.deadline ?? "");
  const [stat, setStat] = useState<StatId>(boss?.stat ?? "intel");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input = { name, alias, stat, deadline, steps: Number(steps) };
    const err = boss ? edit((s, c) => updateBoss(s, boss.id, input, c)) : edit((s, c) => addBoss(s, input, c));
    if (err) setError(err);
    else closeSheet();
  };

  return (
    <form onSubmit={submit} noValidate>
      <h3>{boss ? "Modifier le boss" : "Nouveau boss"}</h3>
      <label className="field">
        <span>Objectif</span>
        <input id="boss-name" type="text" maxLength={60} placeholder="Ex. Partiel de maths" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      </label>
      <div className="field">
        <label htmlFor="boss-alias"><span>Nom de monstre (pour le style)</span></label>
        <div className="inline">
          <input id="boss-alias" type="text" maxLength={60} placeholder="Ex. Hydre de la Procrastination" value={alias} onChange={(e) => setAlias(e.target.value)} autoComplete="off" />
          <button className="btn" type="button" aria-label="Nom de monstre au hasard" onClick={() => setAlias(MONSTER_NAMES[Math.floor(Math.random() * MONSTER_NAMES.length)] ?? "")}>🎲</button>
        </div>
      </div>
      {!boss && (
        <label className="field">
          <span>Nombre d'étapes (PV du boss)</span>
          <input id="boss-steps" type="number" inputMode="numeric" min={BOSS.minHp} max={BOSS.maxHp} value={steps} onChange={(e) => setSteps(e.target.value)} />
        </label>
      )}
      <label className="field">
        <span>Date limite (facultatif)</span>
        <input id="boss-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </label>
      <OptionGroup label="Statistique" options={statOptions} value={stat} onChange={setStat} />
      <FormError message={error} />
      <p className="note">
        Chaque étape : +{BOSS.hit.xp} XP. Victoire : +{BOSS.lootPerHp.xp} XP et +{BOSS.lootPerHp.gold} 🪙 par PV du boss. Après la date limite, il t'attaque chaque jour.
      </p>
      <button className="btn primary block" type="submit">{boss ? "Enregistrer" : "Invoquer le boss"}</button>
      {boss && (
        <button
          className="btn danger block"
          type="button"
          style={{ marginTop: 8 }}
          onClick={() => askConfirm({ title: "Supprimer ce boss ?", body: `« ${boss.name} » disparaîtra, sans récompense.`, confirmLabel: "Supprimer", onConfirm: () => play((s, c) => removeBoss(s, boss.id, c)) })}
        >
          Supprimer
        </button>
      )}
    </form>
  );
}

export const openBossForm = (boss?: Boss) => openSheet(<BossForm {...(boss ? { boss } : {})} />);

// ---------- Boutique ----------

function ShopItemForm({ item }: { item?: ShopItem }) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [cost, setCost] = useState(String(item?.cost ?? 100));
  const [icon, setIcon] = useState<string>(item?.icon ?? "🎁");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input = { title, cost: Number(cost), icon };
    const err = item ? edit((s, c) => updateShopItem(s, item.id, input, c)) : edit((s, c) => addShopItem(s, input, c));
    if (err) setError(err);
    else closeSheet();
  };

  return (
    <form onSubmit={submit} noValidate>
      <h3>{item ? "Modifier la récompense" : "Nouvelle récompense"}</h3>
      <label className="field">
        <span>Récompense</span>
        <input id="reward-title" type="text" maxLength={60} placeholder="Ex. Une soirée cinéma" value={title} onChange={(e) => setTitle(e.target.value)} autoComplete="off" />
      </label>
      <label className="field">
        <span>Prix en or</span>
        <input id="reward-cost" type="number" inputMode="numeric" min={1} max={99999} value={cost} onChange={(e) => setCost(e.target.value)} />
      </label>
      <OptionGroup label="Icône" options={SHOP_ICONS.map((i) => ({ value: i as string, label: i }))} value={icon} onChange={setIcon} />
      <FormError message={error} />
      <button className="btn primary block" type="submit">{item ? "Enregistrer" : "Ajouter"}</button>
      {item && (
        <button className="btn danger block" type="button" style={{ marginTop: 8 }} onClick={() => { play((s, c) => removeShopItem(s, item.id, c)); closeSheet(); }}>
          Supprimer
        </button>
      )}
    </form>
  );
}

export const openShopItemForm = (item?: ShopItem) => openSheet(<ShopItemForm {...(item ? { item } : {})} />);

// ---------- Héros ----------

function HeroForm() {
  const hero = useApp((s) => s.game?.hero);
  const [name, setName] = useState(hero?.name ?? "");
  const [seed, setSeed] = useState(hero?.avatarSeed ?? "");
  const [style, setStyle] = useState<AvatarStyle>(hero?.avatarStyle ?? "pixel-art");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err = edit((s, c) => updateHero(s, { name, avatarSeed: seed, avatarStyle: style }, c));
    if (err) setError(err);
    else closeSheet();
  };

  return (
    <form onSubmit={submit} noValidate>
      <h3>Mon héros</h3>
      <label className="field">
        <span>Nom</span>
        <input id="hero-name" type="text" maxLength={24} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      </label>
      <label className="field">
        <span>Graine de l'avatar (change-la pour un autre visage)</span>
        <input id="hero-seed" type="text" maxLength={40} value={seed} onChange={(e) => setSeed(e.target.value)} autoComplete="off" />
      </label>
      <StylePicker seed={seed || name} value={style} onChange={setStyle} />
      <FormError message={error} />
      <button className="btn primary block" type="submit">Enregistrer</button>
    </form>
  );
}

export function StylePicker({ seed, value, onChange }: { seed: string; value: AvatarStyle; onChange: (v: AvatarStyle) => void }) {
  return (
    <div className="field">
      <span id="style-label">Style d'avatar</span>
      <div className="styles" role="radiogroup" aria-labelledby="style-label">
        {AVATAR_STYLES.map((st) => (
          <button key={st} type="button" role="radio" aria-checked={value === st} aria-label={st} className={value === st ? "on" : ""} onClick={() => onChange(st)}>
            <Avatar style={st} seed={seed || "héros"} label="" />
          </button>
        ))}
      </div>
    </div>
  );
}

export const openHeroForm = () => openSheet(<HeroForm />);
