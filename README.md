# ⚔️ LifeQuest

Ta vie comme un jeu vidéo : termine tes quêtes, gagne de l'XP, monte de niveau, bats tes boss.

Une app web en **un seul fichier HTML**. Pas de compte, pas de serveur : tes données restent sur ton appareil (localStorage). Elle fonctionne hors ligne et s'installe sur le téléphone comme une vraie app.

## Comment ça marche

| Élément | Règle |
|---|---|
| **Quêtes quotidiennes** | Tes habitudes. Facile 10 XP · Moyen 25 XP · Difficile 50 XP. Chaque jour d'affilée augmente ta série 🔥 et ton bonus d'XP (jusqu'à +50 %). |
| **PV** | Une quotidienne ratée te coûte 3, 5 ou 8 PV le lendemain. À 0 PV, c'est le K.O. : tu perds la moitié de ton or. Chaque quête terminée rend 1 PV, un niveau gagné les rend tous. |
| **Missions** | Objectifs ponctuels. Le bouton 🎲 tire une quête bonus au hasard. |
| **Boss** | Un gros objectif découpé en étapes (un partiel, un projet…). Chaque étape lui retire 1 PV. Victoire : +20 XP et +10 🪙 par PV. Après la date limite, il t'attaque chaque jour. |
| **Stats** | 💪 Force · 🧠 Intelligence · 🗣️ Charisme · 🎯 Discipline · 💰 Richesse, chacune avec son niveau. |
| **Boutique** | Dépense ton or en vraies récompenses que tu choisis toi-même, ou en potion de soin. |
| **Rangs** | Novice → Apprenti (5) → Aventurier (10) → Héros (20) → Champion (35) → Légende (50). |

Le **mode pause** (Profil) gèle les dégâts et les séries pendant les vacances ou une maladie.

## Utiliser l'app

- **Sur ordinateur** : télécharge le dépôt (Code → Download ZIP) et ouvre `index.html` dans ton navigateur.
- **Sur téléphone** : publie le dépôt avec GitHub Pages, ouvre le lien, puis « Ajouter à l'écran d'accueil ».

Pense à **exporter ta sauvegarde** de temps en temps (Profil → Exporter) : vider les données du navigateur efface la partie.

## API utilisées (gratuites, sans clé)

- [DiceBear](https://www.dicebear.com) : avatars du héros et des boss. Hors ligne, une initiale les remplace.
- [Open5e](https://open5e.com) : noms de monstres aléatoires pour les boss. Hors ligne, une liste intégrée prend le relais.

Les citations du jour et les quêtes bonus sont intégrées à l'app, en français.
