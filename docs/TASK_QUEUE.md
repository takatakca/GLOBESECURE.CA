# GlobeSecure — file de tâches (2026-10-15)

| Priorité | État | Tâche / condition de fin |
|---|---|---|
| P0 | CI validée, non déployée | Vitrine et six services, TAKATAK Auth et séparation des tenants (auth réel non vérifié) |
| P0 | CI validée, non déployée | Agent START/STOP + consentement, incidents, affectations |
| P0 | CI validée, non déployée | Sites, affectations, réaffectations et historique, rapports client |
| P0 | CI validée, non déployée | Pointages/approbations/CSV; paie légale non homologuée |
| P0 | CI validée, non déployée | Demandes client et workflow supervision, confidentialité fermée par défaut |
| P0 | CI validée, non déployée | Rondes par points de contrôle, QR imprimable localement, passage lié au quart et au site |
| P0 | CI validée, non déployée | Runner migrations SHA-256 001–010, vérifications de santé et SHA de build |
| P0 | **Bloqué accès externe** | Sauvegarde/inventaire vrai code MochaHost existant |
| P0 | **Bloqué configuration** | Staging Node/TLS/SSH + secrets, DB, connexion réelle TAKATAK Auth |
| P0 | **Bloqué validation juridique** | Vie privée, localisation GPS, rétention, responsables et droits |
| P1 | À faire | Distribution NFC, tournées planifiées, alertes, anti-rejeu entre quarts et vérification terrain |
| P1 | À faire | Tours/rondes planifiés, alertes de passages manquants, inspection et rapports |
| P1 | À faire | Gestion des mandats commerciaux et notifications aux agents |
| P1 | À faire | Paie, correction horaire approuvée, exigences réglementaires |
| P1 | À faire | Gestion des formations, permis, recrutement/CV sécurisés |
| P1 | À faire | Sécurité renforcée, WAF, purge automatisée, tests physiques et accessibilité |
| P0 | **Bloqué validation** | Release réelle HTTPS vérifiée et rollback test avant bascule |

Le chantier reprenable immédiatement est la planification des rondes, les alertes ou les mandats; voir `docs/AGENT_HANDOFF.md`. **Ne jamais remplacer la production existante sans sauvegarde.**


- **Terminé dans le dépôt :** génération locale d'images QR, impression, remplacement audité d'un code compromis et préservation des passages. Tests CI de rotation et de rendu réussis.
- **Reste à faire :** intégration NFC, tournées planifiées et alertes, essais sur appareils réels, sécurisation des étiquettes sur site et politique de preuve de présence. Le code QR statique reste transférable.


## Actualisation de la file — 15 octobre 2026

- **Terminé dans le code, CI PostgreSQL validée :** rondes planifiées par affectation/point, échéances, tolérances, annulations auditées, suivi des passages réels, retards et suspensions, affichages agent/supervision. Migration `011_patrol_schedule.sql`.
- **À vérifier après dernier commit :** CSV de supervision avec garde tenant, filtre format et protection contre les formules; dernier run GitHub Actions.
- **À réaliser :** vrais envois d'alertes aux superviseurs, répétition d'un point dans un même quart, notifications aux agents, qualification de présence physique, politique de conservation et audit sur environnement réel.
- **Bloqué côté hébergement :** sauvegarde/source MochaHost, staging Node 22 HTTPS + PostgreSQL, TAKATAK Auth OIDC et secrets, approbation vie privée/contrôles métier, release puis rollback vérifiés. Ne pas modifier la production avant ces étapes.

- **15 octobre 2026 :** rafraîchissement visible toutes les 60 s ajouté dans les portails (sans notification courriel/SMS ni tâche de fond). Voir les dernières Actions avant déploiement.
