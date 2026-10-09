# ⚔️ LifeQuest

Ta vie comme un jeu vidéo : tes habitudes deviennent des quêtes, tes gros objectifs des boss, et chaque effort te rapporte de l'XP et de l'or.
Application web installable (PWA), utilisable hors ligne, avec synchronisation facultative entre appareils.

## Fonctionnalités

- **Quêtes quotidiennes** avec séries 🔥 et bonus d'XP (jusqu'à +50 %), **missions** ponctuelles et **quêtes bonus** tirées au hasard.
- **PV et K.O.** : une quotidienne ratée coûte des PV le lendemain ; à 0 PV, tu perds la moitié de ton or.
- **Boss** : un gros objectif découpé en étapes, avec date limite et butin à la victoire.
- **5 statistiques** (💪 Force, 🧠 Intelligence, 🗣️ Charisme, 🎯 Discipline, 💰 Richesse), **rangs**, **succès**, **boutique** de vraies récompenses.
- **Compte facultatif** (code par e-mail, sans mot de passe) pour retrouver ta partie sur téléphone et ordinateur.

## Stack

| Rôle | Outil |
|---|---|
| Interface | React 19 + TypeScript strict, Vite 6 |
| État | Zustand (le jeu est calculé par un domaine en fonctions pures) |
| Validation | Zod (toute sauvegarde venue de l'extérieur) |
| Hors ligne / installation | vite-plugin-pwa (Workbox) |
| Compte et synchronisation | Supabase (Auth + Postgres avec RLS), chargé seulement si configuré |
| Tests | Vitest (domaine), Playwright (parcours complets) |
| Hébergement | GitHub Pages, déployé par GitHub Actions |

## Démarrage rapide

Prérequis : **Node.js 20+** et npm.

```bash
git clone https://github.com/mouadjabiera06-jpg/lifequest.git
cd lifequest
npm install
npm run dev            # http://localhost:5173
```

Sans configuration, l'app fonctionne entièrement en local (sans compte). Pour activer la synchronisation, copie `.env.example` en `.env` et renseigne les deux variables Supabase : voir [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#2-activer-la-synchronisation-supabase).

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run check` | Lint + types + tests unitaires (à lancer avant chaque commit) |
| `npm run build` | Build de production dans `dist/` |
| `npm run test:e2e` | Tests Playwright sur le build (`npm run build` d'abord) |

## Structure

```
src/
  domain/     Règles du jeu en TypeScript pur (aucun React, aucun navigateur) + tests
  data/       Stockage local, accès Supabase, règles de synchronisation
  state/      Store Zustand, orchestration de la synchro, messages au joueur
  ui/         Composants, écrans, formulaires, styles
supabase/     Migration SQL (table + règles d'accès RLS)
tests/e2e/    Parcours Playwright
docs/         Architecture, sécurité, déploiement
```

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) : conception, modèle de données, décisions techniques.
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) : mise en ligne, Supabase, CI/CD.
- [docs/SECURITY.md](docs/SECURITY.md) : mesures de sécurité et limites connues.
- [CHANGELOG.md](CHANGELOG.md)

## Vie privée

Sans compte, tes données ne quittent jamais ton appareil. Avec un compte, ta partie est stockée dans ta propre ligne de base de données, que toi seul peux lire. Les avatars sont générés dans le navigateur : aucun service tiers ne reçoit ton pseudo.
