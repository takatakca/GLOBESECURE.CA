# Déploiement GlobeSecure / MochaHost

La génération Next.js se fait sur un runner GitHub Actions (Node 22), **jamais sur le terminal cPanel**. Les dépendances sont figées par `package-lock.json` et installées via `npm ci` en CI comme en staging. L'application utilise `output: "standalone"`.

## Protection de la production existante

Le nouveau dépôt ne reflète pas nécessairement le contenu déployé. Une cible historique a été identifiée sur MochaHost : `/home/bolonca/apps/globesecure`. Un ancien incident indiquait que la racine documentaire du domaine pouvait être `/home/bolonca/globesecure.ca`. Ne pas écraser l'une ou l'autre avant :
1. sauvegarde complète de l'application actuelle et de sa configuration (hors Git) ;
2. relevé des versions, pages, fonctions, dépendances et schéma DB en place ;
3. validation du mappage Node/cPanel, nom de script startup et des domaines ;
4. validation de la stratégie de bascule et de retour arrière.

## Variables de site

Copier `.env.example` vers `.env.local` pour le développement. En environnement serveur, injecter :

- `NEXT_PUBLIC_SITE_URL=https://globesecure.ca`
- `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` (domaine expéditeur vérifié)

En l'absence de ces dernières variables, l'API contact renvoie HTTP 503, sans perte silencieuse de demandes.

## CI et publication

`.github/workflows/ci.yml` exécute les tests et la compilation sur chaque push/PR. Le workflow `.github/workflows/staging.yml` peut transférer une version vers une racine de staging **distincte** uniquement après configuration et activation par la variable `GLOBESECURE_STAGING_ENABLED=true`. Le workflow interdit un chemin différent du motif `/home/<utilisateur>/apps/globesecure-staging` et ne touche pas la production historique. Pour publier un build en respectant cPanel :

- Générer `.next/standalone` sur GitHub Actions ;
- copier `.next/static` vers `.next/standalone/.next/static` et `public` vers le standalone ;
- transférer les artefacts vers une **nouvelle** racine de staging isolée via SSH/SFTP ;
- démarrer le `server.js` standalone avec Node 22, `PORT` adapté au service Node cPanel et les variables secrètes côté hébergeur ;
- vérifier `/api/health`, les pages, la réception du formulaire, les logs et le certificat TLS ;
- activer la bascule de production seulement ensuite.

Variables GitHub nécessaires au staging : secrets `GLOBESECURE_STAGING_HOST`, `GLOBESECURE_STAGING_SSH_PORT`, `GLOBESECURE_STAGING_USER`, `GLOBESECURE_STAGING_SSH_PRIVATE_KEY`, `GLOBESECURE_STAGING_KNOWN_HOSTS`, vars `GLOBESECURE_STAGING_APP_ROOT`, `GLOBESECURE_STAGING_URL`, et `GLOBESECURE_STAGING_ENABLED`. Provisionner l'application Node (startup `server.js`) et variables dans cPanel avant activation.

**État actuel : pas de déploiement de production affirmé ni déclenché.**

## Vérifier la version réellement déployée

Le build intègre le SHA Git dans `GET /api/health` (champ `release`). La CI vérifie cette valeur sur son serveur HTTP autonome, puis le workflow staging compare le SHA obtenu via l'URL publique de staging à `DEPLOY_SHA`. Un décalage fait échouer le pipeline, **même si l'endpoint renvoie 200**. Cela ne prouve pas une production saine : les dépendances et secrets réels doivent aussi être validés avant une bascule.

## Sécurité des formulaires publics

Les API de soumission et de recrutement échouent avec HTTP 503 tant que `PRIVACY_POLICY_APPROVED=true` n'a pas été approuvé dans le contexte légal réel et que `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` et le destinataire `CONTACT_TO_EMAIL` ou `CAREERS_TO_EMAIL` ne sont pas configurés. Ne pas définir la variable d'accord par simple commodité.

Les formulaires appliquent une limitation en mémoire par instance. Les en-têtes `X-Real-IP` / `X-Forwarded-For` ne sont utilisés que si `GLOBESECURE_TRUST_PROXY_HEADERS=true`, une fois le proxy de confiance configuré pour retirer les valeurs client non fiables. Sinon le quota est partagé par instance. Déployer un contrôle anti-abus côté proxy/WAF pour une exploitation publique à grande échelle.

## Migrations et validation des nouveaux modules opérationnels (2026-10-15)

Après **sauvegarde vérifiée** et sur l'environnement de staging, appliquer dans l'ordre `db/migrations/001_init.sql` à `005_assignments.sql` sur PostgreSQL 16 ; ne jamais tester les migrations sur une base de production non sauvegardée. La migration 005 introduit `gs_agent_roster` et `gs_assignments`, rattachés aux sujets TAKATAK par tenant. Les droits du compte DB doivent rester minimaux.

`GlobeSecure CI` provisionne un conteneur PostgreSQL 16 éphémère et lance `node scripts/integration-assignments.mjs` après le build. Ce script exige explicitement `GLOBESECURE_ALLOW_TEST_DB=true` et refuse tout hôte distant ou base autre que `globesecure_test`. Il ne doit **jamais** être exécuté sur la production. Les exports d'heures nécessitent l'autorisation de superviseur et ne constituent pas des paies approuvées.

Une validation de production requiert toujours les vrais clients OIDC, les environnements certifiés, les données et permissions réelles, une politique de rétention et une procédure d'approbation des heures.
