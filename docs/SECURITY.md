# Sécurité

## Modèle de menace

LifeQuest stocke des données personnelles peu sensibles (objectifs, habitudes, pseudo, e-mail si compte). Risques principaux : lecture ou modification de la partie d'un autre joueur, injection de contenu via une sauvegarde importée, fuite de clés.

## Mesures (revue OWASP)

| Point | État | Détail |
|---|---|---|
| Validation des entrées | ✅ | Formulaires validés par le domaine (`editing.ts` : longueurs, plages, listes fermées). Toute sauvegarde (localStorage, import, cloud) passe par le schéma Zod `gameStateSchema` ; un fichier importé est limité à 1 Mo. |
| Injections | ✅ N/A | Aucun SQL écrit côté client : le SDK Supabase envoie des requêtes paramétrées via PostgREST. |
| XSS | ✅ | React échappe tout le texte ; aucun `dangerouslySetInnerHTML`. CSP stricte au build : `script-src 'self'`, `object-src 'none'`, `connect-src` limité au projet Supabase. |
| CSRF | ✅ N/A | Pas de cookie de session : le jeton Supabase est envoyé dans l'en-tête `Authorization`. |
| Authentification | ✅ | Supabase Auth, code à usage unique par e-mail (flux PKCE). Aucun mot de passe ni crypto maison. |
| Autorisation / IDOR | ✅ | Règles RLS sur `saves` : `auth.uid() = user_id` pour lire, créer, modifier, supprimer. Le rôle `anon` n'a aucun droit. L'identifiant envoyé par le client ne suffit jamais. |
| Secrets | ✅ | Seule la clé publique `anon` est dans le build (prévue pour). `.env` ignoré par git ; `.env.example` fourni. |
| Chiffrement | ✅ | HTTPS imposé par GitHub Pages et Supabase. |
| Limitation de débit | ✅ | Envoi des codes limité par Supabase Auth (erreur 429 affichée clairement). Taille d'une sauvegarde plafonnée à 256 Ko en base. |
| Dépendances | ✅ | Versions exactes + `package-lock.json` ; `npm audit --omit=dev --audit-level=high` bloque la CI. `rollup` est forcé en 4.64.3 (`overrides`) : versions < 4.59 vulnérables, et 4.64.2 a un défaut de performance. |
| En-têtes | ⚠️ Partiel | GitHub Pages ne permet pas d'en-têtes HTTP personnalisés : la CSP est posée en `<meta>`. `frame-ancestors` (anti-clickjacking) n'est pas applicable en `<meta>` ; le risque est faible (aucune action sensible en un clic). |
| Téléversements | ✅ N/A | Seul l'import de sauvegarde lit un fichier, localement, validé et plafonné. |

## Données personnelles

- Sans compte : tout reste dans le navigateur.
- Avec compte : e-mail (Supabase Auth) et partie (table `saves`). Le joueur peut supprimer sa sauvegarde en ligne depuis Profil → « Supprimer en ligne ». La suppression du compte d'authentification se fait sur demande dans le tableau de bord Supabase (limite connue).
- Avatars générés localement : le pseudo n'est envoyé à aucun service tiers.
- Aucun traceur, aucune statistique d'usage.

## Signaler une faille

Ouvrir une *Security advisory* privée sur le dépôt GitHub (onglet Security → Report a vulnerability), plutôt qu'une issue publique.
