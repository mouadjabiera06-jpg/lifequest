import { useState, type FormEvent } from "react";
import { heroLevel } from "../../domain/progression";
import type { GameState } from "../../domain/types";
import { useApp } from "../../state/store";
import { confirmCode, deleteCloudData, logout, requestCode, resolveConflict, syncNow } from "../../state/sync";
import { askConfirm, closeSheet, openSheet } from "../sheet";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Connexion sans mot de passe : un code à 6 chiffres est envoyé par e-mail. */
export function AccountSheet() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async (e: FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!EMAIL.test(clean)) {
      setError("Adresse e-mail invalide");
      return;
    }
    setBusy(true);
    const err = await requestCode(clean);
    setBusy(false);
    if (err) setError(err);
    else {
      setEmail(clean);
      setError(null);
      setStep("code");
    }
  };

  const sendCode = async (e: FormEvent) => {
    e.preventDefault();
    const clean = code.replace(/\D/g, "");
    if (clean.length < 6) {
      setError("Le code contient au moins 6 chiffres");
      return;
    }
    setBusy(true);
    const err = await confirmCode(email, clean);
    setBusy(false);
    if (err) setError(err);
    else closeSheet();
  };

  if (step === "email") {
    return (
      <form onSubmit={sendEmail} noValidate>
        <h3>☁️ Se connecter</h3>
        <p className="note">Ta partie sera sauvegardée en ligne et te suivra sur tous tes appareils. Pas de mot de passe : on t'envoie un code par e-mail.</p>
        <label className="field">
          <span>Adresse e-mail</span>
          <input id="login-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary block" type="submit" disabled={busy}>{busy ? "Envoi…" : "Recevoir mon code"}</button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} noValidate>
      <h3>📬 Vérifie tes e-mails</h3>
      <p className="note">Code envoyé à <b>{email}</b>. Saisis-le ici. Tu peux aussi cliquer sur le lien de l'e-mail depuis cet appareil.</p>
      <label className="field">
        <span>Code reçu</span>
        <input id="login-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={10} value={code} onChange={(e) => setCode(e.target.value)} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <button className="btn" type="button" onClick={() => { setStep("email"); setCode(""); setError(null); }}>Changer d'e-mail</button>
        <button className="btn primary" type="submit" disabled={busy}>{busy ? "Vérification…" : "Me connecter"}</button>
      </div>
    </form>
  );
}

function summary(game: GameState | null): string {
  if (!game) return "Aucune partie";
  return `Niv. ${heroLevel(game.xp).level} · ${game.xp} XP · ${game.gold} 🪙 · ${game.counters.questsDone} quêtes`;
}

/** Deux appareils ont avancé chacun de leur côté : le joueur choisit. */
export function ConflictSheet() {
  const game = useApp((s) => s.game);
  const remote = useApp((s) => s.sync.conflict);
  const message = useApp((s) => s.sync.message);
  if (!remote) return null;
  return (
    <>
      <h3>Deux parties différentes</h3>
      <p className="note">Ta partie en ligne et celle de cet appareil ont avancé séparément. Choisis celle à garder ; l'autre sera remplacée.</p>
      <div className="compare">
        <div><b>📱 Cet appareil</b>{game?.hero.name}<br />{summary(game)}</div>
        <div><b>☁️ En ligne</b>{remote.state.hero.name}<br />{summary(remote.state)}</div>
      </div>
      {message && <p className="error" role="alert">{message}</p>}
      <div className="row">
        <button className="btn" type="button" onClick={() => void resolveConflict("device").then(closeSheet)}>Garder cet appareil</button>
        <button className="btn primary" type="button" onClick={() => void resolveConflict("cloud").then(closeSheet)}>Garder en ligne</button>
      </div>
    </>
  );
}

const STATUS = {
  "signed-out": { dot: "", text: "Non connecté : ta partie reste sur cet appareil." },
  idle: { dot: "ok", text: "Synchronisé" },
  syncing: { dot: "busy", text: "Synchronisation…" },
  offline: { dot: "busy", text: "Hors ligne" },
  error: { dot: "bad", text: "Échec de la synchronisation" },
  conflict: { dot: "bad", text: "Deux parties différentes : choix à faire" },
} as const;

export function AccountPanel() {
  const sync = useApp((s) => s.sync);
  if (!sync.configured) {
    return (
      <div className="sync-card">
        <div className="sync-status"><span className="dot" />Synchronisation non configurée sur cette version.</div>
      </div>
    );
  }
  const status = STATUS[sync.phase];
  const time = sync.lastSyncedAt ? new Date(sync.lastSyncedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : null;
  return (
    <div className="sync-card">
      <div className="sync-status" role="status">
        <span className={`dot ${status.dot}`} />
        <span>{status.text}{sync.phase === "idle" && time ? ` à ${time}` : ""}</span>
      </div>
      {sync.message && <p className="note" style={{ margin: 0 }}>{sync.message}</p>}
      {sync.userId ? (
        <>
          <p className="note" style={{ margin: 0 }}>Connecté : <b>{sync.email}</b></p>
          {sync.phase === "conflict" ? (
            <button className="btn primary block" type="button" onClick={() => openSheet(<ConflictSheet />)}>Choisir la partie à garder</button>
          ) : (
            <button className="btn block" type="button" disabled={sync.phase === "syncing"} onClick={() => void syncNow()}>🔄 Synchroniser maintenant</button>
          )}
          <div className="row">
            <button className="btn" type="button" onClick={() => void logout()}>Se déconnecter</button>
            <button
              className="btn danger"
              type="button"
              onClick={() =>
                askConfirm({
                  title: "Supprimer tes données en ligne ?",
                  body: "Ta sauvegarde en ligne sera effacée et tu seras déconnecté. La partie reste sur cet appareil.",
                  confirmLabel: "Supprimer en ligne",
                  onConfirm: () => void deleteCloudData(),
                })
              }
            >
              Supprimer en ligne
            </button>
          </div>
        </>
      ) : (
        <button className="btn primary block" type="button" onClick={() => openSheet(<AccountSheet />)}>☁️ Se connecter pour synchroniser</button>
      )}
    </div>
  );
}
