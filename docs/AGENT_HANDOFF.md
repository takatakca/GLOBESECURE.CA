# Relève obligatoire — GlobeSecure

Mise à jour : 2026-10-14.

- **Dernière tâche terminée (avant cette reprise) :** sécurisation de l'import de contenus publics anti-bot ; commit `092fe103fbe2eda1f1824a7fbb0c3224700275b6`.
- **Tâche en cours :** restaurer l'inventaire intégral du texte source et prévenir sa perte par tests ; améliorer les contrôles du site.
- **Répertoire et branche :** `takatakca/GLOBESECURE.CA`, `main`, accès push confirmé.
- **Dernier commit vérifié au début de la session :** `092fe103fbe2eda1f1824a7fbb0c3224700275b6`. À la reprise, consulter le SHA courant GitHub (la mise à jour du présent fichier peut elle-même produire un nouveau commit).
- **Fichiers de suivi créés :** `AGENTS.md`, `docs/PROJECT_STATUS.md`, `docs/TASK_QUEUE.md`, `docs/AGENT_HANDOFF.md`, `docs/DECISIONS.md`.
- **Vérifications exécutées :** lecture de la branche, arborescence, derniers commits, PR, issues, GitHub Actions et principaux fichiers. CI du SHA initial : succès, run `38622754943`.
- **Problèmes constatés :** l'inventaire `content/live-site/inventory.json` contient les titres mais a perdu les textes complets capturés précédemment ; production MochaHost non rapprochée.
- **Déploiement réel :** site actuel `globesecure.ca` indépendant et préservé ; staging non configuré/ignoré ; pas de preuve que ce code a été publié en production.
- **Accès requis sans valeurs secrètes :** sauvegarde/lecture cPanel MochaHost, paramétrage TAKATAK OIDC, PostgreSQL, Resend et secrets GitHub staging.
- **Prochaine action exacte :** consulter le dernier run CI puis restaurer le texte canonique, ajouter des tests de contenu, relancer CI et mettre à jour cette relève avec le nouveau SHA ; à défaut, continuer l'audit des contrôles de sécurité indépendants des accès externes.

Ne pas effacer le code historique ni inventer un état de déploiement. Voir `docs/RELEVE.md` pour le contexte précédent.
