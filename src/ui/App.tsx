import { useEffect } from "react";
import { refreshDay, setTab, useApp, type Tab } from "../state/store";
import { Overlays, Toasts } from "./components/Feedback";
import { HeroCard } from "./components/HeroCard";
import { openBossForm, openQuestForm, openShopItemForm } from "./forms/forms";
import { BossScreen } from "./screens/Bosses";
import { Onboarding } from "./screens/Onboarding";
import { ProfileScreen } from "./screens/Profile";
import { QuestsScreen } from "./screens/Quests";
import { ShopScreen } from "./screens/Shop";
import { openSheet, SheetHost } from "./sheet";
import { ConflictSheet } from "./screens/Account";

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "quetes", icon: "⚔️", label: "Quêtes" },
  { id: "boss", icon: "🐉", label: "Boss" },
  { id: "boutique", icon: "🛒", label: "Boutique" },
  { id: "profil", icon: "👤", label: "Profil" },
];

const ADD_ACTION: Partial<Record<Tab, { label: string; run: () => void }>> = {
  quetes: { label: "Ajouter une quête", run: () => openQuestForm("daily") },
  boss: { label: "Ajouter un boss", run: () => openBossForm() },
  boutique: { label: "Ajouter une récompense", run: () => openShopItemForm() },
};

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

  const add = ADD_ACTION[tab];

  return (
    <>
      {!game ? (
        <Onboarding />
      ) : (
        <>
          <main className="wrap">
            {warning && (
              <div className="banner" role="alert">
                <span>{warning}</span>
                <button className="btn small" type="button" onClick={() => useApp.setState({ storageWarning: null })}>OK</button>
              </div>
            )}
            <HeroCard game={game} />
            {tab === "quetes" && <QuestsScreen game={game} />}
            {tab === "boss" && <BossScreen game={game} />}
            {tab === "boutique" && <ShopScreen game={game} />}
            {tab === "profil" && <ProfileScreen game={game} />}
          </main>
          <nav className="tabs" aria-label="Sections">
            <div className="in">
              {TABS.map((t) => (
                <button key={t.id} type="button" className={tab === t.id ? "on" : ""} aria-current={tab === t.id ? "page" : undefined}
                  onClick={() => { setTab(t.id); window.scrollTo(0, 0); }}>
                  <b aria-hidden="true">{t.icon}</b>
                  {t.label}
                </button>
              ))}
            </div>
          </nav>
          {add && <button className="fab" type="button" aria-label={add.label} onClick={add.run}>+</button>}
        </>
      )}
      <SheetHost />
      <Overlays />
      <Toasts />
    </>
  );
}
