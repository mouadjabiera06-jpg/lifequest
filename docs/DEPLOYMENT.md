# Déploiement

LifeQuest est un site statique. La CI (`.github/workflows/ci.yml`) vérifie chaque push et chaque pull request, puis publie sur GitHub Pages à chaque push sur `main`.

## 1. Mettre l'app en ligne (GitHub Pages)

À faire une seule fois :

1. Rendre le dépôt **public** : *Settings → General → Danger Zone → Change visibility*. GitHub Pages est gratuit pour les dépôts publics.
2. Activer Pages : *Settings → Pages → Build and deployment → Source : **GitHub Actions***.
3. Fusionner le code sur `main`. Le workflow **CI / Déploiement** se lance ; à la fin, l'app est en ligne à l'adresse :
   `https://mouadjabiera06-jpg.github.io/lifequest/`

Installer sur téléphone : ouvrir l'adresse, puis *Ajouter à l'écran d'accueil* (Safari : bouton Partager ; Chrome : menu ⋮).

### Ce que fait la CI

| Étape | Rôle |
|---|---|
| `npm ci` | Installe exactement les versions du `package-lock.json` |
| `npm audit --omit=dev --audit-level=high` | Bloque si une dépendance livrée a une faille grave connue |
| `npm run lint` / `typecheck` / `test` | Qualité du code et tests du domaine |
| `npm run build` | Build avec `BASE_PATH=/lifequest/` |
| `npm run test:e2e` | Parcours Playwright sur ce build exact (CSP comprise) |
| `deploy-pages` | Publication, seulement sur `main` et si tout est vert |

**Revenir en arrière** : annuler le commit fautif (`git revert`) et le pousser sur `main` ; la CI republie la version précédente. Les parties des joueurs ne sont pas touchées (elles vivent sur leurs appareils et dans Supabase).

## 2. Activer la synchronisation (Supabase)

Sans cette étape, l'app fonctionne en mode local et le Profil indique « Synchronisation non configurée ».

1. Créer un projet gratuit sur [supabase.com](https://supabase.com).
2. *SQL Editor* : coller et exécuter `supabase/migrations/20261008000000_create_saves.sql`. La table `saves` et ses règles d'accès sont créées.
3. *Authentication → Sign In / Providers → Email* : laisser **Email** activé. Le mot de passe est inutile (connexion par code).
4. *Authentication → Email Templates → Magic Link* : ajouter le code dans le message pour qu'il marche aussi dans l'app installée, par exemple :
   `Ton code LifeQuest : {{ .Token }}` (le lien `{{ .ConfirmationURL }}` peut rester).
5. *Authentication → URL Configuration* :
   - **Site URL** : `https://mouadjabiera06-jpg.github.io/lifequest/`
   - **Redirect URLs** : ajouter la même adresse, plus `http://localhost:5173/` pour le développement.
6. *Project Settings → API* : copier **Project URL** et la clé **anon / publishable**.
7. Sur GitHub : *Settings → Secrets and variables → Actions → onglet Variables* : créer `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`. Ce sont des **variables** et non des secrets : elles finissent de toute façon dans le code envoyé au navigateur.
8. Relancer le workflow (*Actions → CI / Déploiement → Run workflow*).

Ne jamais utiliser la clé **service_role** côté client : elle contourne les règles RLS.

### En local

```bash
cp .env.example .env    # puis renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

## 3. Variables d'environnement

| Variable | Dev | CI / prod | Rôle |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `.env` (facultatif) | variable GitHub (facultative) | Adresse du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | `.env` (facultatif) | variable GitHub (facultative) | Clé publique, protégée par RLS |
| `BASE_PATH` | `/` | `/lifequest/` (fixé par la CI) | Chemin de publication |

## 4. Évolutions du schéma

- **Côté navigateur** : `GameState.version` versionne la sauvegarde. Toute évolution du modèle ajoute une migration dans `domain/schema.ts` (comme celle de la V1) et un test.
- **Côté base** : chaque changement est un nouveau fichier daté dans `supabase/migrations/`, appliqué dans l'éditeur SQL (ou avec `supabase db push` si la CLI Supabase est utilisée). Ne jamais modifier une migration déjà appliquée.

## 5. Surveillance

L'app ne collecte aucune statistique d'usage. En cas de problème : l'onglet *Actions* de GitHub (échecs de build), et les journaux *Logs* de Supabase (auth et base).
