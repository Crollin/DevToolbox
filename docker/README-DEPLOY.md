# Guide de déploiement Docker

## Problème de keychain Docker sur macOS

### Erreur lors du build avec images publiques

Lors du déploiement sur un serveur Mac (ou lors de builds automatisés), vous pouvez rencontrer l'erreur suivante :

```
ERROR [frontend internal] load metadata for docker.io/library/node:20-alpine
target backend: failed to solve: error getting credentials - err: exit status 1, 
out: `keychain cannot be accessed because the current session does not allow user interaction. 
The keychain may be locked; unlock it by running "security -v unlock-keychain ~/Library/Keychains/login.keychain-db" and try again`
```

**Cause** : Docker essaie d'accéder au keychain macOS même pour télécharger des images publiques (`node:20-alpine`, `nginx:alpine`), ce qui échoue lorsque la session ne permet pas l'interaction utilisateur (builds automatisés, SSH sans interface graphique, etc.).

### Solution rapide : Script de build automatique (Recommandé)

Le projet inclut un script qui configure automatiquement Docker pour éviter le keychain lors du build :

```bash
# Utiliser le script de build au lieu de docker-compose build
./scripts/docker-build.sh

# Ou avec docker-compose directement
./scripts/docker-build.sh frontend backend

# Le script restaure automatiquement la configuration après le build
```

**Avantages** :
- ✅ Fonctionne avec les images publiques sans credentials
- ✅ Restaure automatiquement votre configuration Docker après le build
- ✅ Compatible avec docker-compose et docker build
- ✅ Ne modifie pas définitivement votre configuration

### Solution permanente : Désactiver osxkeychain

Pour les serveurs de build automatisés où le keychain n'est jamais nécessaire :

```bash
# Exécuter le script de configuration
./scripts/setup-docker-no-keychain.sh
```

Ce script :
- Sauvegarde votre configuration actuelle
- Retire `credsStore: "osxkeychain"` de manière permanente
- Permet le téléchargement d'images publiques sans keychain

**Note** : Après cette configuration, les credentials Docker Hub seront stockés en clair dans `~/.docker/config.json` au lieu du keychain.

## Problème de credentials Docker sur serveurs distants

Lors du déploiement sur des serveurs distants, vous pouvez rencontrer l'erreur suivante :

```
Erreur de credentials
Cause : Votre Docker config (~/.docker/config.json) utilise osxkeychain pour stocker les credentials, mais le trousseau est verrouillé.
```

Ce problème survient car macOS utilise `osxkeychain` comme credential helper par défaut, ce qui n'est pas disponible sur les serveurs Linux distants.

## Solutions

### Solution 1 : Utiliser des variables d'environnement (Recommandé)

Au lieu d'utiliser le credential helper, utilisez directement les variables d'environnement lors du déploiement :

```bash
# Sur le serveur distant
export DOCKER_USERNAME="votre-username"
export DOCKER_PASSWORD="votre-password"
export DOCKER_REGISTRY="registry.example.com"  # Optionnel, par défaut docker.io

# Puis se connecter
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin $DOCKER_REGISTRY
```

### Solution 2 : Utiliser le credential helper "file"

Sur le serveur distant, configurez Docker pour utiliser le credential helper "file" au lieu d'osxkeychain :

```bash
# Sur le serveur distant
mkdir -p ~/.docker
cat > ~/.docker/config.json << EOF
{
  "auths": {},
  "credsStore": "file"
}
EOF

# Ou sans credential helper (stockage en clair dans config.json)
cat > ~/.docker/config.json << EOF
{
  "auths": {
    "https://index.docker.io/v1/": {
      "auth": "$(echo -n 'username:password' | base64)"
    }
  }
}
EOF
```

### Solution 3 : Script de déploiement automatisé

Créez un script de déploiement qui configure automatiquement les credentials :

