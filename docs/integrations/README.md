# Intégrations API

DevToolbox expose une API REST authentifiée (JWT ou Personal Access Token `dt_...`) pour connecter des clients externes.

## Guide principal

- **[Personal Access Tokens (Accès API)](personal-access-tokens.md)** — création des tokens, scopes, révocation, exemples `curl`

## Clients documentés

| Client | Usage | Scope(s) typique(s) | Documentation |
|--------|-------|---------------------|---------------|
| [Raycast](../../raycast/README.md) | Licences, tâches, KB depuis macOS | `licences`, `tasks`, `knowledge_base` | Extension locale hors Store |
| [Hermes Agent](../../hermes/README.md) | Task Reminder via agent IA | `tasks` | Skill + variables d'env |
| Scripts / automatisations | `curl`, n8n, cron… | Selon besoin | [Guide PAT](personal-access-tokens.md) |

## Interface utilisateur

**Mon compte → Accès API** : créer, révoquer et supprimer les tokens ; choisir les périmètres d'accès par outil.

## Référence technique

- [API backend](../../backend/README.md) — liste complète des endpoints
- [Sécurité](../../SECURITY.md) — bonnes pratiques PAT et secrets
