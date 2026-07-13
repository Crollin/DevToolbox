# DevToolbox Licences — guide d'installation Raycast

Cette extension est privée et destinée à un usage personnel. Elle n'est pas publiée dans le Raycast Store.

## Pré-requis

- Raycast installé sur le Mac ;
- Node.js 22 ou plus récent ;
- une instance DevToolbox accessible depuis le Mac ;
- une API accessible en HTTPS en production (ou `http://localhost:1400` en local).

## 1. Créer le Personal Access Token

Le token permet à Raycast d'accéder uniquement aux licences. Il est affiché une seule fois lors de sa création.

Depuis un terminal, connectez-vous d'abord pour obtenir un JWT de session :

```bash
curl -s -X POST https://votre-domaine.example/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"vous@example.com","password":"VOTRE_MOT_DE_PASSE"}'
```

Puis créez le token Raycast en remplaçant `VOTRE_JWT` :

```bash
curl -s -X POST https://votre-domaine.example/api/auth/personal-tokens \
  -H 'Authorization: Bearer VOTRE_JWT' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Raycast"}'
```

Copiez immédiatement la valeur `token` retournée. Elle ne pourra pas être récupérée plus tard.

Pour une installation locale, remplacez l'URL par `http://localhost:1400`.

## 2. Installer l'extension localement

Depuis la racine du projet :

```bash
cd raycast
npm install
npm run dev
```

Raycast charge alors l'extension en mode développement. Elle reste locale et privée.

## 3. Configurer Raycast

Dans Raycast, ouvrez les préférences de l'extension et renseignez :

- **DevToolbox API URL** : l'URL incluant `/api`, par exemple `https://votre-domaine.example/api` ;
- **Personal Access Token** : la valeur `dt_...` copiée à l'étape précédente.

Les commandes suivantes sont ensuite disponibles dans Raycast :

- **Search Licences** : rechercher, copier, modifier, supprimer ou ouvrir une licence ;
- **Create Licence** : créer une nouvelle licence.

Les clés ne sont jamais affichées dans la liste ; elles sont uniquement copiées après l'action explicite **Copy Licence Key**.

## Révoquer l'accès

Listez les tokens avec votre JWT de session :

```bash
curl -s https://votre-domaine.example/api/auth/personal-tokens \
  -H 'Authorization: Bearer VOTRE_JWT'
```

Puis révoquez le token avec son `id` :

```bash
curl -X DELETE https://votre-domaine.example/api/auth/personal-tokens/ID_DU_TOKEN \
  -H 'Authorization: Bearer VOTRE_JWT'
```

## Dépannage

- **Token invalide** : créez un nouveau token et remplacez la valeur dans les préférences Raycast.
- **API inaccessible** : vérifiez l'URL, le port, le HTTPS et que le serveur est joignable depuis le Mac.
- **L'extension n'apparaît pas** : relancez `npm run dev` depuis le dossier `raycast`.
