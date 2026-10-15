# GLOBESECURE.CA — État du projet
Mise à jour : **15 octobre 2026**. Dépôt `takatakca/GLOBESECURE.CA`, branche `main`.

## Site et environnement

Le site **https://globesecure.ca** est la source officielle du contenu commercial. Les six services, textes d'origine archivés, pages françaises et neuf images sont dans le dépôt. L'application actuellement en ligne demeure indépendante de ce code GitHub tant que la correspondance du serveur historique MochaHost n'est pas vérifiée.

**Déploiement :** aucune publication de la nouvelle version dans le site de production n'a été prouvée. Le staging GitHub Actions est conditionné et actuellement ignoré, sans preuve de provisionnement de Node/cPanel, secrets et TLS. Ne pas modifier l'ancien document root ni écraser son code sans sauvegarde et procédure de retour arrière.

## Terminé en code, vérifié en CI

- Next.js 16 responsive, contenu et services officiels, formulaires public et carrière désactivés sans accord vie privée et messagerie.
- TAKATAK Auth OIDC/PKCE et claims `globesecure_access`/tenant/rôles (raccordement réel non confirmé).
- Pointage START/STOP volontaire avec localisation consentie et révocable ; incidents et journal d'audit.
- Espaces superviseur/client avec accès par tenant et publication manuelle de rapports.
- **Nouveau :** inscription volontaire des agents au registre GlobeSecure (sujets issus de TAKATAK, non un registre d'identités maître) ; création/annulation d'affectations planifiées ; anti-chevauchement et limite de 16 heures par affectation.
- **Nouveau :** historique de pointages terminés des agents, consultation superviseur et export CSV protégé contre les formules, sur une période bornée et sans export silencieusement tronqué.
- Migrations PostgreSQL 001–005, tests unitaires, contrôle HTTP des pages publiques, API privées fermées, build Next.js standalone et contrôle du SHA `/api/health.release`.
- Intégration GitHub Actions avec PostgreSQL 16 jetons de test signés : inscriptions, rôles, tenants indépendants, conflits horaires, annulation inter-tenant interdite, START/STOP, pointages et CSV.

## Vérifications réelles

- CI `38734424287` : succès (API affectations, PostgreSQL, rôle/tenant, build, smoke).
- CI `38734928291` : succès (pointages et exports intégrés).
- CI `38735086878` : succès pour le dernier correctif de relevés `d9e68ae2a095932b0a6830a2b6f2677e74fdb2fa`.
- CI des documents ultérieurs : vérifier sur https://github.com/takatakca/GLOBESECURE.CA/actions ; ne pas supposer leur résultat.

## Non terminé / blocages

1. Récupération et sauvegarde du code réellement hébergé sur MochaHost ; validation de la cible Node et DNS.
2. Staging isolé opérationnel, secret SSH, `PORT`, TLS et raccordement de l'application déployée.
3. TAKATAK Auth réel, PostgreSQL de production, migrations, Resend et tests sur véritables utilisateurs.
4. Politique de confidentialité/gestion des données GPS, horaires, consentements, notification et conservation approuvées.
5. Fonctions métiers : édition d'affectations, gestion des sites/mandats, rondes QR/NFC, feuilles de temps approuvées, paie, CV sécurisés et revue UX/e2e.
6. Surveillance, rotation des secrets, sauvegardes automatisées, sécurité applicative complète, rétention programmée.

**Critère de fin :** aucune mention « 100 % » ou « en production » avant preuves de déploiement, de fonctionnement des services et de sécurité.
