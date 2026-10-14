# GlobeSecure — état technique vérifié

Date : **14 octobre 2026**. Dépôt `takatakca/GLOBESECURE.CA` ; branche `main`. Le site déjà en ligne sur https://globesecure.ca reste la source officielle du contenu. Ne pas confondre GitHub (nouveau code) avec la production actuelle.

## Livré dans GitHub

- Site vitrine Next.js responsive, six services, mission, valeurs, recrutement, contact, pages légales et médias du site officiel.
- Texte long du site capturé en octobre 2026 restauré dans `content/live-site/inventory.json` ; contrôle de présence des six services et neuf images.
- TAKATAK Auth OIDC/PKCE, sessions signées et droits par tenant ; raccordement réel non vérifié.
- Espace agent START/STOP et localisation avec consentement, révocation côté serveur, incidents et audit.
- Supervision tenant-scopée et rapports publiés manuellement aux clients autorisés.
- Demandes de soumission et prise de contact recrutement via Resend, **désactivées par défaut** sans configuration et validation de la politique de confidentialité.
- Limitation de taille des corps JSON sur les API mutatives ; limitation des demandes publiques indépendante des en-têtes IP non fiables.
- Lockfile npm généré sur GitHub ; CI/staging utilisent `npm ci`. Endpoint `/api/health` expose le SHA compilé pour preuve de version.
- Documentation de relève et workflows CI/CD.

## Vérifications

- Commits avec succès CI constatés dans cette session : `bfa74769` (docs), `103762d6` (source), `b6c3eed5` (tests), `e2f596cd` (identité du build), `f0302d59` (limites JSON), `57e5523f` (npm ci), `690d66d9` (carrières), `984544f8` (limitation des demandes publiques).
- Les nouvelles exécutions peuvent être en attente lors de l'édition ; vérifier `https://github.com/takatakca/GLOBESECURE.CA/actions` et le SHA actuel avant de conclure.
- Aucun staging/prod du nouveau code n'a été constaté. Les workflows de staging précédents ont été ignorés faute d'activation.

## Bloquants d'exploitation

1. Sauvegarder/comparer le code de l'ancienne app MochaHost avant remplacement.
2. Configuration MochaHost staging : chemin Node, SSH, restart, proxy TLS, santé, secrets GitHub.
3. Connexion réelle à TAKATAK Auth, PostgreSQL migré, Resend et tests d'intégration.
4. Approbation juridique : responsable vie privée, coordonnées vérifiées, politiques de rétention, consentement de localisation.
5. Fonctionnalités métiers toujours à terminer : affectations, horaires, rondes, vérification du personnel, gestion complète des mandats, paie et CV sécurisé.

**Conclusion : code enrichi, pas 100 %, pas de déploiement de production prouvé.**
