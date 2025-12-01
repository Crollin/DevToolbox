# Dépannage et FAQ

Guide de résolution des problèmes courants avec DevToolbox.

## Table des matières

- [Problèmes d'installation](#problèmes-dinstallation)
- [Problèmes Docker](#problèmes-docker)
- [Problèmes backend](#problèmes-backend)
- [Problèmes frontend](#problèmes-frontend)
- [Problèmes de base de données](#problèmes-de-base-de-données)
- [Problèmes d'API](#problèmes-dapi)
- [FAQ](#faq)

## Problèmes d'installation

### Node.js version incorrecte

**Symptôme** : Erreur lors de `npm install` ou `npm run dev`

**Solution** :
```bash
# Vérifier la version
node --version  # Doit être >= 20

# Installer Node.js 20+ avec nvm
nvm install 20
nvm use 20
```

### Erreurs de dépendances

**Symptôme** : Erreurs lors de `npm install`

**Solution** :
```bash
# Supprimer node_modules et package-lock.json
rm -rf node_modules package-lock.json
cd backend && rm -rf node_modules package-lock.json && cd ..

# Réinstaller
npm install
cd backend && npm install && cd ..
```

### Port déjà utilisé

**Symptôme** : `EADDRINUSE: address already in use :::1400`

**Solution** :
```bash
# Trouver le processus utilisant le port
lsof -i :1400  # ou lsof -i :8080

# Tuer le processus
kill -9 <PID>

# Ou changer le port dans .env
PORT=3001
```

## Problèmes Docker

### Les conteneurs ne démarrent pas

**Symptôme** : `docker-compose up -d` échoue

**Solution** :
```bash
# Vérifier les logs
docker-compose logs

# Rebuild sans cache
docker-compose build --no-cache
docker-compose up -d

# Vérifier l'espace disque
docker system df
```

### Le frontend ne se charge pas

**Symptôme** : Page blanche ou erreur 502

**Solution** :
```bash
# Vérifier que le conteneur frontend est démarré
docker-compose ps

# Vérifier les logs
docker-compose logs frontend

# Rebuild le frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Le backend ne répond pas

**Symptôme** : Erreur 500 ou timeout

**Solution** :
```bash
# Vérifier les logs
docker-compose logs backend

# Vérifier la base de données
docker-compose exec backend sh
cd /app/data
ls -la devtoolbox.db

# Redémarrer le backend
docker-compose restart backend
```

### Problèmes de permissions

**Symptôme** : Erreurs d'accès aux fichiers

**Solution** :
```bash
# Donner les permissions
chmod -R 755 ./data

# Changer le propriétaire
sudo chown -R $USER:$USER ./data
```

## Problèmes backend

### Le serveur ne démarre pas

**Symptôme** : Erreur au démarrage du backend

**Solution** :
```bash
# Vérifier les logs
cd backend && npm run dev

# Vérifier la base de données
ls -la data/devtoolbox.db

# Supprimer et recréer la base
rm -rf data/devtoolbox.db
npm run dev  # La base sera recréée automatiquement
```

### Erreurs de base de données

**Symptôme** : `SQLITE_ERROR: no such table`

**Solution** :
```bash
# Exécuter les migrations
cd backend
npm run db:migrate

# Ou redémarrer le serveur (migrations automatiques)
npm run dev
```

### Port 1400 déjà utilisé

**Symptôme** : `EADDRINUSE: address already in use :::1400`

**Solution** :
```bash
# Trouver et tuer le processus
lsof -i :1400
kill -9 <PID>

# Ou changer le port
# Dans backend/.env
PORT=3001
```

## Problèmes frontend

### Le frontend ne se connecte pas à l'API

**Symptôme** : Erreurs CORS ou 404 sur les requêtes API

**Solution** :
```bash
# Vérifier que le backend est démarré
curl http://localhost:1400/health

# Vérifier la configuration du proxy dans vite.config.ts
# Le proxy doit pointer vers http://localhost:1400

# Vérifier VITE_API_URL dans .env
echo $VITE_API_URL
```

### Erreurs de build

**Symptôme** : Erreurs lors de `npm run build`

**Solution** :
```bash
# Nettoyer le cache
rm -rf node_modules/.vite
rm -rf dist

# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Erreurs TypeScript

**Symptôme** : Erreurs de type au build

**Solution** :
```bash
# Vérifier les erreurs
npm run build

# Vérifier tsconfig.json
# Les options strictNullChecks et noImplicitAny sont désactivées
# Si nécessaire, corriger les types dans le code
```

## Problèmes de base de données

### Base de données corrompue

**Symptôme** : Erreurs SQLite ou données manquantes

**Solution** :
```bash
# Sauvegarder (si possible)
cp data/devtoolbox.db data/devtoolbox.db.backup

# Supprimer et recréer
rm -rf data/devtoolbox.db

# Redémarrer le backend (recréation automatique)
cd backend && npm run dev
```

### Données perdues

**Symptôme** : Les données ont disparu

**Solution** :
```bash
# Vérifier les backups
ls -la data/*.backup

# Restaurer depuis un backup
cp data/devtoolbox.db.backup data/devtoolbox.db

# Redémarrer le backend
cd backend && npm run dev
```

### Migration échouée

**Symptôme** : Erreurs lors des migrations

**Solution** :
```bash
# Vérifier les migrations dans backend/src/db/migrate.ts

# Exécuter manuellement
cd backend
npm run db:migrate

# Vérifier les tables
sqlite3 data/devtoolbox.db ".tables"
```

## Problèmes d'API

### Erreurs 404

**Symptôme** : `GET /api/endpoint 404`

**Solution** :
```bash
# Vérifier que la route existe dans backend/src/routes/
# Vérifier que la route est enregistrée dans backend/src/index.ts
# Vérifier l'URL de la requête
```

### Erreurs 500

**Symptôme** : `GET /api/endpoint 500`

**Solution** :
```bash
# Vérifier les logs du backend
# Vérifier la base de données
# Vérifier les données de la requête
```

### Erreurs CORS

**Symptôme** : `CORS policy: No 'Access-Control-Allow-Origin'`

**Solution** :
```bash
# Vérifier que CORS est activé dans backend/src/index.ts
# Le backend utilise cors() par défaut
# Vérifier que le frontend fait les requêtes vers la bonne URL
```

## FAQ

### Comment sauvegarder mes données ?

```bash
# Avec Docker
docker-compose exec backend cp /app/data/devtoolbox.db /app/data/devtoolbox.db.backup

# Localement
cp data/devtoolbox.db data/devtoolbox.db.backup
```

### Comment restaurer mes données ?

```bash
# Avec Docker
docker-compose exec backend cp /app/data/devtoolbox.db.backup /app/data/devtoolbox.db

# Localement
cp data/devtoolbox.db.backup data/devtoolbox.db
```

### Comment changer le port du backend ?

Modifiez `backend/.env` :
```env
PORT=3001
```

Ou modifiez `docker-compose.yml` pour Docker.

### Comment changer le port du frontend ?

Modifiez `vite.config.ts` :
```typescript
server: {
  port: 8081,
}
```

### Comment ajouter un nouvel outil ?

Consultez le [Guide de développement](Development#ajout-de-nouveaux-outils).

### Comment contribuer au projet ?

Consultez le [Guide de contribution](Contributing).

### L'application est lente, que faire ?

1. Vérifiez les ressources système (CPU, RAM)
2. Vérifiez les logs pour les erreurs
3. Optimisez les requêtes à la base de données
4. Utilisez Docker en production pour de meilleures performances

### Comment déployer en production ?

Consultez le [Guide Docker](Docker-Guide#production) et le [Guide d'installation](Installation#déploiement).

### L'outil Image Resizer ne fonctionne pas

L'outil Image Resizer fonctionne entièrement côté client. Vérifiez :
1. Que votre navigateur supporte les APIs nécessaires
2. La console du navigateur pour les erreurs
3. Que les fichiers sont bien chargés

### Les données ne se sauvegardent pas

1. Vérifiez que le backend est démarré
2. Vérifiez les logs du backend pour les erreurs
3. Vérifiez les permissions de la base de données
4. Vérifiez que la base de données n'est pas en lecture seule

### Comment réinitialiser complètement l'application ?

```bash
# Arrêter les services
docker-compose down -v  # Avec Docker
# ou arrêter manuellement les processus

# Supprimer la base de données
rm -rf data/devtoolbox.db

# Supprimer node_modules (optionnel)
rm -rf node_modules backend/node_modules

# Réinstaller
npm install
cd backend && npm install && cd ..

# Redémarrer
docker-compose up -d  # Avec Docker
# ou npm run dev dans chaque terminal
```

## Obtenir de l'aide

Si vous ne trouvez pas la solution à votre problème :

1. **Consultez les logs** :
   ```bash
   # Docker
   docker-compose logs -f
   
   # Local
   # Backend : console du terminal
   # Frontend : console du navigateur
   ```

2. **Vérifiez la documentation** :
   - [Guide d'installation](Installation)
   - [Guide Docker](Docker-Guide)
   - [Guide de développement](Development)

3. **Recherchez les issues existantes** sur GitHub

4. **Ouvrez une nouvelle issue** avec :
   - Description du problème
   - Étapes pour reproduire
   - Logs d'erreur
   - Version de Node.js, Docker, etc.
   - Système d'exploitation

---

*Dernière mise à jour : 2024*

