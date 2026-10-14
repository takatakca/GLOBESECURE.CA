# AGENT_HANDOFF — reprise GlobeSecure

**Date :** 2026-10-14. **Dépôt :** `takatakca/GLOBESECURE.CA` ; **branche :** `main`.

## Dernières tâches terminées

- Création des cinq documents obligatoires et `AGENTS.md`.
- Restauration du texte source long et inventaire des neuf images officielles ; tests de parité et garde anti-bot.
- Ajout d'une vérification de SHA release sur build et staging.
- Taille des corps JSON bornée sur les endpoints mutatifs.
- Génération automatique ponctuelle d'un véritable `package-lock.json`, passage à `npm ci`, suppression du workflow temporaire.
- Ajout d'un contact recrutement (sans CV) désactivé jusqu'à accord sur la confidentialité et configuration Resend.
- Anti-abus côté serveur sans confiance implicite dans l'adresse IP déclarée ; espaces protégés exclus de l'indexation.

## Travaux/commits

**Dernier commit de code examiné avant cette relève :** `e2c3a28fe94b3f13d530c3ccd191bcfce44caf0b`. **Dernier commit de tests unitaires validé à cet instant :** `984544f86074d91c0aa6cfe9fe9584478b7b507e` (CI réussie). Le présent commit documentaire aura un SHA postérieur : lire `git log -1` et les Actions pour le déterminer à la reprise.

Fichiers modifiés pendant la session : `AGENTS.md`, `docs/{PROJECT_STATUS,TASK_QUEUE,AGENT_HANDOFF,DECISIONS,DEPLOYMENT}.md`, `content/live-site/inventory.json`, `scripts/inventory-site.mjs`, `tests/source-parity.test.mjs`, `lib/{read-json,careers,rate-limit}.mjs`, tests associés, API contact/agent/supervision/carrières, pages et formulaires, `app/robots.js`, `next.config.mjs`, `app/api/health/route.js`, workflows CI/staging ; `package-lock.json` ajouté par GitHub Actions.

## Vérifications exécutées

- Inspection réelle GitHub : `main`, arborescence, dernières commits, PR/issues (aucun ouvert), workflows.
- Pipelines GitHub Actions avec installation verrouillée, tests Node et compilation Next.js, serveur standalone HTTP, contrôle du SHA de build ; voir le tableau Actions pour la dernière conclusion.
- Ancien site actuel non modifié ; site public vérifié par inventaire du 2026-10-14, mais les accès directs récents peuvent renvoyer anti-bot/erreur.
- Pas de tests réels avec les bases ou comptes utilisateurs, ni vérification MochaHost.

## Problèmes, secrets, déploiement

La production du nouveau code n'est **PAS prouvée**. Le staging GitHub Actions reste **désactivé/ignoré**. Les sources de l'ancienne application MochaHost, secrets OIDC/Resend, PostgreSQL, politiques vie privée et chemins cPanel ne sont pas raccordés. Ne pas écrire ces valeurs dans GitHub.

## Prochaine tâche exacte

1. Vérifier le commit `main` après le présent handoff et son dernier run CI ; corriger les éventuels tests en échec.
2. Chercher les prochains travaux exécutables indépendants dans `docs/TASK_QUEUE.md` (ex. tests d'autorisation tenant / API) et continuer les commits.
3. Pour débloquer staging : comparer et sauvegarder la vraie installation MochaHost puis configurer les vars/secrets listés dans `docs/DEPLOYMENT.md`; seulement ensuite exécuter le workflow de staging et vérifier la réponse `/api/health.release` attendue.

Ne pas recopier l'ancienne application en l'écrasant, ne pas publier de secrets, ne pas affirmer 100 %.
