# Changelog

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [2.0.0] - 2026-10-08

Refonte complète en application structurée.

### Added
- Compte facultatif (code par e-mail) et synchronisation entre appareils via Supabase, avec détection des conflits et choix de la partie à garder.
- Import des sauvegardes de la V1 (conversion automatique).
- Validation de toute sauvegarde par schéma (import, stockage local, cloud) ; une sauvegarde locale illisible est mise de côté au lieu d'être perdue.
- 38 tests unitaires sur les règles du jeu et la synchronisation, 4 tests de bout en bout.
- CI GitHub Actions (audit, lint, types, tests, build, E2E) et déploiement automatique sur GitHub Pages.
- Politique de sécurité du contenu (CSP) ; accessibilité : rôles ARIA, focus gardé dans les panneaux, notifications annoncées.

### Changed
- Code réécrit en TypeScript strict avec React et Vite, règles du jeu isolées dans un domaine pur.
- Avatars générés dans le navigateur (plus d'appel à l'API DiceBear) ; noms de monstres intégrés (plus d'appel à Open5e).
- Service worker et manifeste générés par vite-plugin-pwa (mise à jour automatique).

### Fixed
- Un boss en retard ne frappe plus que pour les jours écoulés depuis la dernière visite (au plus 3).

## [1.0.0] - 2026-10-08

- Première version : un seul fichier HTML, données locales.
