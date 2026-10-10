# Changelog

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [2.1.0] - 2026-10-10

Refonte visuelle, pensée aussi pour l'ordinateur.

### Changed
- Sur ordinateur : barre latérale de navigation (raccourcis 1 à 4, N pour ajouter), en-tête de page avec la date, héros en colonne à droite à partir de 1200 px.
- Icônes dessinées (un seul trait) à la place des emojis dans la navigation, les statistiques, les quêtes, les boss et la boutique.
- Titres en serif et chapitres en petites capitales, dans la grammaire visuelle d'Arpagon ; dégradés et halos lumineux retirés.
- Les fenêtres s'ouvrent centrées sur grand écran au lieu de monter du bas.

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
