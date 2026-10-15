# GlobeSecure — relève technique permanente

**Date :** 2026-10-15 · **Dépôt :** `takatakca/GLOBESECURE.CA` · **Branche :** `main`.
**Avant toute modification :** lire `AGENTS.md`, ce fichier, `docs/TASK_QUEUE.md`, puis vérifier le vrai SHA et les GitHub Actions. Le dernier SHA du présent commit documentaire ne peut être connu qu'après le push.

## Dernière fonctionnalité livrée en code

Le module de **rondes par points de contrôle** relie les sites `gs_sites`, les agents autorisés, les quarts START/STOP et les affectations. Il comporte :

- Migration `010_patrol_checkpoints.sql` : codes aléatoires de 192 bits, seul SHA-256 stocké, FK composites (`tenant_id`, `site_id`/`shift_id`), limite d'un passage par point et quart.
- Supervision `/api/supervision/patrol` et `PatrolManager.jsx` : créer, activer/désactiver un point ; présenter le code **une seule fois** ; visualiser les derniers passages du même tenant.
- Agent `/api/agent/patrol` et `AgentPatrol.jsx` : saisir le code manuellement ou le lire depuis un QR existant via l'API navigateur `BarcodeDetector`, quand elle existe ; valider quart actif, site actif et affectation temporelle au site ; l'agent voit uniquement ses passages.
- Ce système établit la **possession d'un code**, et **ne garantit pas la présence physique** : un code statique peut être copié. Aucune nouvelle localisation ou photo n'est collectée. L'outil ne génère pas encore directement une image QR ni une étiquette NFC; impression/encodage hors ligne et revue du modèle de preuve restent nécessaires.

## Source et travaux conservés

Le site commercial `https://globesecure.ca` demeure la référence officielle du contenu. Le dépôt contient la vitrine et les six services, TAKATAK Auth OIDC/PKCE, les espaces agents et superviseurs, autorisations par rôle/tenant, rapports, incidents, consentement GPS, affectations, registres de sites, validation de pointages et CSV, demandes clients et le runner de migrations 001–010 avec contrôle SHA-256. **Aucune de ces fonctions dans le nouveau dépôt n'est présumée être réellement en production.**

## Commits, fichiers et validations

- **Dernier commit technique poussé avant cette relève :** `2b60b6782921c181a6715e986b17bb79b156b847` (tests complémentaires de rondes).
- Modifications de cette reprise : `db/migrations/010_patrol_checkpoints.sql`, `lib/patrol.mjs`, `tests/patrol.test.mjs`, `app/api/{supervision,agent}/patrol/route.js`, `app/supervision/PatrolManager.jsx`, `app/agent/AgentPatrol.jsx`, `app/{agent,supervision}/page.jsx`, `app/globals.css`, `scripts/integration-assignments.mjs` et documents de suivi.
- Exécution CI `38791376787` (commit `82f2fd1b1a33acda89bb5332e8c3fc525e7a0faf`) **réussie**, avec tests PostgreSQL des rondes : codes confidentiels, autorisations des tenants, quart inactif rejeté, un passage/point/quart, activation/désactivation, permissions client/agent.
- Exécution du dernier scénario complémentaire `2b60b678` et de ce commit documentaire : **vérifier le résultat dans GitHub Actions** avant d'annoncer leur réussite. Ne jamais extrapoler depuis les runs antérieurs.
- Pipeline CI : `npm ci` (Node 22), `npm test`, build Next.js standalone, smoke HTTP sur port 3077 et test d'intégration PostgreSQL 16 sur port 3078 avec `scripts/integration-assignments.mjs`. Le script de migrations est rejoué pour contrôler l'idempotence.

## Problèmes connus et déploiement

- GitHub staging `.github/workflows/staging.yml` : **désactivé / exécutions ignorées**. Aucun déploiement vérifié du nouveau code sur `globesecure.ca`; ne pas toucher au document root existant.
- Aucun accès direct vérifié au code et aux sauvegardes de l'ancien hébergement MochaHost. Pas de validation d'un vrai login TAKATAK, d'une base PostgreSQL hors CI, d'un envoi Resend ou du certificat/port Node staging.
- Activation de la collecte des données clients/candidats conditionnée à `PRIVACY_POLICY_APPROVED=true` seulement après approbation réelle; GPS, rétention des rondes et preuves de passage à valider.
- Autres modules ouverts : mandats contractuels, notifications, politiques de ronde et preuve de présence, étiquettes QR/NFC auto-générées, paie réglementaire, conservation/purge, recrutement avec CV sécurisé, tests appareils réels.

## Accès nécessaires (sans divulguer de secrets)

Inventaire et sauvegarde vérifiés MochaHost, configuration du staging Node 22 SSH/TLS et domaine HTTPS distinct, variables/secrets TAKATAK OIDC, PostgreSQL réel, Resend, politique de confidentialité approuvée, permissions DB minimales. Aucun secret ne doit être copié dans GitHub.

## Prochaine action exacte

1. Vérifier `git log -1`, le dernier run GitHub CI ainsi que les issues/PR ; corriger une éventuelle erreur.
2. Pour un chantier exécutable indépendant du serveur : compléter la rotation de codes de ronde / étiquettes QR hors ligne et tests de concurrence/accès, ou poursuivre les mandats et approbations métier, puis pousser un commit testé.
3. Dès qu'un accès MochaHost est validé : sauvegarder/inventorier la production existante, préparer staging strictement isolé, appliquer `010_patrol_checkpoints.sql` après 009 sur DB sauvegardée avec `scripts/migrate-db.mjs`, connecter OIDC réel et vérifier `/api/health.release` sur HTTPS avant toute bascule. Sans ces étapes, **pas de publication production**.

Le dépôt GitHub préserve le travail entre sessions; aucune reprise automatique n'est active sans orchestrateur externe autorisé.
