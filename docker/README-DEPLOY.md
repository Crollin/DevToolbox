# Guide de déploiement Docker

## Problème de credentials Docker sur macOS

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

1. **Déverrouiller le trousseau macOS** :
   ```bash
   security unlock-keychain ~/Library/Keychains/login.keychain-db
   ```

2. **Changer le credential helper** (si vous ne déployez pas depuis macOS) :
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

