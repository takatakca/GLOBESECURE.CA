# Relève de développement — GlobeSecure

Date : 2026-10-14

## Lecture obligatoire

1. `README.md`, `docs/ROADMAP.md`, `docs/AUTH.md`, `docs/DEPLOYMENT.md`.
2. Branche `main`, derniers commits et workflow `GlobeSecure CI`.
3. État réel de l'application MochaHost indépendante : il n'y avait aucun code historique dans ce dépôt lorsque le travail a commencé.
4. Validation de l'application présente au domaine avant toute bascule.

## Réalisations GitHub

- Next.js 16, site vitrine français responsive, services, formulaire de soumission, SEO.
- Route contact validée, envoi Resend conditionné aux variables d'environnement.
- OIDC PKCE TAKATAK, session serveur signée, entitlement et rôle tenant-scopés.
- Agent START/STOP avec géolocalisation volontaire, révocation de consentement, positions autorisées seulement en quart.
- Rapports d'incident avec journal d'audit et supervision limitée au tenant.
- Schémas PostgreSQL et tests unitaires.
- GitHub Actions : installation, tests, production build, artefact standalone.

## Blocages de mise en service

Les identifiants OIDC, le fournisseur PostgreSQL, le domaine expéditeur, la politique complète de protection des renseignements et la racine de staging cPanel ne sont pas configurés dans ce nouveau code. Ne pas prétendre que l'application est en production, ni altérer le site historique sans rapprochement.

## Prochaines étapes concrètes

- Récupérer, comparer et intégrer le code source réel de MochaHost sans perte des fonctionnalités existantes.
- Créer la base de staging et appliquer les trois migrations.
- Configurer le client TAKATAK Auth avec les claims attendus et la redirection HTTPS.
- Sécuriser les secrets et les rôles ; tester le pointage et la révocation sur appareils réels.
- Finaliser la politique de confidentialité et la rétention programmée des données GPS.
- Compléter le portail client et les rapports publiables avec droit d'accès explicite.
- Installer le flux d'assignation, la vérification des permis, les rondes QR/NFC, les horaires et l'export de paie.
- Vérifier le compte MochaHost, le proxy TLS et le dossier `.next/static`, puis activer le déploiement de staging contrôlé.
