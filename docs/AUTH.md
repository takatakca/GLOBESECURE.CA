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
