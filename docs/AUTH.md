# TAKATAK Auth — contrat d'identité GlobeSecure

## Configuration

Le fournisseur central TAKATAK doit exposer une découverte OpenID Connect HTTPS et un flux **authorization code + PKCE (S256)**. GlobeSecure ne possède pas de mot de passe indépendant ni de registre maître d'identités.

Variables serveur :

- `TAKATAK_OIDC_ISSUER` : URL d'émetteur exacte, sans barre finale
- `TAKATAK_OIDC_CLIENT_ID` : identifiant du client OIDC GlobeSecure
- `TAKATAK_OIDC_CLIENT_SECRET` : uniquement si ce client est confidentiel
- `SESSION_SECRET` : valeur aléatoire de 32 caractères ou plus, privée au serveur
- `NEXT_PUBLIC_SITE_URL` : URL HTTPS officielle, identique à celle enregistrée chez l'émetteur
- `DATABASE_URL` : connexion PostgreSQL avec compte applicatif à droits minimaux

Enregistrer la redirection OIDC **exacte** : `https://globesecure.ca/api/auth/callback` (ou l'URL du site de staging).

## Claims exigés dans le jeton ID signé

```json
{
  "sub": "takatak-user-id",
  "aud": "client-id-globesecure",
  "iss": "https://auth.example.ca",
  "nonce": "nonce-oidc",
  "entitlements": ["globesecure_access"],
  "https://takatak.ca/tenant_id": "organisation_123",
  "https://takatak.ca/roles": ["globesecure_agent"]
}
```

L'issuer réel et l'audience doivent être configurés, non copiés de cet exemple. Rôles acceptés : `globesecure_agent`, `globesecure_client`, `globesecure_supervisor`, `globesecure_admin`. Tout jeton sans entitlement, rôle explicite ou tenant valide est refusé. Les permissions ne sont jamais prises dans une requête client.

Les sessions locales sont signées, HttpOnly, SameSite=Lax et durent six heures. Une modification urgente de droits nécessite une invalidation/rotation de secret ou un contrôle de révocation central à implémenter avant une exploitation sensible. L'agent ne peut consulter les données ni pointer pour un autre tenant.

## Quart et localisation

1. Appliquer `db/migrations/001_init.sql`, `002_incidents.sql`, `003_tracking_consent.sql` dans cet ordre.
2. Se connecter avec un jeton TAKATAK autorisé.
3. Autoriser volontairement la localisation du navigateur et cocher le consentement avant START.
4. Le backend crée un seul quart actif par agent et tenant ; il enregistre l'accord horodaté.
5. Les positions périodiques sont acceptées **uniquement** lorsqu'un quart consenti est actif ; intervalle serveur minimum 45 secondes.
6. Le retrait du consentement est journalisé et empêche d'autres positions côté serveur. STOP arrête le quart même si la géolocalisation n'est plus disponible.
7. La page doit rester ouverte pour transmettre les positions ; ce mécanisme ne fournit pas de suivi en arrière-plan.

Le superviseur ne voit que les quarts et incidents de son propre `tenant_id`. La consultation client, l'export paie, les corrections horaires et l'historique cartographique nécessitent encore des contrôles additionnels.

## Avant activation en production

- Convenir de la politique réelle de rétention des positions avec la direction et la personne responsable de la protection des renseignements.
- Vérifier information, nécessité, proportionnalité, consentement approprié et obligations locales applicables.
- Programmer la purge, auditer les requêtes par rôle, prévoir sauvegarde chiffrée, rotation et révocation des secrets.
- Faire des tests d'intégration avec un fournisseur OIDC réel, PostgreSQL et appareils réels.

## Purge des positions après approbation

Aucune purge n'est activée automatiquement. Une fois la durée de conservation approuvée, exécuter dans un cron **serveur** quotidien :

```sh
GLOBESECURE_PRUNE_ENABLED=true GLOBESECURE_POSITION_RETENTION_DAYS=30 npm run db:prune
```

Adapter les 30 jours à la politique validée. Le script refuse les valeurs manquantes et traite au plus 100 000 positions par exécution. Les journaux d'audit et feuilles de temps sont conservés séparément suivant la politique applicable.

## Inscription des agents et affectations (2026-10-15)

- Appliquer également `db/migrations/004_client_reports.sql` et `005_assignments.sql` après 001–003.
- Les agents ayant le rôle TAKATAK `globesecure_agent` s'inscrivent volontairement à `/api/agent/roster` depuis leur propre session. Le serveur dérive les champs `tenant_id` et `agent_sub` du JWT signé, jamais du client.
- Les superviseurs `globesecure_supervisor` voient seulement les agents inscrits de leur tenant et créent/annulent des affectations planifiées. L'API valide la plage (max. 16 heures, 120 jours), les chevauchements et l'appartenance du sujet.
- L'agent ne voit que ses propres horaires et ses pointages terminés. Le superviseur peut consulter et exporter les pointages du tenant pendant une plage d'au plus 93 jours UTC. Aucune validation de paie n'est sous-entendue.
- Les nouveaux endpoints sont refusés sans session ou rôle exact ; les tests PostgreSQL isolés ne remplacent pas la revue de révocation des droits TAKATAK en production.

## Approbation des heures par superviseur

Après migration `006_shift_approvals.sql`, l'API d'approbation exige `globesecure_supervisor`, l'origine du site, un ID de quart valide et l'existence d'un quart terminé au sein du même tenant. Les actions `approve` et `revoke` sont journalisées séparément. Un agent consulte uniquement le statut de ses propres heures. Le CSV conserve le statut pour éviter de confondre pointages bruts et périodes approuvées.

## Sites opérationnels (migration 007)

L'API `/api/supervision/sites` exige le rôle exact `globesecure_supervisor`. Le tenant est dérivé de la session et ne peut pas être fourni par le navigateur. La création, activation ou désactivation des sites est auditée. Les agents voient le libellé de leurs propres affectations, et non l'annuaire complet des sites. Les sites sont des objets opérationnels locaux; ils ne créent ni compte utilisateur ni entreprise dans TAKATAK.


## Réaffectation et historique des changements

Après migration `008_assignment_changes.sql`, seule une session `globesecure_supervisor` peut modifier un quart futur via `/api/supervision/assignments/reschedule`. Le serveur vérifie le tenant du quart, l'appartenance de l'agent, le site actif, les conflits et l'origine de la requête. La lecture du journal `/api/supervision/assignments/history` exige le même rôle et le tenant exact; elle n'expose pas le journal aux clients ou agents. Les modifications sont historisées avant le commit transactionnel.
