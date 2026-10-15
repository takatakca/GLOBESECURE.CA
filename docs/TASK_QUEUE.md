# GLOBESECURE.CA — File de tâches
Date : 2026-10-15. Poursuivre les tâches indépendantes malgré les dépendances externes.

| Priorité | État réel | Tâche | Condition de fin |
| --- | --- | --- | --- |
| P0 | Terminé dans le dépôt, CI réussie | Migration du contenu public canonique ; 6 services/9 médias | Tests de parité et contrôles anti-bot |
| P0 | Terminé dans le dépôt, CI réussie | CI verrouillée, smoke et SHA exact | Build reproductible et contrôles HTTP |
| P0 | Terminé dans le dépôt, CI réussie | Inscription agents et affectations | UI/API, contraintes tenant, conflit d'horaire, tests PostgreSQL |
| P0 | Terminé dans le dépôt, CI réussie | Historique de pointage / export CSV | Accès agent/superviseur, tenant, plage bornée, tests DB |
| P0 | En attente d'accès serveur | Sauvegarder et comparer l'ancien site MochaHost | Sauvegarde vérifiée, inventaire des fonctions, compatibilité |
| P0 | En attente de configuration | Activer un staging isolé sans remplacer l'existant | Domaine HTTPS de staging, Node, variables, health SHA |
| P0 | En attente de configuration | Raccorder OIDC TAKATAK, PostgreSQL, Resend | Migrations, comptes réels, flux de courriels et tests de rôles |
| P0 | En attente d'approbation | Vie privée, localisation et politiques de rétention | Politique approuvée, responsable, purge et validation |
| P1 | À réaliser | Modifier/réaffecter les affectations avec audit | Permissions, prévention de chevauchement, notifications |
| P1 | À réaliser | Mandats, sites protégés et demandes clients | Gestion métier liée au tenant avec vérification |
| P1 | À réaliser | Ronde QR/NFC, passages et preuves d'inspection | API et UI sécurisées, tests matériels |
| P1 | Partiel et testé en CI | Validation/révocation des pointages avec audit | Approbations en DB et interface réussies ; restent corrections d'heures, règles métier et export paie homologué |
| P1 | À réaliser | Gestion du personnel, formations, permis | Gestion autorisée sans CRM maître parallèle |
| P1 | À réaliser | Candidatures CV sécurisées | Accord légal, stockage chiffré, suppression, notifications |
| P1 | À réaliser | UX, accessibilité, tests de charge et E2E | Tests sur appareils/navigateurs réels |
| P0 | Bloqué jusqu'aux validations | Basculer la production | Release exacte vérifiée, rollback testé |

Le prochain agent doit lire `docs/AGENT_HANDOFF.md`, identifier le SHA `main` et la dernière CI, puis prendre le premier chantier indépendant autorisé. Le pipeline ne déploie pas la production actuelle sans vérification des accès et des sauvegardes.
