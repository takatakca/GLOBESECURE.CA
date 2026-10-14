# État réel — GlobeSecure

Date : 2026-10-14. Dépôt : `takatakca/GLOBESECURE.CA` ; branche `main`.

## Livré dans le dépôt (à distinguer de la production)

- Site Next.js français responsive : 6 services du site public, pages À propos, contact, carrières, soumission, informations d'entreprise, médias originaux.
- TAKATAK Auth OIDC/PKCE : code de connexion, sessions signées, entitlement et rôle par tenant (raccordement externe non confirmé).
- Espace agent : START/STOP, localisation consentie en quart, révocation, création d'incidents.
- Espace superviseur : quarts/derniers points, incidents, publication manuelle de rapports.
- Espace client : consultation des rapports publiés pour l'organisation autorisée.
- Migrations PostgreSQL 001–004 ; tests unitaires, compilation Next.js standalone et workflow GitHub Actions.
- Scripts manuels d'inventaire du site public ; protection contre les pages anti-bot.
- CI du commit initial de reprise `092fe103` : succès (run `38622754943`). Aucun déploiement staging confirmé ; workflow correspondant ignoré.

## Non terminé / pas vérifié

- Récupération et audit du vrai code MochaHost, comparaison des éléments manquants.
- Configuration réelle des secrets OIDC/Resend, PostgreSQL, base et migrations, tests d'intégration.
- Vérification des licences/coordonnées/mentions légales et politique complète de rétention.
- Affectations et horaires, rondes, contrôle des formations et permis, export paie.
- Sauvegarde, staging fonctionnel, vérification de la version et bascule de production.

Aucun « 100 % » ni « déployé » ne peut être affirmé aujourd'hui.
