# GLOBESECURE.CA — État du projet
Mise à jour : **15 octobre 2026**. Dépôt `takatakca/GLOBESECURE.CA`, branche `main`.

## Site et environnement

Le site **https://globesecure.ca** est la source officielle du contenu commercial. Les six services, textes d'origine archivés, pages françaises et neuf images sont dans le dépôt. L'application actuellement en ligne demeure indépendante de ce code GitHub tant que la correspondance du serveur historique MochaHost n'est pas vérifiée.

**Déploiement :** aucune publication de la nouvelle version dans le site de production n'a été prouvée. Le staging GitHub Actions est conditionné et actuellement ignoré, sans preuve de provisionnement de Node/cPanel, secrets et TLS. Ne pas modifier l'ancien document root ni écraser son code sans sauvegarde et procédure de retour arrière.

## Terminé en code, vérifié en CI

- Next.js 16 responsive, contenu et services officiels, formulaires public et carrière désactivés sans accord vie privée et messagerie.
- TAKATAK Auth OIDC/PKCE et claims `globesecure_access`/tenant/rôles (raccordement réel non confirmé).
- Pointage START/STOP volontaire avec localisation consentie et révocable ; incidents et journal d'audit.
- Espaces superviseur/client avec accès par tenant et publication manuelle de rapports.
- **Nouveau :** inscription volontaire des agents au registre GlobeSecure (sujets issus de TAKATAK, non un registre d'identités maître) ; création/annulation d'affectations planifiées ; anti-chevauchement et limite de 16 heures par affectation.
- **Nouveau :** historique de pointages terminés des agents, consultation superviseur et export CSV protégé contre les formules, sur une période bornée et sans export silencieusement tronqué. Approbation/révocation superviseur de chaque quart terminé avec historique d'événements append-only et contrôles d'accès par organisation.
- Migrations PostgreSQL 001–005, tests unitaires, contrôle HTTP des pages publiques, API privées fermées, build Next.js standalone et contrôle du SHA `/api/health.release`.
- Intégration GitHub Actions avec PostgreSQL 16 jetons de test signés : inscriptions, rôles, tenants indépendants, conflits horaires, annulation inter-tenant interdite, START/STOP, pointages et CSV.

## Vérifications réelles

- CI `38734424287` : succès (API affectations, PostgreSQL, rôle/tenant, build, smoke).
- CI `38734928291` : succès (pointages et exports intégrés).
- CI `38735086878` : succès pour le dernier correctif de relevés `d9e68ae2a095932b0a6830a2b6f2677e74fdb2fa`.
- CI des documents ultérieurs : vérifier sur https://github.com/takatakca/GLOBESECURE.CA/actions ; ne pas supposer leur résultat.

## Non terminé / blocages

1. Récupération et sauvegarde du code réellement hébergé sur MochaHost ; validation de la cible Node et DNS.
2. Staging isolé opérationnel, secret SSH, `PORT`, TLS et raccordement de l'application déployée.
3. TAKATAK Auth réel, PostgreSQL de production, migrations, Resend et tests sur véritables utilisateurs.
4. Politique de confidentialité/gestion des données GPS, horaires, consentements, notification et conservation approuvées.
5. Fonctions métiers : édition d'affectations, gestion des sites/mandats, rondes QR/NFC, feuilles de temps approuvées, paie, CV sécurisés et revue UX/e2e.
6. Surveillance, rotation des secrets, sauvegardes automatisées, sécurité applicative complète, rétention programmée.

**Critère de fin :** aucune mention « 100 % » ou « en production » avant preuves de déploiement, de fonctionnement des services et de sécurité.

## Validation des pointages (2026-10-15)

La migration `006_shift_approvals.sql` relie les décisions au couple `tenant_id`/`shift_id` par clé étrangère. Le statut `unreviewed`, `approved` ou `revoked` apparaît dans les relevés et le CSV. L'API de décision enregistre le superviseur et un événement immuable à chaque changement ; aucune modification de la durée effective ni calcul de paie n'est effectué. **Run CI `38735806948` réussi** : tests PostgreSQL pour l'approbation, la révocation et le refus d'accès inter-tenant.

## Module des sites opérationnels (2026-10-15)

Migration additive `007_sites.sql` : sites privés par tenant (`gs_sites`) et clé étrangère composite `(tenant_id,site_id)` dans `gs_assignments`. Les sites sont créés depuis la supervision, désactivables/réactivables sans supprimer les anciennes affectations. Les nouvelles affectations de l'interface choisissent un site actif, dont le libellé est récupéré du serveur et non du navigateur. Les anciennes affectations libres restent lisibles grâce au champ `site_label` historique. Les écritures sites et les audits sont atomiques ; les opérations de planification obtiennent un verrou de partage empêchant la désactivation pendant leur vérification.

**Tests GitHub Actions :** `38773870422` réussi : migration 007, deux organisations, contrôle des rôles, listes tenant-isolées, noms uniques par tenant, protection contre les sites externes ou inactifs, conservation de la dénomination serveur. Le correctif de concurrence `ca5b3d626607e6c03539501d9530e5061e2a66f4` est à vérifier dans son propre run CI.

**Non déployé sur globesecure.ca** : le staging MochaHost ne dispose pas de configuration validée ni d'une sauvegarde prouvée.


## Modification / réaffectation des quarts (2026-10-15)

Migration `008_assignment_changes.sql` : historique immuable des changements d'affectation, associant `tenant_id`, `assignment_id`, superviseur et valeurs avant/après. L'endpoint `POST /api/supervision/assignments/reschedule` est limité au rôle explicite superviseur et aux quarts futurs actifs; il refuse les conflits d'agents et vérifie les sites actifs de l'organisation. Un endpoint de consultation `GET /api/supervision/assignments/history?id=...` permet de voir la trace des modifications du même tenant. L'interface de supervision présente la modification, la réaffectation et la consultation du journal.

**Tests réels GitHub Actions :** `38774714270` réussi pour le scénario PostgreSQL de réaffectation (y compris refus de double réservation et absence d'accès inter-tenant). Les commits ultérieurs de consultation du journal/UI nécessitent le contrôle de leur dernière CI. Les fonctions ne sont pas déployées sur le site réel.
