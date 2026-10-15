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
