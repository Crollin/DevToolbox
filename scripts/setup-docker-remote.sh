#!/bin/bash

# Script de configuration Docker pour serveurs distants (Linux)
# Ce script configure Docker pour fonctionner sans keychain macOS
# et résout définitivement l'erreur "keychain cannot be accessed"
# 
# Usage: ./scripts/setup-docker-remote.sh
# 
# Ce script peut être exécuté sur un serveur Linux distant pour
# configurer Docker une fois pour toutes.

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOCKER_CONFIG="${HOME}/.docker/config.json"
BACKUP_CONFIG="${DOCKER_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}🔧 Configuration Docker pour serveur distant (Linux)${NC}"
echo ""

# Détecter l'OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}⚠️  Ce script est conçu pour les serveurs Linux distants${NC}"
    echo -e "${YELLOW}   Sur macOS, utilisez plutôt: ./scripts/setup-docker-no-keychain.sh${NC}"
    echo ""
    read -p "Continuer quand même ? (o/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[OoYy]$ ]]; then
        exit 0
    fi
fi

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Erreur: Docker n'est pas installé${NC}"
    exit 1
fi

# Créer le répertoire .docker s'il n'existe pas
mkdir -p "$(dirname "$DOCKER_CONFIG")"

# Sauvegarder la configuration existante si elle existe
if [ -f "$DOCKER_CONFIG" ]; then
    echo -e "${YELLOW}📋 Sauvegarde de la configuration Docker actuelle...${NC}"
    cp "$DOCKER_CONFIG" "$BACKUP_CONFIG"
    echo -e "${GREEN}✅ Backup créé: $BACKUP_CONFIG${NC}"
    
    # Vérifier si credsStore utilise osxkeychain
    if grep -q '"credsStore".*"osxkeychain"' "$DOCKER_CONFIG" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Détection de credsStore avec osxkeychain (incompatible avec Linux)${NC}"
    fi
fi

# Créer ou modifier la configuration Docker
echo -e "${BLUE}📝 Configuration de Docker...${NC}"

if command -v jq &> /dev/null; then
    # Utiliser jq si disponible (plus propre)
    if [ -f "$DOCKER_CONFIG" ]; then
        # Lire la config existante et retirer credsStore
        jq 'del(.credsStore)' "$DOCKER_CONFIG" > "${DOCKER_CONFIG}.tmp" 2>/dev/null || {
            # Si jq échoue, créer une config minimale
            echo '{}' > "${DOCKER_CONFIG}.tmp"
        }
    else
        # Créer une config minimale
        echo '{}' > "${DOCKER_CONFIG}.tmp"
    fi
    
    # S'assurer que auths existe
    jq '.auths //= {}' "${DOCKER_CONFIG}.tmp" > "${DOCKER_CONFIG}.tmp2"
    mv "${DOCKER_CONFIG}.tmp2" "${DOCKER_CONFIG}.tmp"
    
    mv "${DOCKER_CONFIG}.tmp" "$DOCKER_CONFIG"
    echo -e "${GREEN}✅ Configuration mise à jour avec jq${NC}"
else
    # Approche avec sed si jq n'est pas disponible
    if [ -f "$DOCKER_CONFIG" ]; then
        # Retirer credsStore de la configuration
        sed -i '/"credsStore"/d' "$DOCKER_CONFIG" 2>/dev/null || true
        # Nettoyer les virgules orphelines
        sed -i 's/,\s*}/}/g; s/,\s*]/]/g' "$DOCKER_CONFIG" 2>/dev/null || true
        # S'assurer que le JSON est valide
        if ! grep -q '"auths"' "$DOCKER_CONFIG" 2>/dev/null; then
            # Ajouter auths si absent
            if grep -q '^{}$' "$DOCKER_CONFIG" 2>/dev/null; then
                echo '{"auths":{}}' > "$DOCKER_CONFIG"
            else
                # Insérer auths dans un JSON existant
                sed -i 's/{/{"auths":{/; s/}$/}}/' "$DOCKER_CONFIG" 2>/dev/null || true
            fi
        fi
    else
        # Créer une config minimale sans credsStore
        echo '{"auths":{}}' > "$DOCKER_CONFIG"
    fi
    echo -e "${GREEN}✅ Configuration mise à jour avec sed${NC}"
fi

# Vérifier que la configuration est valide
if command -v jq &> /dev/null; then
    if ! jq empty "$DOCKER_CONFIG" 2>/dev/null; then
        echo -e "${RED}❌ Erreur: La configuration Docker n'est pas un JSON valide${NC}"
        if [ -f "$BACKUP_CONFIG" ]; then
            echo -e "${YELLOW}🔄 Restauration du backup...${NC}"
            mv "$BACKUP_CONFIG" "$DOCKER_CONFIG"
        fi
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✅ Configuration terminée !${NC}"
echo ""
echo -e "${BLUE}📝 Résumé:${NC}"
echo -e "   - credsStore a été retiré de la configuration Docker"
echo -e "   - Les images publiques Docker Hub peuvent être téléchargées sans keychain"
echo -e "   - Les credentials seront stockés en clair dans ${DOCKER_CONFIG}"
echo ""
echo -e "${YELLOW}💡 Pour tester la configuration:${NC}"
echo -e "   docker pull node:20-alpine"
echo -e "   docker pull nginx:alpine"
echo ""
if [ -f "$BACKUP_CONFIG" ]; then
    echo -e "${YELLOW}💡 Pour restaurer la configuration précédente:${NC}"
    echo -e "   cp $BACKUP_CONFIG $DOCKER_CONFIG"
    echo ""
fi

# Tester si on peut pull une image publique
echo -e "${BLUE}🧪 Test de téléchargement d'une image publique...${NC}"
if docker pull hello-world:latest > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Test réussi ! Docker peut télécharger des images publiques${NC}"
    docker rmi hello-world:latest > /dev/null 2>&1 || true
else
    echo -e "${YELLOW}⚠️  Le test a échoué, mais cela peut être dû à un problème réseau${NC}"
    echo -e "${YELLOW}   Vérifiez votre connexion internet et réessayez${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Configuration Docker terminée avec succès !${NC}"

