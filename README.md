# GlobeSecure.ca

> **Source officielle du contenu :** le site déjà en ligne sur https://globesecure.ca. Les pages et textes de ce dépôt sont une base technique à réconcilier avec l'existant; ne pas écraser la production. Voir [SOURCE-OF-TRUTH.md](docs/SOURCE-OF-TRUTH.md).

Site vitrine et fondation de la plateforme GlobeSecure, agence canadienne de sécurité privée. Le dépôt GitHub initial du 14 octobre 2026 ne contenait que son titre : il ne contient **pas** le code historique éventuellement présent sur MochaHost. Ne pas substituer cette base à un déploiement existant sans sauvegarde, inventaire et validation de la correspondance des sources.

## Périmètre livré dans cette base

- Site vitrine français et responsive : événements, santé, entreprises, chantiers.
- Soumission validée côté client et serveur ; envoi via Resend uniquement si les variables sont configurées.
- Pages confidentialité, portails (état réel), sitemap, robots, endpoint de santé.
- Tests unitaires de validation, CI GitHub Actions, construction Next.js standalone hors de l'hébergement.
- **Implémentés, non activés** : connexion TAKATAK Auth / OIDC, agent START/STOP, positions en quart avec retrait de consentement, incidents, supervision tenant-scopée et schéma PostgreSQL.
- **À raccorder et valider** : secrets OIDC, PostgreSQL, politique de rétention, messagerie, espace client complet et déploiement cPanel.

## Développement

Node.js 22 et npm requis.

    npm install
    cp .env.example .env.local
    npm run dev

    npm run test
    npm run build

Ouvrir http://localhost:3000 et http://localhost:3000/api/health.

## Hébergement

Ancienne cible identifiée : `/home/bolonca/apps/globesecure` sur MochaHost. Vérifier la racine réelle de l'application cPanel et l'état de la production avant toute copie. Voir [Déploiement](docs/DEPLOYMENT.md), [Auth](docs/AUTH.md), [Feuille de route](docs/ROADMAP.md) et [Relève](docs/RELEVE.md).

## Sécurité

Ne jamais ajouter de clés, mots de passe ni informations de clients dans Git. Le site public ne prétend pas offrir de connexion agent, de suivi en direct ou de certification non vérifiée. Le formulaire échoue de manière explicite si la livraison email n'est pas configurée.

## Contenu original importé

La référence officielle est [globesecure.ca](https://globesecure.ca). GitHub conserve désormais [son inventaire public](content/live-site/inventory.json) et [neuf images du site](public/original-site/). La page d'accueil Next.js en français reprend **six services** (événementiel, chantiers, hôpitaux, entreprises, commerces, réponse aux alarmes), la mission, les valeurs, la présentation, les carrières et les renseignements de contact visibles sur le site source. Le site actuel continue de fonctionner indépendamment, sans modification de son hébergement.

## Relève et version compilée

Lire [AGENTS.md](AGENTS.md), [état réel](docs/PROJECT_STATUS.md), [tâches](docs/TASK_QUEUE.md), [décisions](docs/DECISIONS.md) et [handoff](docs/AGENT_HANDOFF.md) avant reprise. Les installations reproductibles utilisent `npm ci`. Une réponse `/api/health` indique le SHA du build (champ `release`). Les soumissions et messages carrière restent fermés avant approbation des conditions de confidentialité et configuration des destinataires réels.

## Affectations et relevés

Le registre des agents, les horaires d'affectation, l'annulation auditée et l'historique de pointage sont implémentés en code (migration `db/migrations/005_assignments.sql`). Les tests de cloisonnement multi-tenant et l'export CSV sont exécutés sur PostgreSQL éphémère dans GitHub Actions. **Non déployé en production, non raccordé à TAKATAK Auth réel et non homologué pour paie.**

Les heures peuvent maintenant recevoir une approbation/révocation explicite par un superviseur dans le code. Ces décisions sont auditées et tenant-scopées (`006_shift_approvals.sql`) ; l'export ne calcule pas automatiquement une paie ni les corrections légales.

## Sites sécurisés

La supervision gère maintenant des sites privés par organisation (`007_sites.sql`). Les affectations les référencent via une clé étrangère liée au tenant et les nouveaux horaires utilisent le nom de site enregistré côté serveur. Staging et production ne sont pas encore validés : voir `docs/AGENT_HANDOFF.md`.


## Réaffectation et journal de modifications

Les superviseurs peuvent modifier les horaires et réaffecter les quarts futurs avec une validation anti-chevauchement et un journal append-only (`008_assignment_changes.sql`). La supervision permet de consulter le journal tenant-scopé. Ces fonctions sont testées sur PostgreSQL isolé en CI; la version du site en production n'est pas confirmée comme mise à jour.
