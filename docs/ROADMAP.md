# GlobeSecure — registre des fonctionnalités et relève

Dernière mise à jour : 2026-10-14.

## État constaté

Le dépôt initial `takatakca/GLOBESECURE.CA` sur `main` ne contenait que `README.md`. Aucun ancien code, branche secondaire, PR ou issue n'était disponible. Une application Next.js autonome a été signalée par l'historique technique sur MochaHost à `/home/bolonca/apps/globesecure`, avec un écart possible entre racine documentaire `/home/bolonca/globesecure.ca` et racine Node. Elle **n'a pas été récupérée** et ne doit pas être écrasée.

## Lots

| État | Chantier |
| --- | --- |
| Livré dans le dépôt | Fondation Next.js 16, vitrine premium responsive, pages de services, SEO |
| Livré dans le dépôt | Endpoint de demande de soumission avec validation, antispam basique et transport configuré par secret |
| Livré dans le dépôt | CI (tests et compilation) et configuration standalone |
| À raccorder | Livraison réelle des courriels : domaine expéditeur vérifié, clé et destinataire |
| À réaliser | Inventaire/sauvegarde du site MochaHost existant, mapping DNS et startup cPanel |
| À réaliser | TAKATAK Auth via OIDC/OAuth PKCE, identité centrale et droits GlobeSecure uniquement |
| À réaliser | PostgreSQL / PostGIS, schémas avec isolation de données par organisation |
| À réaliser | Espace agent : quarts début/fin, consentement de géolocalisation, suivi limité au quart, journal d'audit |
| À réaliser | Espace client : mandats et rapports limités au client autorisé |
| À réaliser | Supervision : affectations, tableaux d'opérations, carte géographique à rôles contrôlés |
| À réaliser | Incidents : pièces jointes sécurisées, horodatage, validation, audit |
| À réaliser | Ronds de garde QR/NFC, certifications, horaires, feuilles de temps et export paie |
| À réaliser | Politique complète de confidentialité, propriétaire légal, contact officiel, durées de rétention |
| À réaliser | Contrôles de sécurité et tests d'intégration/e2e avant mise en production |

## Règles d'architecture

1. GlobeSecure est une application isolée du tableau de bord général GROUPE TAKATAK ; l'accès se fait via une permission ou un entitlement explicite.
2. Les utilisateurs et identités relèvent de TAKATAK Auth, mais chaque organisation cliente voit exclusivement ses propres données.
3. La localisation ne peut être capturée qu'avec consentement explicite, pendant un quart actif. START active le suivi, STOP l'arrête, sans surveillance hors quart.
4. Journaliser les accès, changements d'affectation, corrections de feuilles de temps, consentements, interventions et incidents.
5. Aucun secret en dépôt. Aucun faux formulaire connecté, aucune fausse authentification, aucun faux tableau en temps réel.
6. Toute reprise d'agent commence par lire cette page, les derniers commits, les GitHub Actions et l'état du déploiement avant d'effectuer des changements.

## Prochaine tâche prioritaire

**Réconcilier le code source de l'application déjà déployée sur MochaHost**, puis compléter TAKATAK Auth et la base de données sur une branche/instance de staging. Vérifier les comptes et les politiques d'accès avant d'activer la géolocalisation.
