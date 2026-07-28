# DevToolbox — extension Raycast

Commandes Raycast pour les licences, tâches et Knowledge Base de votre instance DevToolbox. L’extension s’installe en local (hors Raycast Store).

## Prérequis

- Raycast sur macOS
- Node.js 22+
- Une instance DevToolbox joignable (ex. `http://localhost:1400` ou votre domaine HTTPS)

## 1. Créer un Personal Access Token

Le token `dt_...` est affiché **une seule fois** à la création.

Guide complet : [Personal Access Tokens (Accès API)](../docs/integrations/personal-access-tokens.md)

### Depuis DevToolbox (recommandé)

1. **Mon compte** → onglet **Accès API**
2. Nommez le token (ex. `Raycast Mac`), choisissez une expiration optionnelle
3. Scopes : **Licences**, **Tâches** et/ou **Knowledge Base**
4. **Créer le token** → copiez-le immédiatement

Vous pouvez lister, révoquer et supprimer les tokens depuis la même page.

### Via l’API

```bash
# JWT de session
curl -s -X POST https://votre-domaine.example/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"vous@example.com","password":"VOTRE_MOT_DE_PASSE"}'

# Personal Access Token (scopes optionnels)
curl -s -X POST https://votre-domaine.example/api/auth/personal-tokens \
  -H 'Authorization: Bearer VOTRE_JWT' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Raycast Mac","scopes":["licences","tasks","knowledge_base"]}'
```

En local, remplacez l’URL par `http://localhost:1400`.

## 2. Installer l’extension

Depuis la racine du dépôt :

```bash
cd raycast
npm install
npm run dev
```

Dans Raycast : **Manage Extensions → + → Import Extension** → dossier `raycast`.

## 3. Configurer

Préférences de l’extension :

- **DevToolbox API URL** : URL avec `/api` (ex. `https://votre-domaine.example/api`)
- **Personal Access Token** : valeur `dt_...`

Commandes :

| Commande | Scope requis |
|----------|--------------|
| Search / Create Licences | `licences` |
| Search / Create Tasks | `tasks` |
| Search Knowledge Base | `knowledge_base` |

Les clés de licence ne s’affichent pas dans la liste : uniquement via **Copy Licence Key**.

## Révoquer l’accès

**Mon compte → Accès API** → révoquer le token, ou via l’API :

```bash
curl -s https://votre-domaine.example/api/auth/personal-tokens \
  -H 'Authorization: Bearer VOTRE_JWT'

curl -X DELETE https://votre-domaine.example/api/auth/personal-tokens/ID_DU_TOKEN \
  -H 'Authorization: Bearer VOTRE_JWT'
```

## Dépannage

- **Token invalide** : créez un nouveau token et mettez à jour les préférences Raycast
- **API inaccessible** : vérifiez URL, HTTPS, firewall
- **Extension absente** : relancez `npm run dev` dans `raycast/`
