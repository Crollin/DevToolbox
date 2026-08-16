# Domain Hub — clés API par utilisateur

Date : 2026-08-16  
Statut : draft (en attente validation)

## Problème

Domain Hub lit aujourd’hui les tokens registrar uniquement via l’environnement instance (`CLOUDFLARE_*`, `HOSTINGER_*`, `OVH_*`). Quand le flag `DOMAIN_HUB_ENABLED` est actif, l’utilisateur ne peut pas saisir ses propres clés depuis l’UI. Sur une instance multi-comptes, les clés Coolify sont partagées et opaques.

## Objectifs

- Permettre à chaque utilisateur authentifié de stocker ses clés registrar depuis `/account`.
- Afficher un message d’incitation dans Domain Hub et dans `/account` si les clés manquent.
- N’utiliser **aucune** clé d’environnement pour les appels registrar (pas de fallback silencieux).
- Ne montrer l’UI et les routes credentials que si `domainHubEnabled` est vrai.

## Non-objectifs (V1)

- Chiffrement applicatif (AES) des secrets en base.
- Boutons « tester la connexion » par registrar.
- Édition ou suppression des variables Coolify.
- Clés au niveau instance partagée (modèle SMTP).

## Décisions

| Sujet | Choix |
|--------|--------|
| Portée des clés | Par utilisateur |
| Fallback env | Aucun ; message d’incitation |
| Emplacement UI | Onglet `/account` + bannière Domain Hub |
| Stockage | Table dédiée `domain_hub_credentials` |
| Pattern API | Comme SMTP : GET masqué (`***`), PUT upsert |

## Schéma

Table `domain_hub_credentials` :

| Colonne | Type | Notes |
|---------|------|--------|
| `user_id` | TEXT PK / FK → users | Une ligne par user |
| `cloudflare_api_token` | TEXT NULL | |
| `cloudflare_account_id` | TEXT NULL | |
| `hostinger_api_token` | TEXT NULL | |
| `ovh_app_key` | TEXT NULL | |
| `ovh_app_secret` | TEXT NULL | |
| `ovh_consumer_key` | TEXT NULL | |
| `ovh_subsidiary` | TEXT NULL | Défaut logique `FR` si OVH partiellement rempli |
| `updated_at` | TEXT | ISO |

Migration SQLite au démarrage (même pattern que les autres tables).

## API

Préfixe : `/api/account/domain-hub-credentials`  
Auth : JWT (ou token session account) — **pas** PAT pour l’édition du compte (aligné sur les autres routes `/api/account`).  
Si `DOMAIN_HUB_ENABLED` est faux → `404` (ou `403` avec message clair).

### GET

Réponse (exemple) :

```json
{
  "cloudflareApiToken": "***",
  "cloudflareAccountId": "abc…",
  "hostingerApiToken": "",
  "ovhAppKey": "",
  "ovhAppSecret": "",
  "ovhConsumerKey": "",
  "ovhSubsidiary": "FR",
  "configured": {
    "cloudflare": true,
    "hostinger": false,
    "ovh": false
  }
}
```

Règles de masquage :

- Secrets (tokens, secrets, keys) : `***` s’ils sont non vides, sinon `""`.
- `cloudflareAccountId` et `ovhSubsidiary` peuvent être renvoyés en clair (non secrets).

### PUT

Body camelCase, champs optionnels. Sémantique :

- Valeur `***` ou absente pour un secret déjà stocké → conserver.
- Chaîne vide → effacer le champ.
- Nouvelle valeur → remplacer.

Réponse : même forme que GET après sauvegarde.

## Backend — usage runtime

Extraire un helper `getDomainHubCredentials(userId)` qui retourne les credentials DB (ou null / objet vide).

Adapter :

- `backend/src/lib/registrars/cloudflare.ts`
- `backend/src/lib/registrars/hostinger.ts`
- `backend/src/lib/registrars/ovh.ts`
- `backend/src/routes/domains.ts` (sync Hostinger)

pour accepter les credentials du user (paramètre explicite), au lieu de `process.env.*`.

`compareDomains` et les routes `/api/domains/*` chargent les clés via `req.user.id` avant d’appeler les registrars.

Si un registrar est demandé mais non configuré pour le user → `skippedOffer(..., 'non configuré')` (comportement déjà proche).

Les variables d’env registrar restent dans `env.ts` comme optionnelles pour compat docs / local, mais **ne sont plus lues** par le code Domain Hub en V1.

## Frontend

### `/account`

- Onglet **Domain Hub** visible seulement si `domainHubEnabled`.
- Trois sections (Cloudflare, Hostinger, OVH) avec champs + aide courte (liens docs registrar si utiles).
- Bouton Enregistrer → `PUT`.
- Si `configured` tous faux : texte d’incitation en tête d’onglet.

### Domain Hub tool

- Si flag on et `configured` tous faux (GET credentials ou endpoint léger) : bannière avec CTA vers `/account` (onglet Domain Hub, ex. `?tab=domain-hub`).
- Si partiel : pas de bannière bloquante ; le comparateur continue d’afficher les messages « non configuré » par registrar.

## Sécurité

- Ne jamais logger les valeurs de secrets.
- Ne jamais renvoyer les secrets en clair après écriture.
- Autoriser uniquement le propriétaire de la ligne (`user_id = req.user.id`).
- Routes derrière `authenticateToken` (session compte).

## Tests

- Migration + GET/PUT credentials (masquage, conserve `***`, efface `""`).
- Compare / sync Hostinger utilisent les clés user, pas l’env (mock fetch).
- Routes credentials refusées quand Domain Hub désactivé.
- UI : onglet absent si flag off (test unitaire léger si existant, sinon manuel).

## Critères de succès

1. Avec Domain Hub on et sans clés user : bannière Domain Hub + onglet Account avec message.
2. Après saisie Cloudflare (token + account id) : compare Cloudflare fonctionne pour ce user.
3. Un second user ne voit / n’utilise pas les clés du premier.
4. Retirer les tokens Coolify n’empêche plus un user correctement configuré d’utiliser Domain Hub.
