// Accès à Supabase (authentification + sauvegarde en ligne).
// Le SDK n'est chargé qu'à la demande : un joueur sans compte ne le télécharge jamais.
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { parseSave } from "../domain/schema";
import type { GameState } from "../domain/types";
import type { RemoteSave } from "./syncPolicy";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isCloudConfigured = Boolean(url && anonKey);

export class CloudError extends Error {
  constructor(
    message: string,
    readonly kind: "network" | "auth" | "conflict" | "invalid" | "unknown",
  ) {
    super(message);
    this.name = "CloudError";
  }
}

let clientPromise: Promise<SupabaseClient> | null = null;

export function getClient(): Promise<SupabaseClient> {
  if (!isCloudConfigured) return Promise.reject(new CloudError("Synchronisation non configurée", "unknown"));
  clientPromise ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
    }),
  );
  return clientPromise;
}

function toCloudError(error: { message?: string | undefined; status?: number | undefined } | null, fallback: string): CloudError {
  const status = error?.status ?? 0;
  if (status === 429) return new CloudError("Trop de tentatives. Réessaie dans quelques minutes.", "auth");
  if (status === 401 || status === 403) return new CloudError("Session expirée. Reconnecte-toi.", "auth");
  if (!navigator.onLine) return new CloudError("Pas de connexion internet", "network");
  return new CloudError(fallback, "unknown");
}

// ---------- Authentification (code à usage unique par e-mail) ----------

export async function sendLoginCode(email: string): Promise<void> {
  const client = await getClient();
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
  });
  if (error) throw toCloudError(error, "Impossible d'envoyer l'e-mail de connexion");
}

export async function verifyLoginCode(email: string, code: string): Promise<void> {
  const client = await getClient();
  const { error } = await client.auth.verifyOtp({ email, token: code, type: "email" });
  if (error) throw new CloudError("Code invalide ou expiré", "auth");
}

export async function signOut(): Promise<void> {
  const client = await getClient();
  await client.auth.signOut();
}

export async function currentSession(): Promise<Session | null> {
  const client = await getClient();
  const { data } = await client.auth.getSession();
  return data.session;
}

export async function onSessionChange(listener: (session: Session | null) => void): Promise<() => void> {
  const client = await getClient();
  const { data } = client.auth.onAuthStateChange((_event, session) => listener(session));
  return () => data.subscription.unsubscribe();
}

// ---------- Sauvegarde en ligne ----------
// Une ligne par joueur dans la table `saves`. Les règles RLS garantissent qu'un joueur
// ne peut lire ou écrire que sa propre ligne (voir supabase/migrations).

export async function fetchRemoteSave(userId: string): Promise<RemoteSave | null> {
  const client = await getClient();
  const { data, error } = await client.from("saves").select("state, revision").eq("user_id", userId).maybeSingle();
  if (error) throw toCloudError(error, "Impossible de lire ta sauvegarde en ligne");
  if (!data) return null;
  const parsed = parseSave(data.state);
  if (!parsed.ok) throw new CloudError("La sauvegarde en ligne est illisible", "invalid");
  return { revision: data.revision as number, state: parsed.state };
}

export async function createRemoteSave(userId: string, state: GameState): Promise<number> {
  const client = await getClient();
  const { data, error } = await client.from("saves").insert({ user_id: userId, state, revision: 1 }).select("revision").single();
  if (error) {
    // 23505 = la ligne existe déjà : un autre appareil l'a créée entre-temps.
    if ((error as { code?: string }).code === "23505") throw new CloudError("Sauvegarde déjà créée ailleurs", "conflict");
    throw toCloudError(error, "Impossible de créer ta sauvegarde en ligne");
  }
  return data.revision as number;
}

/** Écriture conditionnelle : échoue si un autre appareil a écrit depuis `baseRevision`. */
export async function pushRemoteSave(userId: string, state: GameState, baseRevision: number): Promise<number> {
  const client = await getClient();
  const next = baseRevision + 1;
  const { data, error } = await client
    .from("saves")
    .update({ state, revision: next })
    .eq("user_id", userId)
    .eq("revision", baseRevision)
    .select("revision");
  if (error) throw toCloudError(error, "Impossible d'enregistrer ta progression en ligne");
  if (!data || data.length === 0) throw new CloudError("Un autre appareil a modifié la partie", "conflict");
  return next;
}

/** Écrase la sauvegarde en ligne quelle que soit sa révision (choix explicite du joueur). */
export async function overwriteRemoteSave(userId: string, state: GameState): Promise<number> {
  const current = await fetchRemoteSave(userId).catch(() => null);
  if (!current) return createRemoteSave(userId, state);
  return pushRemoteSave(userId, state, current.revision);
}

export async function deleteRemoteSave(userId: string): Promise<void> {
  const client = await getClient();
  const { error } = await client.from("saves").delete().eq("user_id", userId);
  if (error) throw toCloudError(error, "Impossible de supprimer ta sauvegarde en ligne");
}
