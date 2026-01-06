# Guide de déploiement Docker

## Problème de credentials Docker sur macOS

Lors du déploiement sur des serveurs distants, vous pouvez rencontrer l'erreur suivante :

```
error getting credentials - err: exit status 1, out: `keychain cannot be accessed because the current session does not allow user interaction. The keychain may be locked; unlock it by running "security -v unlock-keychain ~/Library/Keychains/login.keychain-db" and try again`
```

Ce problème survient car macOS utilise `osxkeychain` comme credential helper par défaut, ce qui n'est pas disponible dans une session non-interactive sur un serveur distant.

## Solutions

### Solution 0 : Script de déploiement automatique (Recommandé - La plus simple)

Le projet inclut un script `deploy.sh` qui configure automatiquement Docker pour éviter le problème du keychain avant d'exécuter `docker compose`.

**Utilisation :**

Au lieu d'utiliser directement `docker compose`, utilisez le script `deploy.sh` :

```bash
# Au lieu de : docker compose up -d --build
./scripts/deploy.sh up -d --build

# Au lieu de : docker compose down
./scripts/deploy.sh down

# Pour un déploiement complet
./scripts/deploy.sh down && ./scripts/deploy.sh up -d --build
```

**Comment ça fonctionne :**

1. Le script sauvegarde automatiquement votre configuration Docker actuelle
2. Désactive temporairement `credsStore` (osxkeychain) dans `~/.docker/config.json`
3. Exécute la commande `docker compose` avec les arguments fournis
4. Restaure automatiquement la configuration originale après l'exécution

**Avantages :**

- ✅ Aucune configuration manuelle nécessaire
- ✅ Fonctionne automatiquement sur serveurs distants
- ✅ Restaure la configuration originale après utilisation
- ✅ Compatible avec toutes les commandes docker-compose
- ✅ Fonctionne avec les images publiques Docker Hub (pas besoin de credentials)

**Note :** Ce script fonctionne uniquement pour les images publiques Docker Hub. Pour les images privées, vous devrez toujours utiliser `docker login` ou une des autres solutions ci-dessous.

### Solution 1 : Configuration permanente sans keychain

Si vous voulez désactiver définitivement le keychain (utile pour les serveurs de build automatisés), utilisez le script `setup-docker-no-keychain.sh` :

```bash
# Mode interactif (demande confirmation)
./scripts/setup-docker-no-keychain.sh

# Mode non-interactif (pour scripts automatisés)
./scripts/setup-docker-no-keychain.sh --non-interactive
```

**Attention :** Cette solution modifie définitivement votre configuration Docker. Les credentials Docker Hub seront stockés en clair dans `config.json` au lieu du keychain.

### Solution 2 : Utiliser des variables d'environnement

Au lieu d'utiliser le credential helper, utilisez directement les variables d'environnement lors du déploiement :

```bash
# Sur le serveur distant
export DOCKER_USERNAME="votre-username"
export DOCKER_PASSWORD="votre-password"
export DOCKER_REGISTRY="registry.example.com"  # Optionnel, par défaut docker.io

# Puis se connecter
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin $DOCKER_REGISTRY
```

### Solution 3 : Utiliser le credential helper "file"

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

### Solution 5 : Utiliser un secret manager (Pour images privées uniquement)

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

1. **Utiliser le script deploy.sh** (recommandé) :
   ```bash
   ./scripts/deploy.sh up -d --build
   ```

2. **Déverrouiller le trousseau macOS** :
   ```bash
   security unlock-keychain ~/Library/Keychains/login.keychain-db
   ```

3. **Désactiver définitivement le keychain** :
   ```bash
   ./scripts/setup-docker-no-keychain.sh
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

