# Déploiement GlobeSecure / MochaHost

La génération Next.js se fait sur un runner GitHub Actions (Node 22), **jamais sur le terminal cPanel**. L'application utilise `output: "standalone"`.

## Protection de la production existante

Le nouveau dépôt ne reflète pas nécessairement le contenu déployé. Une cible historique a été identifiée sur MochaHost : `/home/bolonca/apps/globesecure`. Un ancien incident indiquait que la racine documentaire du domaine pouvait être `/home/bolonca/globesecure.ca`. Ne pas écraser l'une ou l'autre avant :
1. sauvegarde complète de l'application actuelle et de sa configuration (hors Git) ;
2. relevé des versions, pages, fonctions, dépendances et schéma DB en place ;
3. validation du mappage Node/cPanel, nom de script startup et des domaines ;
4. validation de la stratégie de bascule et de retour arrière.

## Variables de site

Copier `.env.example` vers `.env.local` pour le développement. En environnement serveur, injecter :

- `NEXT_PUBLIC_SITE_URL=https://globesecure.ca`
- `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` (domaine expéditeur vérifié)

En l'absence de ces dernières variables, l'API contact renvoie HTTP 503, sans perte silencieuse de demandes.

## CI et publication

`.github/workflows/ci.yml` exécute les tests et la compilation sur chaque push/PR. Elle n'a **pas** d'étape de transfert de fichiers vers MochaHost : la présence du précédent site exige un inventaire et une reprise de code avant d'activer le CD. Pour publier un build en respectant cPanel :

- Générer `.next/standalone` sur GitHub Actions ;
- copier `.next/static` vers `.next/standalone/.next/static` et `public` vers le standalone ;
- transférer les artefacts vers une **nouvelle** racine de staging isolée via SSH/SFTP ;
- démarrer le `server.js` standalone avec Node 22, `PORT` adapté au service Node cPanel et les variables secrètes côté hébergeur ;
- vérifier `/api/health`, les pages, la réception du formulaire, les logs et le certificat TLS ;
- activer la bascule de production seulement ensuite.

**État actuel : pas de déploiement de production affirmé ni déclenché.**
