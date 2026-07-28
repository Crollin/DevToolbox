# DevToolbox — intégration Hermes Agent (Task Reminder)

Permet à un agent IA (Hermes) de créer, lire et mettre à jour des tâches dans **Task Reminder** via l’API DevToolbox en production.

Guide des tokens : [Personal Access Tokens (Accès API)](../docs/integrations/personal-access-tokens.md)

## Prérequis

- Instance DevToolbox en production joignable en HTTPS
- Compte utilisateur DevToolbox
- Hermes Agent configuré pour exécuter des requêtes HTTP (outil `fetch` / `curl` / MCP HTTP)

## 1. Créer le token (production)

1. Ouvrir **https://devtoolbox.creactiveweb.com**
2. **Mon compte** → onglet **Accès API**
3. Nom : `Hermes Agent`
4. Scopes : cocher **Tâches** uniquement (scope `tasks`)
5. **Créer le token** → copier le `dt_...` immédiatement (affiché une seule fois)

## 2. Configurer Hermes

Variables d’environnement recommandées :

| Variable | Valeur (prod) |
|----------|----------------|
| `DEVTOOLBOX_API_URL` | `https://devtoolbox.creactiveweb.com/api` |
| `DEVTOOLBOX_PAT` | `dt_...` (votre token) |

Voir [`.env.example`](.env.example).

## 3. Charger le skill

Importer le fichier [`SKILL.md`](SKILL.md) dans la configuration de votre agent Hermes (system prompt, skill ou règle projet).

Le skill décrit les endpoints, le format JSON et les règles à respecter pour Task Reminder.

## Test rapide

```bash
curl -s https://devtoolbox.creactiveweb.com/api/tasks \
  -H "Authorization: Bearer dt_VOTRE_TOKEN"
```

Création :

```bash
curl -s -X POST https://devtoolbox.creactiveweb.com/api/tasks \
  -H "Authorization: Bearer dt_VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Hermes","dueDate":"2026-08-01","tags":["hermes"]}'
```

## Révoquer l’accès

**Mon compte → Accès API** → révoquer le token `Hermes Agent`, puis en créer un nouveau si besoin.

## Dépannage

| Problème | Cause probable |
|----------|----------------|
| `401 Token personnel invalide` | Token révoqué, expiré ou mauvaise valeur |
| `401 Token d'authentification manquant` | Header `Authorization: Bearer dt_...` absent |
| `400 Titre et date d'accomplissement sont requis` | `title` ou `dueDate` manquant dans le body |
| Erreur réseau | URL incorrecte ou instance hors ligne |
