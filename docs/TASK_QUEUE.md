# GlobeSecure — file de tâches (2026-10-15)

| Priorité | État | Tâche / condition de fin |
|---|---|---|
| P0 | CI validée, non déployée | Vitrine et six services, TAKATAK Auth et séparation des tenants (auth réel non vérifié) |
| P0 | CI validée, non déployée | Agent START/STOP + consentement, incidents, affectations |
| P0 | CI validée, non déployée | Sites, affectations, réaffectations et historique, rapports client |
| P0 | CI validée, non déployée | Pointages/approbations/CSV; paie légale non homologuée |
| P0 | CI validée, non déployée | Demandes client et workflow supervision, confidentialité fermée par défaut |
| P0 | Code/test en validation | Rondes par points de contrôle, code secret/QR facultatif, passage lié au quart et site |
| P0 | CI validée, non déployée | Runner migrations SHA-256 001–010, vérifications de santé et SHA de build |
| P0 | **Bloqué accès externe** | Sauvegarde/inventaire vrai code MochaHost existant |
| P0 | **Bloqué configuration** | Staging Node/TLS/SSH + secrets, DB, connexion réelle TAKATAK Auth |
| P0 | **Bloqué validation juridique** | Vie privée, localisation GPS, rétention, responsables et droits |
| P1 | À faire | Génération locale d'étiquettes QR/NFC, rotation des codes, stratégie anti-rejeu et preuve de présence |
| P1 | À faire | Tours/rondes planifiés, alertes de passages manquants, inspection et rapports |
| P1 | À faire | Gestion des mandats commerciaux et notifications aux agents |
| P1 | À faire | Paie, correction horaire approuvée, exigences réglementaires |
| P1 | À faire | Gestion des formations, permis, recrutement/CV sécurisés |
| P1 | À faire | Sécurité renforcée, WAF, purge automatisée, tests physiques et accessibilité |
| P0 | **Bloqué validation** | Release réelle HTTPS vérifiée et rollback test avant bascule |

Le chantier reprenable immédiatement est la rotation/émission des codes QR ou les mandats; voir `docs/AGENT_HANDOFF.md`. **Ne jamais remplacer la production existante sans sauvegarde.**


- **Terminé dans le dépôt :** génération locale d'images QR, impression, remplacement audité d'un code compromis et préservation des passages. Tests CI de rotation et de rendu réussis.
- **Reste à faire :** intégration NFC, tournées planifiées et alertes, essais sur appareils réels, sécurisation des étiquettes sur site et politique de preuve de présence. Le code QR statique reste transférable.
