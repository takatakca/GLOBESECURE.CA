# GlobeSecure.ca

Site vitrine et fondation de la plateforme GlobeSecure, agence canadienne de sécurité privée. Le dépôt GitHub initial du 14 octobre 2026 ne contenait que son titre : il ne contient **pas** le code historique éventuellement présent sur MochaHost. Ne pas substituer cette base à un déploiement existant sans sauvegarde, inventaire et validation de la correspondance des sources.

## Périmètre livré dans cette base

- Site vitrine français et responsive : événements, santé, entreprises, chantiers.
- Soumission validée côté client et serveur ; envoi via Resend uniquement si les variables sont configurées.
- Pages confidentialité, portails (état réel), sitemap, robots, endpoint de santé.
- Tests unitaires de validation, CI GitHub Actions, construction Next.js standalone hors de l'hébergement.
- **Pas encore livrés** : TAKATAK Auth / OIDC, portails authentifiés, pointage et géolocalisation des quarts, rapports d'incident, base Postgres, configuration des destinataires et déploiement sur MochaHost.

## Développement

Node.js 22 et npm requis.

    npm install
    cp .env.example .env.local
    npm run dev

    npm run test
    npm run build

Ouvrir http://localhost:3000 et http://localhost:3000/api/health.

## Hébergement

Ancienne cible identifiée : `/home/bolonca/apps/globesecure` sur MochaHost. Vérifier la racine réelle de l'application cPanel et l'état de la production avant toute copie. Voir [Déploiement](docs/DEPLOYMENT.md) et [Feuille de route](docs/ROADMAP.md).

## Sécurité

Ne jamais ajouter de clés, mots de passe ni informations de clients dans Git. Le site public ne prétend pas offrir de connexion agent, de suivi en direct ou de certification non vérifiée. Le formulaire échoue de manière explicite si la livraison email n'est pas configurée.
