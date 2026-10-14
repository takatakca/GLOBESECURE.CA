# File des tâches exécutable — GlobeSecure

État au 2026-10-14. Les lignes terminées correspondent au code GitHub et à la CI, pas à la production.

| Priorité | État | Tâche | Critère d'acceptation |
| --- | --- | --- | --- |
| P0 | Terminée dans GitHub | Restaurer contenu de globesecure.ca et protection anti-bot | Texte détaillé, images et tests de parité conservés |
| P0 | Terminée dans GitHub | Corps JSON bornés, anti-abus et noindex des portails | Tests et compilation CI |
| P0 | Terminée dans GitHub | Versionnement des builds et verrouillage des dépendances | `package-lock.json`, `npm ci`, SHA exposé par health |
| P0 | Terminée dans GitHub | Documentation AGENTS, PROJECT_STATUS, TASK_QUEUE, AGENT_HANDOFF, DECISIONS, DEPLOYMENT | Fichiers présents et à jour |
| P0 | Bloquée externe | Réconcilier et sauvegarder l'application MochaHost actuelle | Rapport des sources, DB, fichiers et restauration |
| P0 | Bloquée externe | Monter staging isolé, TLS et contrôle du SHA | Run staging réussi sur version exacte |
| P0 | Bloquée externe | Configurer TAKATAK OIDC/PostgreSQL/Resend | Secrets injectés, migrations, tests réels par rôles |
| P0 | Bloquée externe | Approuver confidentialité, politique de localisation et conservation | Responsable identifié et politique publiée ; activation contrôlée |
| P1 | Partielle | Recrutement : messages via Resend mais pas de dépôt CV sécurisé | Canal de CV sécurisé, traitement et purge vérifiés |
| P1 | À réaliser | Gestion des mandats et affectations d'agents | CRUD réel, contrôle d'organisation, audit et tests |
| P1 | À réaliser | Rondes QR/NFC, horaires, feuilles de temps, export paie | Flux métier et erreurs testés |
| P1 | À réaliser | Accessibilité, SEO, parité visuelle et performance | Vérifications navigateurs/appareils |
| P0 | Bloquée externe | Basculer la production après sauvegarde | Tests de régression, retour arrière, SHA/health réel |

Le premier chantier exécutable sans accès externe supplémentaire doit être pris avant les tâches dépendantes du serveur.

- **Terminé en CI :** smoke HTTP complet après build (`scripts/smoke-http.mjs`, 6 services, API privées, SEO, SHA). Il doit rester obligatoire lors des futures modifications.
