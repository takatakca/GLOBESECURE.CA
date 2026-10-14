# GlobeSecure.ca : source officielle de contenu

Décision du propriétaire (14 octobre 2026) : **https://globesecure.ca est le site actif, contenant les renseignements à porter dans le dépôt**. Les textes, pages, services, images, coordonnées et parcours visibles du site actuel priment sur les textes génériques insérés dans cette première base Next.js.

Priorité de reprise : 1) inventorier les pages du vrai site ; 2) sauvegarder et vérifier son code actuel sur MochaHost ; 3) migrer fidèlement sections, textes, services, marque, médias et coordonnées ; 4) conserver les fonctions agent/client/TAKATAK Auth actuellement développées ; 5) vérifier parité et lancer staging, sans écraser la production actuelle.

Un workflow `.github/workflows/site-inventory.yml` utilise `scripts/inventory-site.mjs` pour consulter uniquement des pages **publiques** de `globesecure.ca` et `www.globesecure.ca`. Il extrait titres, descriptions, texte, en-têtes, liens internes, références de médias, et produit `audit/live-site/inventory.json` comme artefact GitHub Actions conservé 7 jours. Aucun fichier du site réel n'est modifié, et aucune information n'est automatiquement publiée dans le dépôt.

En cas d'échec DNS/TLS/antibot : consulter les journaux Actions, puis exporter une sauvegarde depuis MochaHost cPanel pour migrer le contenu original. Les autres entreprises aux noms ressemblants ne sont **pas** des sources valides pour GlobeSecure.ca. Ne pas inventer les coordonnées, permis, années de fondation, effectifs, identités, avis ou certifications. Ne pas ajouter de secrets ni de données privées au dépôt public.

**État de la migration** : l'inventaire et la récupération du code MochaHost doivent être achevés avant de déclarer le contenu migré ou le nouveau site prêt à remplacer la production.
