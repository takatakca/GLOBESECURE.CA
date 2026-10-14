# File des tâches — GlobeSecure

Les tâches sont classées selon la sécurité, le caractère réalisable dans GitHub et la dépendance aux accès réels.

| Priorité | État | Travail | Condition de fin |
| --- | --- | --- | --- |
| P0 | En cours | Protéger l'inventaire du contenu officiel du site et éviter les régressions de source | Inventaire détaillé conservé, tests réussis |
| P0 | En cours | Contrôles d'accès, confidentialité GPS, rapport client | Relecture sécurité, tests réels, absence d'accès inter-tenant |
| P0 | Bloqué externe | Récupérer application MochaHost et ses configurations sans secrets | Sauvegarde et comparaison des versions établies |
| P0 | Bloqué externe | Provisionner environnement de staging | Accès SSH, racine isolée, processus Node/TLS/health validés |
| P0 | Bloqué externe | Raccorder TAKATAK Auth, PostgreSQL et réception Resend | Identifiants serveur injectés, migrations et tests intégrés réussis |
| P1 | À faire | Gestion de mandats et affectations basée sur l'identité centrale | Données réelles, permissions et UI opérationnelles |
| P1 | À faire | Carrières, candidatures sécurisées et consentements | Livraison vérifiée, politique de traitement approuvée |
| P1 | À faire | Rondes, horaires, feuilles de temps, export paie | Tests métier, audit, isolation des tenants |
| P1 | À faire | Parité visuelle/mobile et accessibilité | Audit design, clavier, lecteurs d'écran, tailles d'écran |
| P0 | Bloqué externe | Déployer la version validée | Bascule réversible, santé et SHA sur production vérifiés |

À chaque reprise, commencer par le premier chantier exécutable sans mettre en danger l'application actuelle.
