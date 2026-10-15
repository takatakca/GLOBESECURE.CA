# GlobeSecure — état vérifié au 15 octobre 2026

Dépôt : `takatakca/GLOBESECURE.CA` ; branche principale : `main`. Le site actuel **https://globesecure.ca** est la source commerciale de vérité et ne doit pas être remplacé sans sauvegarde.

## Disponible dans le code (non vérifié en production)

- Site vitrine GlobeSecure, contenu du site existant, six services et médias.
- Identité TAKATAK via OIDC/PKCE, autorisations de produits par rôle, séparation stricte `tenant_id`; raccordement réel non prouvé.
- Agent : START/STOP, consentement explicite GPS, incidents, affectations, historique de pointage et consultation des statuts d'approbation.
- Supervision : sites actifs, affectations, modifications/annulations avec historique, rapports clients publiés, heures et décisions auditées, export CSV.
- Client TAKATAK : demandes de service individuelles, traitement supervision `submitted → acknowledged → closed`, quota 10/24 h et politiques de confidentialité en défaut fermées.
- **Nouveau : rondes** par code secret aléatoire sur site actif, quart actif et affectation valide; un passage par point et quart. Supervision des points et passages; lecture QR possible sur navigateurs prenant en charge `BarcodeDetector`, saisie manuelle disponible.
- PostgreSQL migrations 001–010 et exécuteur vérifiant les empreintes SHA-256, gardes environnement/sauvegarde et idempotence.

## Contrôles réellement observés

CI `38791376787` sur `82f2fd1b1a33acda89bb5332e8c3fc525e7a0faf` : **succès**, incluant migration 010, code de ronde, test PostgreSQL multi-tenant, compilation Next.js et smoke HTTP. Dernier commit technique de la session : `2b60b6782921c181a6715e986b17bb79b156b847`; ses contrôles complémentaires et ceux du commit documentaire doivent être consultés séparément dans `https://github.com/takatakca/GLOBESECURE.CA/actions`.

**Staging : ignoré/non activé. Production du nouveau code : non vérifiée et non modifiée.** Aucune preuve de fonctionnement réel PostgreSQL/OIDC/Resend sur MochaHost.

## Limites critiques restantes

1. Sauvegarder et comparer l'installation MochaHost actuelle; configurer staging isolé, Node/TLS, secrets et base réelle.
2. Vérifier TAKATAK Auth OIDC, permissions par client, consentement, protection des données et politiques de conservation.
3. Les codes de rondes statiques peuvent être transférés/copiés : ils ne constituent pas une preuve de présence physique; pas de générateur d'étiquettes QR/NFC embarqué ni de vérification anti-rejeu entre quarts.
4. Mandats commerciaux/contrats, paie, validations réglementaires, recrutement avec CV, notifications, audits et tests appareils à compléter.

**Critère de fin :** compilation verte seule ≠ 100 %. Les services tiers, données réelles, sécurité et déploiement doivent être validés.
