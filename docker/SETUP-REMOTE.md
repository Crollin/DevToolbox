# Configuration Docker pour serveurs distants Linux

## Problème

Lors du build Docker sur un serveur Linux distant, vous pouvez rencontrer cette erreur :

```
ERROR [frontend internal] load metadata for docker.io/library/node:20-alpine
target frontend: failed to solve: error getting credentials - err: exit status 1, 
out: `keychain cannot be accessed because the current session does not allow user interaction. 
The keychain may be locked; unlock it by running "security -v unlock-keychain ~/Library/Keychains/login.keychain-db" and try again`
```

**Cause** : La configuration Docker (`~/.docker/config.json`) contient `credsStore: "osxkeychain"` qui est spécifique à macOS et n'existe pas sur Linux.

## Solution définitive (Recommandée)

Exécutez ce script **une seule fois** sur votre serveur distant Linux :

```bash
# Sur le serveur distant
cd /chemin/vers/DevToolbox
./scripts/setup-docker-remote.sh
```

Ce script :
- ✅ Retire `credsStore: "osxkeychain"` de la configuration Docker
- ✅ Configure Docker pour fonctionner sans keychain
- ✅ Teste automatiquement la configuration
- ✅ Sauvegarde votre configuration actuelle

**Après cette configuration, tous vos builds Docker fonctionneront sans erreur.**

## Solution temporaire (si vous ne pouvez pas modifier la config)

Si vous ne pouvez pas modifier la configuration Docker de manière permanente, utilisez le script de build qui configure temporairement Docker :

```bash
# Sur le serveur distant
./scripts/docker-build.sh frontend backend
```

Ce script configure Docker temporairement pour le build, puis restaure la configuration originale.

## Vérification

Pour vérifier que la configuration fonctionne :

```bash
# Tester le téléchargement d'une image publique
docker pull node:20-alpine
docker pull nginx:alpine

# Si ces commandes fonctionnent, la configuration est correcte
```

## Restauration

Si vous avez besoin de restaurer la configuration précédente :

```bash
# Trouver le backup le plus récent
ls -lt ~/.docker/config.json.backup.* | head -1

# Restaurer (remplacer TIMESTAMP par la date du backup)
cp ~/.docker/config.json.backup.TIMESTAMP ~/.docker/config.json
```

## Notes importantes

- Les credentials Docker Hub seront stockés en clair dans `~/.docker/config.json` (normal sur Linux)
- Cette configuration est permanente et fonctionne pour tous les builds Docker
- Vous n'aurez plus besoin de reconfigurer Docker à chaque build