```bash
#!/bin/bash
# deploy.sh

set -e

# Configuration
DOCKER_USERNAME="${DOCKER_USERNAME:-}"
DOCKER_PASSWORD="${DOCKER_PASSWORD:-}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-docker.io}"

if [ -z "$DOCKER_USERNAME" ] || [ -z "$DOCKER_PASSWORD" ]; then
  echo "Erreur: DOCKER_USERNAME et DOCKER_PASSWORD doivent être définis"
  exit 1
fi

# Se connecter à Docker
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin $DOCKER_REGISTRY

# Construire et démarrer les conteneurs
docker-compose build
docker-compose up -d

echo "Déploiement terminé avec succès"
```

Utilisation :
```bash
DOCKER_USERNAME="mon-user" DOCKER_PASSWORD="mon-pass" ./deploy.sh
```

### Solution 4 : Utiliser docker-compose avec credentials inline

Vous pouvez également configurer les credentials directement dans `docker-compose.yml` en utilisant des variables d'environnement :

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    # ... autres configurations
```

Puis utiliser un fichier `.env` sur le serveur :
```bash
# .env sur le serveur
DOCKER_USERNAME=votre-username
DOCKER_PASSWORD=votre-password
```

### Solution 5 : Utiliser un secret manager

Pour les environnements de production, utilisez un gestionnaire de secrets (HashiCorp Vault, AWS Secrets Manager, etc.) :

```bash
# Exemple avec AWS Secrets Manager
SECRET=$(aws secretsmanager get-secret-value --secret-id docker-credentials --query SecretString --output text)
DOCKER_USERNAME=$(echo $SECRET | jq -r .username)
DOCKER_PASSWORD=$(echo $SECRET | jq -r .password)

echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
```

## Configuration locale (macOS)

Pour éviter le problème sur votre machine locale, vous pouvez :

1. **Utiliser le script de build** (recommandé pour les builds ponctuels) :
   ```bash
   ./scripts/docker-build.sh
   ```

2. **Désactiver définitivement osxkeychain** (pour les serveurs de build) :
   ```bash
   ./scripts/setup-docker-no-keychain.sh
   ```

3. **Déverrouiller le trousseau macOS** (si vous voulez garder osxkeychain) :
   ```bash
   security unlock-keychain ~/Library/Keychains/login.keychain-db
   ```

4. **Changer le credential helper manuellement** :
   ```bash
   # Utiliser "file" au lieu d'osxkeychain
   cat > ~/.docker/config.json << EOF
   {
     "auths": {},
     "credsStore": "file"
   }
   EOF
   ```

## Bonnes pratiques

1. **Ne jamais commiter les credentials** dans le dépôt Git
2. **Utiliser des secrets managers** en production
3. **Utiliser des tokens avec permissions limitées** plutôt que des mots de passe complets
4. **Rotater les credentials régulièrement**
5. **Utiliser des variables d'environnement** plutôt que des fichiers de config

## Dépannage

### Vérifier la configuration actuelle
```bash
cat ~/.docker/config.json
```

### Tester la connexion
```bash
docker login
docker pull hello-world
```

### Nettoyer les credentials
```bash
docker logout
rm ~/.docker/config.json
```

### Restaurer la configuration après utilisation du script de build

Le script `docker-build.sh` restaure automatiquement la configuration. Si vous avez besoin de restaurer manuellement :

```bash
# Trouver le backup le plus récent
ls -lt ~/.docker/config.json.backup.* | head -1

# Restaurer (remplacer TIMESTAMP par la date du backup)
cp ~/.docker/config.json.backup.TIMESTAMP ~/.docker/config.json
```

### Vérifier que le script fonctionne

```bash
# Tester le script de build
./scripts/docker-build.sh --help 2>/dev/null || ./scripts/docker-build.sh

# Vérifier que les images publiques peuvent être téléchargées
docker pull node:20-alpine
docker pull nginx:alpine
```


