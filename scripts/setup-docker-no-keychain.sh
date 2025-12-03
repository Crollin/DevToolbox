#!/bin/bash

# Script de configuration Docker pour désactiver définitivement osxkeychain
# Utile pour les serveurs de build automatisés où le keychain n'est pas accessible
# 
# Usage: ./scripts/setup-docker-no-keychain.sh
# 
# ATTENTION: Ce script modifie définitivement votre configuration Docker.
# Les credentials Docker Hub seront stockés en clair dans config.json au lieu du keychain.

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOCKER_CONFIG="${HOME}/.docker/config.json"
BACKUP_CONFIG="${DOCKER_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}🔧 Configuration Docker pour désactiver osxkeychain${NC}"
echo ""

# Vérifier si le fichier de config existe
if [ -f "$DOCKER_CONFIG" ]; then
    # Sauvegarder la configuration actuelle
    echo -e "${YELLOW}📋 Sauvegarde de la configuration Docker actuelle...${NC}"
    cp "$DOCKER_CONFIG" "$BACKUP_CONFIG"
    echo -e "${GREEN}✅ Backup créé: $BACKUP_CONFIG${NC}"
    
    # Vérifier si credsStore est déjà désactivé
    if grep -q '"credsStore"' "$DOCKER_CONFIG" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  credsStore est actuellement activé dans la configuration${NC}"
        
        # Demander confirmation si en mode interactif
        if [ -t 0 ]; then
            echo -e "${YELLOW}Voulez-vous continuer ? (o/N)${NC}"
            read -r response
            if [[ ! "$response" =~ ^[OoYy]$ ]]; then
                echo -e "${YELLOW}❌ Opération annulée${NC}"
                exit 0
            fi
        fi
        
        # Retirer credsStore de la configuration
        if command -v jq &> /dev/null; then
            # Utiliser jq si disponible (plus propre)
            jq 'del(.credsStore)' "$DOCKER_CONFIG" > "${DOCKER_CONFIG}.tmp"
            mv "${DOCKER_CONFIG}.tmp" "$DOCKER_CONFIG"
            echo -e "${GREEN}✅ credsStore retiré de la configuration${NC}"
        else
            # Approche avec sed si jq n'est pas disponible
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' '/"credsStore"/d' "$DOCKER_CONFIG"
                sed -i '' 's/,\s*}/}/g; s/,\s*]/]/g' "$DOCKER_CONFIG"
            else
                sed -i '/"credsStore"/d' "$DOCKER_CONFIG"
                sed -i 's/,\s*}/}/g; s/,\s*]/]/g' "$DOCKER_CONFIG"
            fi
            echo -e "${GREEN}✅ credsStore retiré de la configuration${NC}"
        fi
    else
        echo -e "${GREEN}✅ credsStore n'est pas activé dans la configuration${NC}"
    fi
else
    # Si le fichier n'existe pas, créer une config minimale sans credsStore
    echo -e "${YELLOW}📝 Création d'une nouvelle configuration Docker...${NC}"
    mkdir -p "$(dirname "$DOCKER_CONFIG")"
    echo '{}' > "$DOCKER_CONFIG"
    echo -e "${GREEN}✅ Configuration créée${NC}"
fi

echo ""
echo -e "${GREEN}✅ Configuration terminée !${NC}"
echo ""
echo -e "${BLUE}📝 Note:${NC}"
echo -e "   - Les images publiques Docker Hub peuvent maintenant être téléchargées sans keychain"
echo -e "   - Pour les images privées, vous devrez utiliser 'docker login' qui stockera les"
echo -e "     credentials en clair dans ${DOCKER_CONFIG}"
echo ""
echo -e "${YELLOW}💡 Pour restaurer la configuration précédente:${NC}"
echo -e "   cp $BACKUP_CONFIG $DOCKER_CONFIG"
echo ""



