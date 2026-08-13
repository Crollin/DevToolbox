# DevToolbox — MCP Task Reminder (local)

Serveur **MCP stdio local** pour que Claude Desktop, Claude Code ou Cursor gèrent **Task Reminder** sans appeler `curl` depuis un sandbox (contourne `host_not_allowed`).

```text
Claude / Cursor → MCP local (ce dossier) → HTTPS + PAT → API DevToolbox
```

## Prérequis

- Node.js **20+**
- Instance DevToolbox joignable (prod ou local)
- Personal Access Token `dt_...` avec scope **`tasks`**  
  → **Mon compte → Accès API**

## Installation

```bash
cd mcp-task-reminder
cp .env.example .env   # optionnel, pour tests manuels
npm install
npm run build
```

Variables requises (via config MCP `env`, pas besoin de `.env` si elles y sont) :

| Variable | Exemple |
|----------|---------|
| `DEVTOOLBOX_API_URL` | `https://devtoolbox.creactiveweb.com/api` |
| `DEVTOOLBOX_PAT` | `dt_...` |

## Outils exposés

| Tool | Action |
|------|--------|
| `list_tasks` | Liste (filtre `status` / `client`) |
| `get_task` | Détail par id |
| `create_task` | Création (`title` + `dueDate` obligatoires) |
| `update_task` | Mise à jour complète |
| `set_task_status` | `pending` / `in_progress` / `completed` |
| `delete_task` | Suppression |
| `list_clients` | Clients prédéfinis |
| `create_client` | Ajouter un client |

## Claude Desktop

Édite `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) :

```json
{
  "mcpServers": {
    "devtoolbox-tasks": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/DevToolbox/mcp-task-reminder/dist/index.js"
      ],
      "env": {
        "DEVTOOLBOX_API_URL": "https://devtoolbox.creactiveweb.com/api",
        "DEVTOOLBOX_PAT": "dt_VOTRE_TOKEN"
      }
    }
  }
}
```

Redémarre Claude Desktop. Vérifie que les tools `list_tasks`, `create_task`, etc. apparaissent.

## Cursor

Dans **Cursor Settings → MCP**, ajoute un serveur (ou `.cursor/mcp.json` utilisateur) :

```json
{
  "mcpServers": {
    "devtoolbox-tasks": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/DevToolbox/mcp-task-reminder/dist/index.js"
      ],
      "env": {
        "DEVTOOLBOX_API_URL": "https://devtoolbox.creactiveweb.com/api",
        "DEVTOOLBOX_PAT": "dt_VOTRE_TOKEN"
      }
    }
  }
}
```

## Claude Code

```bash
claude mcp add-json devtoolbox-tasks '{
  "command": "node",
  "args": ["/ABSOLUTE/PATH/TO/DevToolbox/mcp-task-reminder/dist/index.js"],
  "env": {
    "DEVTOOLBOX_API_URL": "https://devtoolbox.creactiveweb.com/api",
    "DEVTOOLBOX_PAT": "dt_VOTRE_TOKEN"
  }
}'
```

## Prompt utile à coller à Claude

```text
Utilise les tools MCP Task Reminder (list_tasks, create_task, etc.) pour gérer mes tâches DevToolbox.
Réponds en français. Si la date d’échéance manque, demande-la avant create_task.
Après chaque action, confirme titre + échéance + statut (+ client si présent).
N’affiche jamais le token.
```

Le skill HTTP détaillé reste disponible dans [`hermes/SKILL.md`](../hermes/SKILL.md) si besoin de contexte métier ; avec ce MCP, **ne passe plus par curl**.

## Test manuel (hors MCP)

```bash
export DEVTOOLBOX_API_URL=https://devtoolbox.creactiveweb.com/api
export DEVTOOLBOX_PAT=dt_VOTRE_TOKEN
npm run build
# Le serveur attend du JSON-RPC sur stdin ; pour valider le build :
node -e "import('./dist/index.js')" 2>&1 | head -5
# (quitté faute de PAT ou attend stdin — OK si le binaire charge)
```

## Sécurité

- Ne committez jamais `DEVTOOLBOX_PAT` ni un `.env`
- Scope **`tasks` uniquement**
- Révoquez le token dans **Mon compte → Accès API** en cas de fuite

## Dépannage

| Problème | Cause probable |
|----------|----------------|
| Serveur MCP absent dans Claude | Chemin absolu incorrect ou `npm run build` non fait |
| `DEVTOOLBOX_PAT manquant` | `env` absent dans la config MCP |
| `HTTP 401` | Token révoqué / mauvais scope |
| `HTTP 400 Titre et date…` | `dueDate` manquant ou pas au format `YYYY-MM-DD` |
