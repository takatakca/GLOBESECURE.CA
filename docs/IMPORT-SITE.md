# Importation depuis https://globesecure.ca

Le site en ligne est la **référence officielle**. Pour recopier ses contenus publics et neuf images du site (logo, hero et six services), utiliser `.github/workflows/site-assets.yml` ou les commandes suivantes en environnement Node 22 disposant d'accès réseau :

```sh
node scripts/inventory-site.mjs
node scripts/sync-public-assets.mjs
```

Le workflow automatique dépose `content/live-site/inventory.json` (textes publics et liens) et les images `public/original-site/*.jpeg` puis publie un commit sur `main`. Il ne récupère aucune zone privée ni formulaire soumis, refuse les domaines tiers et les réponses images qui ne sont pas de vrais JPEG. Ne pas mélanger ces contenus à ceux de marques homonymes.

**Important :** les mentions commerciales du site (25+ années d'expérience combinée, licences, disponibilité 24/7, délais d'intervention) sont conservées comme assertions affichées sur l'ancien site, pas comme justificatifs officiels vérifiés. Avant la bascule, confirmer les coordonnées, les permis, la politique légale et la disponibilité réelle.

Le domaine actif n'est jamais modifié par ce workflow; il ne fait que copier des fichiers publics vers GitHub. Les fonctionnalités d'application Next.js ne sont pas déployées par ce mécanisme.

## Protection contre les pages anti-bot

Une nouvelle tentative a reçu une page Cloudflare « One moment, please... » plutôt que le contenu de l'agence. Pour protéger les contenus d'origine déjà importés, le script vérifie désormais le titre du vrai site et ses services attendus; il **échoue sans remplacer la copie valide** si le site renvoie une protection ou une page non conforme. Les workflows d'import sont donc déclenchés **manuellement** uniquement, pour éviter des requêtes répétées inutiles. Les fichiers importés avec succès auparavant restent dans GitHub.
