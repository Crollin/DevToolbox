# Skill — DevToolbox Task Reminder (production)

Tu peux gérer les tâches de l’utilisateur dans **DevToolbox Task Reminder** via l’API REST. Utilise ce skill quand l’utilisateur demande d’ajouter, lister, modifier ou clôturer une tâche, un rappel ou un suivi client.

## Configuration (production)

| Paramètre | Valeur |
|-----------|--------|
| Base URL API | `https://devtoolbox.creactiveweb.com/api` |
| Authentification | `Authorization: Bearer <DEVTOOLBOX_PAT>` |
| Token | Personal Access Token `dt_...` avec scope **`tasks`** |
| Content-Type | `application/json` sur POST, PUT, PATCH |

Le token est fourni via la variable d’environnement `DEVTOOLBOX_PAT` (ou équivalent dans la config Hermes). Il se crée dans **Mon compte → Accès API** (scope `tasks`). Ne jamais inventer ni afficher le token en clair dans les réponses.

## Règles générales

1. **Toujours** envoyer `Authorization: Bearer dt_...` sur chaque requête.
2. **Création** : `title` et `dueDate` sont **obligatoires**.
3. **Format date** : `dueDate` en `YYYY-MM-DD` (ex. `2026-08-15`). Pour `reminderDatetime`, ISO 8601 (ex. `2026-08-15T09:00:00.000Z`).
4. **Statuts** : `pending` | `in_progress` | `completed`.
5. **Priorités** : `low` | `normal` | `high` | `urgent` (défaut : `normal`).
6. **Canaux de notification** : `ntfy` | `email` | `telegram` (tableau optionnel).
7. **Tags** : tableau de chaînes, max 20, dédupliqués côté serveur.
8. En cas de doute sur la date d’échéance, demander confirmation à l’utilisateur avant de créer.
9. Après création ou modification, confirmer à l’utilisateur : titre, échéance, statut, client éventuel.
10. Ne pas appeler les routes licences / KB / domains : le token Hermes n’a que le scope `tasks`.

## Endpoints

### Lister les tâches

```
GET /tasks
GET /tasks?status=pending
GET /tasks?status=in_progress
GET /tasks?status=completed
GET /tasks?client=Nom%20Client
```

Réponse : `{ "tasks": [ ... ] }`

### Détail d’une tâche

```
GET /tasks/{id}
```

Réponse : `{ "task": { ... } }`

### Créer une tâche

```
POST /tasks
```

Body minimal :

```json
{
  "title": "Relancer le devis",
  "dueDate": "2026-08-20"
}
```

Body complet (exemple) :

```json
{
  "title": "Relancer le devis",
  "description": "Suite réunion du 28/07 — attendre retour client",
  "dueDate": "2026-08-20",
  "client": "Bois des Ours",
  "link": "https://example.com/ticket/123",
  "tags": ["hermes", "devis"],
  "priority": "high",
  "notificationChannels": ["email"],
  "reminderDays": [1, 3],
  "reminderDatetime": "2026-08-19T08:00:00.000Z"
}
```

Réponse `201` : `{ "task": { "id": "...", ... } }` — le statut initial est toujours `pending`.

### Modifier une tâche

```
PUT /tasks/{id}
```

Même champs que la création (`title` et `dueDate` requis).

### Changer uniquement le statut

```
PATCH /tasks/{id}/status
```

Body :

```json
{ "status": "completed" }
```

### Supprimer une tâche

```
DELETE /tasks/{id}
```

Réponse : `{ "message": "Tâche supprimée avec succès" }`

### Clients prédéfinis

```
GET /tasks/clients/list
POST /tasks/clients
```

Body création client : `{ "name": "Nom du client" }`

Utiliser `GET /tasks/clients/list` avant de créer une tâche si l’utilisateur mentionne un client : réutiliser un nom existant pour rester cohérent.

## Modèle de tâche (réponse API)

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string?",
  "dueDate": "YYYY-MM-DD",
  "client": "string?",
  "link": "string?",
  "tags": ["string"],
  "priority": "low|normal|high|urgent",
  "notificationChannels": ["ntfy"|"email"|"telegram"],
  "status": "pending|in_progress|completed",
  "reminderDays": [1, 3, 7],
  "reminderDatetime": "ISO8601?",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

## Erreurs courantes

| HTTP | Message | Action |
|------|---------|--------|
| 401 | Token manquant / invalide | Vérifier `DEVTOOLBOX_PAT` |
| 400 | Titre et date requis | Ajouter `title` + `dueDate` |
| 400 | Statut invalide | Utiliser pending / in_progress / completed |
| 404 | Tâche non trouvée | Vérifier l’`id` ou relister |
| 409 | Client déjà existant | Réutiliser le client existant |

## Exemples de requêtes (curl)

```bash
# Lister les tâches en attente
curl -s "https://devtoolbox.creactiveweb.com/api/tasks?status=pending" \
  -H "Authorization: Bearer $DEVTOOLBOX_PAT"

# Créer une tâche
curl -s -X POST "https://devtoolbox.creactiveweb.com/api/tasks" \
  -H "Authorization: Bearer $DEVTOOLBOX_PAT" \
  -H "Content-Type: application/json" \
  -d '{"title":"Publier la mise à jour","dueDate":"2026-08-01","priority":"normal","tags":["hermes"]}'

# Marquer comme terminée
curl -s -X PATCH "https://devtoolbox.creactiveweb.com/api/tasks/TASK_ID/status" \
  -H "Authorization: Bearer $DEVTOOLBOX_PAT" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

## Comportement attendu de l’agent

- **« Ajoute une tâche… »** → `POST /tasks` avec titre, date (demander si absente), contexte en `description`.
- **« Qu’est-ce qui est en retard / à faire ? »** → `GET /tasks?status=pending` (filtrer côté agent si `dueDate` < aujourd’hui).
- **« C’est fait »** → `PATCH /tasks/{id}/status` avec `completed` (identifier la tâche par titre ou id).
- **« Déplace au vendredi »** → `PUT /tasks/{id}` avec nouvelle `dueDate`.
- Toujours résumer l’action effectuée en français, sans exposer le token.
