# Consignes de relève — GlobeSecure

Avant toute modification, lire dans cet ordre : `docs/AGENT_HANDOFF.md`, `docs/PROJECT_STATUS.md`, `docs/TASK_QUEUE.md`, `docs/DECISIONS.md`, `docs/DEPLOYMENT.md`, `docs/SOURCE-OF-TRUTH.md`, `docs/AUTH.md`, puis le code et les derniers commits/Actions.

Le site **https://globesecure.ca** est la référence commerciale ; la branche GitHub `main` est la référence du code en cours. NE PAS remplacer le site actuel avant vérification de la source historique, sauvegarde et déploiement de staging validé.

Respecter l’identité TAKATAK centrale, les entitlements GlobeSecure, le cloisonnement des organisations et le consentement localisé au quart. Ne jamais exposer de secrets ni de renseignements personnels dans le dépôt. Aucun faux contrôle, aucun résultat de tests ou déploiement inventé.

Cycle de travail : découvrir → corriger → tests/compilation → commit sur branche autorisée (sans force-push) → GitHub Actions → relève. Vérifier le SHA attendu avant toute mise à jour de `main`. Mettre à jour les documents de suivi avant la fin de chaque session ; les sessions ne reprennent pas seules sans orchestrateur autorisé.
