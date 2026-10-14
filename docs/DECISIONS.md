# Décisions confirmées — GlobeSecure

- **2026-10-14 — Source de contenu.** Le site public `https://globesecure.ca` contient les informations officielles à transférer dans le dépôt. Ne pas puiser dans des entreprises homonymes. Les mentions de licences, assurances et délais sont des déclarations du site d'origine, pas des certifications indépendamment vérifiées.
- **2026-10-14 — Branche de publication.** `takatakca/GLOBESECURE.CA`, branche `main`, publication directe autorisée avec vérification du SHA ; pas de force-push.
- **2026-10-14 — Production protégée.** L'ancienne application Node/Next sur MochaHost peut contenir du code différent. Ne rien effacer ni remplacer avant sauvegarde, inventaire des dépendances, vérification des domaines et retour arrière.
- **2026-10-14 — Architecture.** GlobeSecure demeure une application indépendante. TAKATAK Auth gère l'identité centrale ; accès par entitlement explicite, rôle et tenant. Aucun client ne consulte ceux des autres.
- **2026-10-14 — Géolocalisation.** Consentement explicite ; capture seulement pendant un quart actif ; STOP ou retrait du consentement bloque la remontée côté serveur. Durées de conservation et information légale à valider avant activation réelle.
- **2026-10-14 — Publication.** Compilation hors de MochaHost ; déploiement staging isolé et conditionné par variables GitHub. Aucune mise en production affirmée en l'absence de preuve.
- **2026-10-14 — Vérification.** Tests unitaires + production build + smoke HTTP CI requis. Tests de données réelles et sécurité avant bascule.

- **2026-10-14 — Intégrité des sources.** La capture originale retrouvée sert de base de test ; une page anti-bot ou tronquée ne doit jamais remplacer le contenu archivé.
- **2026-10-14 — Livraison vérifiable.** Le SHA compilé figure dans `/api/health.release` ; `package-lock.json`/ `npm ci` sont obligatoires pour reconstruire le même arbre de dépendances.
- **2026-10-14 — Collecte de renseignements.** Soumissions et candidatures doivent rester fermées sauf si `PRIVACY_POLICY_APPROVED=true` et une messagerie destinataire réelle sont configurés. Aucune collecte de CV par ce formulaire initial ; contenu carrière limité au message d'intérêt.
- **2026-10-14 — En-têtes réseau.** Ne faire confiance aux en-têtes IP de proxy qu'après configuration explicite d'un proxy contrôlé, sinon limiter globalement les demandes par instance.
