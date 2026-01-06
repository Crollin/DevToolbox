#!/bin/bash

# Script de déploiement Docker qui configure automatiquement Docker
# pour éviter le problème du keychain macOS lors du build sur serveur distant
# 
# Usage: ./scripts/deploy.sh [docker-compose-commands]
# Exemples:
#   ./scripts/deploy.sh up -d --build
#   ./scripts/deploy.sh down
#   ./scripts/deploy.sh down && ./scripts/deploy.sh up -d --build

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOCKER_CONFIG="${HOME}/.docker/config.json"
BACKUP_CONFIG="${DOCKER_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
TEMP_CONFIG="${DOCKER_CONFIG}.temp"

# Fonction pour restaurer la configuration
restore_config() {
    if [ -f "$BACKUP_CONFIG" ]; then
        echo -e "${YELLOW}🔄 Restauration de la configuration Docker originale...${NC}"
        mv "$BACKUP_CONFIG" "$DOCKER_CONFIG"
        echo -e "${GREEN}✅ Configuration restaurée${NC}"
    elif [ -f "$DOCKER_CONFIG" ] && [ ! -f "$BACKUP_CONFIG" ]; then
        # Si le backup n'existe pas mais que le fichier existe, vérifier s'il a été modifié
        if [ -f "${DOCKER_CONFIG}.original" ]; then
            mv "${DOCKER_CONFIG}.original" "$DOCKER_CONFIG"
            echo -e "${GREEN}✅ Configuration restaurée${NC}"
        fi
    fi
    # Nettoyer le fichier temporaire s'il existe
    rm -f "$TEMP_CONFIG" 2>/dev/null || true
}

# Gestion de la sortie propre
trap restore_config EXIT INT TERM

echo -e "${BLUE}🔧 Configuration Docker pour éviter le keychain...${NC}"

# Vérifier si le fichier de config existe
if [ -f "$DOCKER_CONFIG" ]; then
    # Sauvegarder la configuration actuelle
    echo -e "${YELLOW}📋 Sauvegarde de la configuration Docker actuelle...${NC}"
    cp "$DOCKER_CONFIG" "$BACKUP_CONFIG"
    
    # Vérifier si credsStore est présent
    if grep -q '"credsStore"' "$DOCKER_CONFIG" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Désactivation temporaire de credsStore (osxkeychain)...${NC}"
        
        # Retirer credsStore de la configuration
        if command -v jq &> /dev/null; then
            # Utiliser jq si disponible (plus propre)
            jq 'del(.credsStore)' "$DOCKER_CONFIG" > "$TEMP_CONFIG" 2>/dev/null || {
                # Si jq échoue, utiliser une approche plus simple avec sed
                cp "$DOCKER_CONFIG" "$TEMP_CONFIG"
                # Retirer la ligne credsStore (approximation)
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    sed -i '' '/"credsStore"/d' "$TEMP_CONFIG" 2>/dev/null || true
                    sed -i '' 's/,\s*}/}/g; s/,\s*]/]/g' "$TEMP_CONFIG" 2>/dev/null || true
                else
                    sed -i '/"credsStore"/d' "$TEMP_CONFIG" 2>/dev/null || true
                    sed -i 's/,\s*}/}/g; s/,\s*]/]/g' "$TEMP_CONFIG" 2>/dev/null || true
                fi
            }
        else
            # Approche avec sed si jq n'est pas disponible
            cp "$DOCKER_CONFIG" "$TEMP_CONFIG"
            # Retirer la ligne credsStore
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' '/"credsStore"/d' "$TEMP_CONFIG" 2>/dev/null || true
                sed -i '' 's/,\s*}/}/g; s/,\s*]/]/g' "$TEMP_CONFIG" 2>/dev/null || true
            else
                sed -i '/"credsStore"/d' "$TEMP_CONFIG" 2>/dev/null || true
                sed -i 's/,\s*}/}/g; s/,\s*]/]/g' "$TEMP_CONFIG" 2>/dev/null || true
            fi
        fi
        
        # Remplacer la config par la version modifiée
        mv "$TEMP_CONFIG" "$DOCKER_CONFIG"
        echo -e "${GREEN}✅ credsStore désactivé temporairement${NC}"
    else
        echo -e "${GREEN}✅ credsStore n'est pas activé dans la configuration${NC}"
        # Pas besoin de backup si rien n'a changé
        rm -f "$BACKUP_CONFIG" 2>/dev/null || true
    fi
else
    # Si le fichier n'existe pas, créer une config minimale sans credsStore
    echo -e "${YELLOW}📝 Création d'une configuration Docker minimale...${NC}"
    mkdir -p "$(dirname "$DOCKER_CONFIG")"
    echo '{}' > "$DOCKER_CONFIG"
    echo -e "${GREEN}✅ Configuration créée${NC}"
    # Pas besoin de backup si le fichier n'existait pas
    rm -f "$BACKUP_CONFIG" 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}🚀 Exécution de docker compose...${NC}"
echo ""

# Vérifier que docker-compose est disponible
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Erreur: Docker n'est pas installé${NC}"
    exit 1
fi

# Déterminer quelle commande utiliser (docker-compose ou docker compose)
DOCKER_COMPOSE_CMD=""
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}❌ Erreur: docker-compose n'est pas installé${NC}"
    exit 1
fi

# Vérifier que docker-compose.yml existe
if [ ! -f "docker-compose.yml" ] && [ ! -f "docker-compose.yaml" ]; then
    echo -e "${RED}❌ Erreur: docker-compose.yml n'est pas trouvé dans le répertoire actuel${NC}"
    exit 1
fi

# Exécuter la commande docker-compose avec tous les arguments passés
$DOCKER_COMPOSE_CMD "$@"

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Commande docker compose terminée avec succès !${NC}"
    # Si tout s'est bien passé, on peut garder la config modifiée ou la restaurer
    # Ici on restaure pour être sûr de ne pas modifier définitivement la config
    if [ -f "$BACKUP_CONFIG" ]; then
        restore_config
    fi
else
    echo -e "${RED}❌ La commande docker compose a échoué avec le code de sortie: $EXIT_CODE${NC}"
    # Restaurer la config en cas d'erreur
    if [ -f "$BACKUP_CONFIG" ]; then
        restore_config
    fi
fi

# La restauration se fera automatiquement via le trap EXIT si nécessaire
exit $EXIT_CODE

