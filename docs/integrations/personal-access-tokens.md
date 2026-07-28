# Personal Access Tokens (Accès API)

Les **Personal Access Tokens** (`dt_...`) permettent à des clients externes d'accéder à l'API DevToolbox sans session navigateur : extension Raycast, agent Hermes, scripts curl, automatisations, etc.

## Créer un token

1. Connectez-vous à DevToolbox
2. **Mon compte** → onglet **Accès API**
3. Donnez un nom explicite (`Raycast Mac`, `Hermes Agent`, `Script backup`…)
4. Choisissez une **expiration** optionnelle
5. Cochez les **périmètres d'accès** (scopes) nécessaires
6. **Créer le token** → copiez le `dt_...` immédiatement (affiché une seule fois)

## Authentification

Toutes les requêtes API protégées utilisent :

```http
Authorization: Bearer dt_votre_token
Content-Type: application/json
```

L'URL de base est celle de votre instance avec `/api`, par exemple :

- Production : `https://devtoolbox.creactiveweb.com/api`
- Local : `http://localhost:1400/api` (backend direct) ou `http://localhost:14001/api` (via nginx frontend)

## Scopes disponibles

| Scope | Routes API | Usage typique |
|-------|------------|---------------|
| `licences` | `/api/licences` | Gérer les clés de licence |
| `tasks` | `/api/tasks` | Task Reminder (créer, lister, modifier) |
| `knowledge_base` | `/api/kb` | Rechercher et gérer les notes KB |
| `domains` | `/api/domains` | Domain Hub (comparateur, portefeuille) |

Un token peut combiner plusieurs scopes. Appliquez le **principe du moindre privilège** : ne cochez que ce dont le client a besoin.

## Création via l'API (optionnel)

```bash
# 1. Obtenir un JWT de session
curl -s -X POST https://devtoolbox.creactiveweb.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"vous@example.com","password":"VOTRE_MOT_DE_PASSE"}'

# 2. Créer un PAT
curl -s -X POST https://devtoolbox.creactiveweb.com/api/auth/personal-tokens \
  -H 'Authorization: Bearer VOTRE_JWT' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Hermes Agent","scopes":["tasks"]}'
```

Réponse `201` :

```json
{
  "token": "dt_...",
  "personalAccessToken": {
    "id": "...",
    "name": "Hermes Agent",
    "scope": ["tasks"],
    "expiresAt": null,
    "revokedAt": null,
    "createdAt": "..."
  }
}
```

## Révoquer et supprimer

| Action | Endpoint | Effet |
|--------|----------|-------|
| **Révoquer** | `DELETE /api/auth/personal-tokens/:id` | Invalide le token (soft delete). Les clients perdent l'accès immédiatement. |
| **Supprimer** | `DELETE /api/auth/personal-tokens/:id/permanent` | Retire un token **déjà révoqué** de la liste. Uniquement via JWT de session. |

Depuis l'interface : **Mon compte → Accès API** → bouton **Révoquer** (token actif) ou **Supprimer** (token révoqué).

Lister les tokens (JWT requis) :

```bash
curl -s https://devtoolbox.creactiveweb.com/api/auth/personal-tokens \
  -H 'Authorization: Bearer VOTRE_JWT'
```

## Exemple : créer une tâche

```bash
curl -s -X POST https://devtoolbox.creactiveweb.com/api/tasks \
  -H 'Authorization: Bearer dt_VOTRE_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"title":"Relancer le client","dueDate":"2026-08-15","priority":"high"}'
```

## Intégrations documentées

- [Extension Raycast](../../raycast/README.md)
- [Agent Hermes](../../hermes/README.md)

## Sécurité

- Ne commitez jamais un token `dt_...`
- Révoquez immédiatement en cas de fuite
- Préférez une expiration pour les tokens temporaires
- Le hash est stocké côté serveur ; le token brut n'est jamais réaffiché
