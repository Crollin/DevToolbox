#!/bin/bash

# Script de build Docker qui évite le problème du keychain macOS
# Ce script configure temporairement Docker pour ne pas utiliser osxkeychain
# lors du pull d'images publiques, puis restaure la configuration originale.

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
    elif [ -f "$DOCKER_CONFIG" ]; then
        # Si le backup n'existe pas mais que le fichier existe, on le supprime
        # (cas où le fichier n'existait pas avant)
        rm -f "$DOCKER_CONFIG"
    fi
}

# Gestion de la sortie propre
trap restore_config EXIT INT TERM

echo -e "${GREEN}🔧 Configuration Docker pour éviter le keychain...${NC}"

# Vérifier si le fichier de config existe
if [ -f "$DOCKER_CONFIG" ]; then
    # Sauvegarder la configuration actuelle
    echo -e "${YELLOW}📋 Sauvegarde de la configuration Docker actuelle...${NC}"
    cp "$DOCKER_CONFIG" "$BACKUP_CONFIG"
    
    # Lire la configuration et retirer credsStore si présent
    if command -v jq &> /dev/null; then
        # Utiliser jq si disponible (plus propre)
        jq 'del(.credsStore)' "$DOCKER_CONFIG" > "$TEMP_CONFIG" 2>/dev/null || {
            # Si jq échoue, utiliser une approche plus simple avec sed
            cp "$DOCKER_CONFIG" "$TEMP_CONFIG"
            # Retirer la ligne credsStore (approximation)
            sed -i.bak '/"credsStore"/d' "$TEMP_CONFIG" 2>/dev/null || sed -i '' '/"credsStore"/d' "$TEMP_CONFIG" 2>/dev/null || true
            # Nettoyer les virgules orphelines
            sed -i.bak 's/,\s*}/}/g; s/,\s*]/]/g' "$TEMP_CONFIG" 2>/dev/null || sed -i '' 's/,\s*}/}/g; s/,\s*]/]/g' "$TEMP_CONFIG" 2>/dev/null || true
            rm -f "${TEMP_CONFIG}.bak" 2>/dev/null || true
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
    echo -e "${GREEN}✅ Configuration modifiée (credsStore désactivé temporairement)${NC}"
else
    # Si le fichier n'existe pas, créer une config minimale sans credsStore
    echo -e "${YELLOW}📝 Création d'une configuration Docker minimale...${NC}"
    mkdir -p "$(dirname "$DOCKER_CONFIG")"
    echo '{}' > "$DOCKER_CONFIG"
    echo -e "${GREEN}✅ Configuration créée${NC}"
fi

echo ""
echo -e "${GREEN}🚀 Lancement du build Docker...${NC}"
echo ""

# Déterminer quelle commande utiliser
if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
    # Utiliser docker-compose si disponible
    if command -v docker-compose &> /dev/null; then
        docker-compose build "$@"
    elif docker compose version &> /dev/null; then
        docker compose build "$@"
    else
        echo -e "${RED}❌ Erreur: docker-compose n'est pas installé${NC}"
        exit 1
    fi
else
    # Utiliser docker build directement
    if [ $# -eq 0 ]; then
        echo -e "${YELLOW}⚠️  Aucun argument fourni. Utilisation: docker build .${NC}"
        docker build .
    else
        docker build "$@"
    fi
fi

BUILD_EXIT_CODE=$?

echo ""
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Build terminé avec succès !${NC}"
else
    echo -e "${RED}❌ Le build a échoué avec le code de sortie: $BUILD_EXIT_CODE${NC}"
fi

# La restauration se fera automatiquement via le trap EXIT
exit $BUILD_EXIT_CODE

