# GlobeSecure — Agent handoff
Dernière mise à jour : **2026-10-15**, branche `main`, dépôt `takatakca/GLOBESECURE.CA`.

## Dernière tâche terminée

Gestion d'affectations agent/superviseur et relevés d'heures, terminées dans le dépôt et intégrées dans les deux interfaces opérationnelles.

- Inscription volontaire d'agents TAKATAK par organisation.
- Affectations planifiées, annulation avec audit, validation contre doubles réservations d'horaires et accès inter-tenant.
- Pointages terminés pour chaque agent ; consultation/export CSV superviseur, dates UTC bornées ; aucune prétention de paie approuvée.
- Tests PostgreSQL 16 par GitHub Actions : demandes HTTP authentifiées avec jetons de test contrôlés, deux tenants, restrictions, START/STOP et export.
- Les cinq documents obligatoires ont été conservés et mis à jour.

## Commits et vérifications

**Dernier commit technique testé :** `d9e68ae2a095932b0a6830a2b6f2677e74fdb2fa`.
**GitHub Actions réussie :** `38735086878`.
**Commits intermédiaires :** `1b068244` (schéma/validation), `e2fe209e` (APIs), `d135b9e3` (interfaces), `08138754` (tests d'intégration), `83d02657` (service PostgreSQL CI), `2fb82c46` (bornes/CSV), `5d07e8a0` (endpoints pointage), `7c0817dd` (interfaces de relevés), `05c55301` (intégration réelle START/STOP).
**Attention :** ce document étant poussé dans un commit ultérieur, lire le dernier SHA GitHub et sa CI à la prochaine reprise.

Contrôles réels : `npm ci`, `npm test`, `npm run build`, démarrage standalone, smoke HTTP, tests PostgreSQL migrations 001–005 et scénarios multi-tenant dans `scripts/integration-assignments.mjs`. Runs clés `38734424287`, `38734928291`, `38735086878` tous réussis.

## Fichiers créés et modifiés

- `db/migrations/005_assignments.sql`
- `lib/assignments.mjs`, `lib/timesheets.mjs`
- `app/api/agent/{roster,assignments,timesheets}/route.js`
- `app/api/supervision/{assignments,timesheets}/route.js`
- `app/agent/{AgentAssignments,AgentTimesheets,page.jsx}`
- `app/supervision/{AssignmentManager,SupervisorTimesheets,page.jsx}`
- `tests/{assignments,timesheets}.test.mjs`
- `scripts/integration-assignments.mjs`
- `.github/workflows/ci.yml`, `app/globals.css`
- `docs/PROJECT_STATUS.md`, `docs/TASK_QUEUE.md`, `docs/AGENT_HANDOFF.md`, `docs/DEPLOYMENT.md`, `docs/DECISIONS.md`, `docs/AUTH.md`

## État réel du déploiement

Le code a été poussé sur `main`, mais **l'application en ligne n'a pas été remplacée**. Le staging GitHub Actions est resté ignoré (variable d'activation et déploiement non configurés). Impossible de déclarer un déploiement de production réussi. `https://globesecure.ca` demeure la source canonique du contenu.

## Erreurs, limites et accès manquants

- Aucun accès vérifié au code, aux sauvegardes et à la configuration Node de l'installation MochaHost actuelle.
- Secrets TAKATAK OIDC, PostgreSQL réel, messagerie Resend et staging SSH/TLS requis côté hébergement, sans les copier dans GitHub.
- Tests d'intégration avec fournisseur OIDC réel à réaliser ; sessions de test ne prouvent pas la configuration d'identité de production.
- Gestion de paie approuvée, rondes et mandats complets, vie privée, rétention et politique GPS non finalisées.
- Ne jamais effacer le code historique ni utiliser un force-push.

## Prochaine action exacte

1. Vérifier `main` et le dernier run CI, sans supposer que le commit de cette relève est passé.
2. Continuer le premier lot réalisable sans accès externe : **workflow de validation/correction de feuilles de temps** ou gestion structurée des sites/mandats, avec tests d'autorisation.
3. Pour déploiement, inventorier/sauvegarder MochaHost et configurer staging isolé ; vérifier le SHA `/api/health.release` sur l'URL effective avant toute bascule.

## Complément — décision sur les pointages (2026-10-15)

- **Dernière tâche terminée :** migration `006_shift_approvals.sql`, API superviseur `POST /api/supervision/timesheets/approval`, contrôle de rôle/tenant et état des décisions dans le relevé agent/superviseur/CSV. Un événement append-only documente chaque approbation ou révocation ; le relevé brut n'est pas modifié.
- **Dernier commit technique vérifié :** `4f224d289ebd8988991a2808c51aa67fabbcd3ba` ; **CI `38735806948` réussie**, y compris PostgreSQL, migrations 001–006, scénarios d'approbation/révocation, build, tests et smoke HTTP. Le présent commit documentaire aura un nouveau SHA.
- **Fichiers modifiés :** `db/migrations/006_shift_approvals.sql`, `lib/approval.mjs`, `tests/approval.test.mjs`, `app/api/supervision/timesheets/approval/route.js`, API de relevés agent/superviseur, `lib/timesheets.mjs`, interfaces `AgentTimesheets.jsx`/`SupervisorTimesheets.jsx` et `scripts/integration-assignments.mjs`.
- **Erreur corrigée :** run `38735678832` avait échoué car l'ancien script CI appliquait seulement cinq migrations ; le script applique désormais la sixième avant de tester l'API. Le run `38735806948` est réussi.
- **Tâche en cours / prochaine action exacte :** examiner la gestion structurée des mandats/sites et les corrections d'heures auditées, puis reprendre le raccordement MochaHost dès que l'accès au code historique et le staging sont vérifiés.
- **Déploiement :** aucun nouveau déploiement vérifié en production ; staging GitHub Actions ignoré/non configuré. Ne pas publier sans sauvegarde et sans preuve du SHA exposé par `/api/health`.
- **Accès manquants :** lecture/sauvegarde du site MochaHost, secrets OIDC TAKATAK, PostgreSQL cible, Resend, SSH et URL de staging, politiques vie privée et paie approuvées.

## Correctif d'accès ciblé (2026-10-15)

Les rôles d'affichage sont désormais exacts : `globesecure_admin` n'ouvre plus par défaut l'interface agent si le compte n'a pas `globesecure_agent`. Cela évite de présenter un bouton START/STOP que le backend refuse, et empêche d'étendre implicitement la géolocalisation au rôle d'administration. Code : `lib/roles.mjs`, `lib/auth.js`, `tests/roles.test.mjs`. Dernier commit de code d'approbation testé : `4f224d289ebd8988991a2808c51aa67fabbcd3ba` ; run CI `38735806948` réussi. Le présent correctif doit être vérifié sur la CI associée à son commit.

## Reprise supplémentaire — 15 octobre 2026 (module sites)

- **Dernière tâche technique terminée :** création du registre des sites sécurisés par tenant, inscription/archivage, sélection d'un site actif depuis les affectations, lien PostgreSQL composite `(tenant_id,site_id)` et tests d'isolation.
- **Dernier commit technique poussé :** `ca5b3d626607e6c03539501d9530e5061e2a66f4` (atomicité de l'audit et verrouillage concurrence de désactivation). Le présent handoff produit un nouveau SHA; le récupérer via GitHub HEAD.
- **Dernier run CI vérifié réussi au moment de cette écriture :** `38773870422` au commit `6c2713514ffd7241d12b29415f047ec19e7d56dd`, tests unitaires, build standalone, pages/permissions smoke HTTP, migrations SQL 001–007 et intégration PostgreSQL multi-tenant. Vérifier le pipeline de `ca5b3d62` et du commit handoff avant de déclarer tous les changements validés.
- **Fichiers créés/modifiés :** `db/migrations/007_sites.sql`, `lib/sites.mjs`, `tests/sites.test.mjs`, `app/api/supervision/sites/route.js`, `app/api/supervision/assignments/route.js`, `lib/assignments.mjs`, `tests/assignments.test.mjs`, `app/supervision/{SiteManager,AssignmentManager}.jsx`, `scripts/integration-assignments.mjs` et les cinq documents obligatoires.
- **Vérifications :** appels du connecteur GitHub à la branche `main`, inventaire commits/CI/PR/issues, CI avec `npm ci`, tests, build Next.js et tests SQL/HTTP; la migration 007 et les gardes tenant/actif sont couverts par le banc d'essai.
- **Erreurs corrigées :** les pipelines précédents `38773685046` et `38773747252` échouaient car le script d'intégration ne lançait que les migrations 001–006 et la nouvelle colonne `site_id` était absente. L'ajout de la migration 007 a réussi au run `38773870422`. Audits désormais transactionnels.
- **État réel du déploiement :** site de production non modifié ; staging conditionnel ignoré; aucun secret MochaHost ou accès shell confirmé. Impossible de conclure que le nouveau code tourne sur le domaine réel.
- **Accès externes nécessaires :** accès lecture/sauvegarde au site MochaHost et configuration Node/SSH de staging, TAKATAK Auth OIDC réel, PostgreSQL cible, Resend, politique de confidentialité et de géolocalisation, sans exposer de secrets.
- **Prochaine tâche exacte :** vérifier GitHub `main` et le dernier run CI ; continuer le workflow de modification/réaffectation d'un quart planifié avec audit et contrôle anti-chevauchement, ou les demandes clients tenant-scopées. Une fois MochaHost récupéré et sauvegardé, configurer staging et vérifier `/api/health.release` avant toute bascule production.


## Relève actualisée — 15 octobre 2026, réaffectation

- **Dernière tâche terminée :** modification et réaffectation d'affectations planifiées : API `/api/supervision/assignments/reschedule`, journal SQL 008 append-only, contrôle des rôles, tenant, site actif et absence de chevauchement. Interface de modification et consultation du journal de changements.
- **Fichiers créés/modifiés :** `db/migrations/008_assignment_changes.sql`, `lib/reschedule.mjs`, `tests/reschedule.test.mjs`, `app/api/supervision/assignments/reschedule/route.js`, `app/api/supervision/assignments/history/route.js`, `app/supervision/AssignmentManager.jsx`, `scripts/integration-assignments.mjs`, `app/globals.css` et documents de relève.
- **Dernier commit technique sur `main` avant cette documentation :** `7ed598576a8b6191253026fdf446f634b5673008`. Ce fichier sera suivi d'un nouveau commit documentaire : lire le SHA actuel pour la reprise.
- **Contrôles exécutés :** lecture des commits, PR et issues GitHub (aucun ouvert), workflows, tests unitaires, production build, serveur standalone, smoke HTTP, et PostgreSQL 16 éphémère avec migrations 001–008 et jetons de test multi-tenant. CI **`38774714270` réussie** pour le scénario de réaffectation/double réservation et les autres tests existants. Les pipelines des commits `0a7bf471`, `2a14974e` et `7ed59857` doivent encore être vérifiés dans leur résultat final (ils étaient en attente/queue à l'observation).
- **Incidents/corrections :** une erreur UI empêchait de réinitialiser la modification après succès; corrigée dans `2a14974e`. L'ancien banc d'essai ne connaissait pas la migration 008; elle a été ajoutée avant le scénario de réaffectation. La consultation du journal est également filtrée par tenant.
- **Statut du déploiement :** staging GitHub Actions non activé, exécutions ignorées. Aucun déploiement confirmé du nouveau code sur `globesecure.ca`. L'ancienne application MochaHost n'a pas été modifiée.
- **Accès réellement nécessaires :** sauvegarde et inventaire de l'installation MochaHost, définition du chemin Node/staging, SSH/TLS, secrets OIDC TAKATAK, PostgreSQL cible, Resend et validations des politiques de conservation; ne pas déposer de secrets Git.
- **Tâche actuellement en cours :** vérification des dernières Actions du module de réaffectation et revue de sécurité/UX après compilation.
- **Prochaine action exacte :** lire `main` et sa dernière CI, corriger tout échec; puis continuer la gestion des mandats/demandes clients ou les rondes, avec contrôle des rôles et tests multi-tenant. Pour déploiement : sauvegarder MochaHost, mettre en place staging et vérifier `/api/health.release` avant toute bascule.
