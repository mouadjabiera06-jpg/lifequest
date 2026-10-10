import { useEffect } from "react";
import { heroLevel, rankFor } from "../domain/progression";
import { refreshDay, setTab, useApp, type Tab } from "../state/store";
import { Avatar } from "./components/Avatar";
import { Overlays, Toasts } from "./components/Feedback";
import { HeroCard } from "./components/HeroCard";
import { Icon, type IconName } from "./components/Icon";
import { openBossForm, openQuestForm, openShopItemForm } from "./forms/forms";
import { BossScreen } from "./screens/Bosses";
import { Onboarding } from "./screens/Onboarding";
import { ProfileScreen } from "./screens/Profile";
import { QuestsScreen } from "./screens/Quests";
import { ShopScreen } from "./screens/Shop";
import { openSheet, SheetHost } from "./sheet";
import { ConflictSheet } from "./screens/Account";

const TABS: { id: Tab; icon: IconName; label: string; title: string }[] = [
  { id: "quetes", icon: "quests", label: "Quêtes", title: "Quêtes du jour" },
  { id: "boss", icon: "boss", label: "Boss", title: "Tes boss" },
  { id: "boutique", icon: "shop", label: "Boutique", title: "Boutique" },
  { id: "profil", icon: "profile", label: "Profil", title: "Profil et progression" },
];

const ADD_ACTION: Partial<Record<Tab, { label: string; run: () => void }>> = {
  quetes: { label: "Ajouter une quête", run: () => openQuestForm("daily") },
  boss: { label: "Ajouter un boss", run: () => openBossForm() },
  boutique: { label: "Ajouter une récompense", run: () => openShopItemForm() },
};

const longDate = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

function go(id: Tab) {
  setTab(id);
  window.scrollTo(0, 0);
}

export function App() {
  const game = useApp((s) => s.game);
  const tab = useApp((s) => s.tab);
  const warning = useApp((s) => s.storageWarning);
  const conflict = useApp((s) => s.sync.phase === "conflict");

  // Le passage au jour suivant se fait au lancement et à chaque retour sur l'app.
  useEffect(() => {
    refreshDay();
    const onVisible = () => document.visibilityState === "visible" && refreshDay();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    if (conflict) openSheet(<ConflictSheet />);
  }, [conflict]);

  // Raccourcis clavier sur ordinateur : 1 à 4 pour changer d'onglet, N pour ajouter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (document.querySelector(".sheet-bg, .overlay")) return;
      const n = Number(e.key);
      const target = n >= 1 ? TABS[n - 1] : undefined;
      if (target) go(target.id);
      else if (e.key === "n" || e.key === "N") ADD_ACTION[useApp.getState().tab]?.run();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!game) {
    return (
      <>
        <Onboarding />
        <SheetHost />
        <Overlays />
        <Toasts />
      </>
    );
  }

  const add = ADD_ACTION[tab];
  const current = TABS.find((t) => t.id === tab);
  const lvl = heroLevel(game.xp);
  const rank = rankFor(lvl.level);

  return (
    <>
      <div className="shell">
        <aside className="side">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true"><Icon name="sword" size={15} stroke={2.2} /></span>
            <b>LifeQuest</b>
          </div>
          <p className="tagline">Ta vie, une quête à la fois</p>
          <nav className="tabs" aria-label="Sections">
            {TABS.map((t, i) => (
              <button key={t.id} type="button" className={tab === t.id ? "on" : ""} aria-current={tab === t.id ? "page" : undefined} onClick={() => go(t.id)}>
                <Icon name={t.icon} size={20} />
                <span className="lb">{t.label}</span>
                <kbd aria-hidden="true">{i + 1}</kbd>
              </button>
            ))}
          </nav>
          <button type="button" className="side-hero" onClick={() => go("profil")} aria-label={`Profil de ${game.hero.name}`}>
            <Avatar className="mini-av" style={game.hero.avatarStyle} seed={game.hero.avatarSeed} label="" color={rank.color} />
            <span className="txt">
              <span className="n">{game.hero.name}</span>
              <span className="d">Niveau {lvl.level} · {rank.name}</span>
            </span>
          </button>
        </aside>

        <div className="main">
          <header className="top">
            <div>
              <h1>{current?.title}</h1>
              <p className="today">{longDate.format(new Date())}</p>
            </div>
            {add && (
              <button className="btn primary top-add" type="button" onClick={add.run}>
                <Icon name="plus" size={16} stroke={2.4} />
                {add.label}
                <kbd aria-hidden="true">N</kbd>
              </button>
            )}
          </header>

          <main className="page">
            {warning && (
              <div className="banner" role="alert">
                <span>{warning}</span>
                <button className="btn small" type="button" onClick={() => useApp.setState({ storageWarning: null })}>OK</button>
              </div>
            )}
            <div className="col-side">
              <HeroCard game={game} />
            </div>
            <div className="col-main">
              {tab === "quetes" && <QuestsScreen game={game} />}
              {tab === "boss" && <BossScreen game={game} />}
              {tab === "boutique" && <ShopScreen game={game} />}
              {tab === "profil" && <ProfileScreen game={game} />}
            </div>
          </main>
        </div>
      </div>
      {add && (
        <button className="fab" type="button" aria-label={add.label} onClick={add.run}>
          <Icon name="plus" size={26} stroke={2.4} />
        </button>
      )}
      <SheetHost />
      <Overlays />
      <Toasts />
    </>
  );
}
