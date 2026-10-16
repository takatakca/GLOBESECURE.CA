# GLOBESECURE.CA — RELÈVE OPÉRATIONNELLE

**Mise à jour :** 15 octobre 2026, 23 h (heure de Montréal).
**Dépôt :** `takatakca/GLOBESECURE.CA` — branche `main`.
**Dernier commit technique avant cette relève :** `f1b86824cda38977c1b8497cc13b0dcce58da798`. Un nouveau SHA est créé par le présent commit documentaire : lire GitHub HEAD au prochain lancement.

## Dernière tâche terminée — rondes planifiées et signalement des contrôles manquants

Suite de la gestion des sites, agents et QR de sécurité déjà existante :

- Migration additive `011_patrol_schedule.sql` : planification d'un passage par point et affectation, fenêtre de tolérance de 5 à 120 minutes, annulation contrôlée et journal d'événements append-only.
- API de supervision `/api/supervision/patrol/schedule` : lecture des statuts calculés depuis PostgreSQL (`upcoming`, `due`, `overdue`, `completed`, `cancelled`, `suspended`), programmation et annulation des contrôles futurs, export CSV privé et protégé contre l'injection de formules.
- API agent `/api/agent/patrol/schedule` : chaque agent voit exclusivement les passages attendus de ses affectations, sans liste de tous les sites ou agents.
- Interfaces `PatrolScheduleManager.jsx` et `AgentPatrolSchedule.jsx` : planification, état des passages, compte des contrôles en retard, actualisation manuelle et export.
- Le passage n'est réputé confirmé que si le point, l'agent authentifié, la fenêtre d'échéance et l'affectation correspondent à un véritable scan enregistré. Une affectation annulée ou un point/site désactivé ne crée pas une fausse alerte de retard.
- **Les alertes sont seulement affichées dans l'application et le CSV**. Aucun SMS, courriel, push ou ordonnanceur distant n'est connecté ; ne pas présenter un affichage de retard comme une notification envoyée.
- Le modèle actuel limite un contrôle attendu à chaque `(affectation,point)` et un scan à chaque `(quart,point)`. Les rondes répétées au même point durant un même quart nécessiteront une évolution coordonnée du schéma et des règles d'anti-rejeu.

## Vérifications

La CI de référence avant le présent travail : `38792757570` (réussie).
- `38844177738` (migration 011 et tests unitaires), **réussie**.
- `38844162817` (API + scénarios PostgreSQL de planification), **réussie**.
- `38844303675` (statuts suspendus et tests multi-tenant), **réussie**.
- Le dernier lot CSV `f1b86824` et le présent commit documentaire doivent être **revérifiés** sur GitHub Actions avant de déclarer le SHA final valide.
- CI : `npm ci`, `npm test`, `npm run build`, démarrage Next.js standalone + smoke HTTP, `scripts/integration-assignments.mjs` avec PostgreSQL 16 jetable; `scripts/migrate-db.mjs --apply` deux fois pour tester l'idempotence des migrations 001–011.
- Tests couvrent rôles TAKATAK simulés, deux tenants, propriétaires de données, échéance réelle et volontairement dépassée en DB de test, scans réconciliés, annulations, suspension, et confidentialité CSV. Les tests CI ne prouvent **pas** une connexion au vrai fournisseur TAKATAK OIDC.

## Fichiers modifiés dans cette reprise

`db/migrations/011_patrol_schedule.sql`,
`lib/patrol-schedule.mjs`, `tests/patrol-schedule.test.mjs`,
`app/api/supervision/patrol/schedule/route.js`,
`app/api/agent/patrol/schedule/route.js`,
`app/supervision/PatrolScheduleManager.jsx`,
`app/agent/AgentPatrolSchedule.jsx`,
`app/supervision/page.jsx`, `app/agent/page.jsx`,
`scripts/integration-assignments.mjs`, `tests/migrations.test.mjs`,
`docs/AGENT_HANDOFF.md`, `docs/PROJECT_STATUS.md`, `docs/TASK_QUEUE.md`, `docs/DEPLOYMENT.md`, `docs/DECISIONS.md`, `README.md`.

## Déploiement réel, problèmes et accès

Le staging `.github/workflows/staging.yml` **reste désactivé/ignoré**, et l'ancienne production **https://globesecure.ca** n'a pas été remplacée. Aucun déploiement du code nouveau sur un domaine accessible n'est vérifié ; ne pas prétendre « déployé ». Avant toute publication : sauvegarde et inventaire de l'ancienne installation MochaHost, staging réellement isolé sur Node 22/HTTPS, variables OIDC TAKATAK, PostgreSQL, Resend, configuration sûre des comptes et politique de confidentialité/conservation approuvée. Ne jamais ajouter les secrets ou QR confidentiels dans GitHub.

Autres chantiers non clos : alertes proactives (email/SMS/push conditionnées aux services/configurations réels), roulements répétés par point, rattachement contractuel aux mandats clients, vérification de présence sur le terrain, NFC, régularisation/paie, recrutement, purge, tests e2e smartphone, exploitation et déploiement réels.

## Prochaine action exacte

1. Vérifier le SHA HEAD et le dernier run CI; corriger les échecs éventuels, puis consigner le résultat.
2. Poursuivre les rondes répétées/notifications avec une politique et un fournisseur de livraison réellement configurés, ou les mandats clients et rapports opérationnels; couvrir tous les droits/tenants par tests.
3. Lorsque l'infrastructure réelle est accessible : sauvegarder MochaHost, configurer staging isolé et sa base, y appliquer les migrations 001–011 avec les garde-fous, connecter TAKATAK Auth et contrôler le SHA renvoyé par `/api/health` sur l'URL effective avant toute bascule.

**Le dépôt conserve le travail, mais une session ChatGPT ne redémarre pas automatiquement sans orchestrateur autorisé.**
