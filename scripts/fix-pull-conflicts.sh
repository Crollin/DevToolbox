#!/bin/bash
# Corrige les conflits lors d'un git pull : stash toutes les modifications
# locales ET les fichiers non suivis, pull, puis récupère le stash.
# Usage : depuis la racine du dépôt : ./scripts/fix-pull-conflicts.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ ! -d .git ]; then
    echo -e "${RED}Erreur : exécutez ce script depuis la racine du dépôt DevToolbox.${NC}"
    exit 1
fi

echo -e "${YELLOW}1. Sauvegarde de TOUTES les modifications (trackées + non suivies) dans le stash...${NC}"
if git diff --quiet && git diff --cached --quiet && [ -z "$(git status --porcelain -u)" ]; then
    echo -e "${GREEN}   Aucune modification locale. Pull direct.${NC}"
    STASHED=false
else
    git stash push --include-untracked -m "fix-pull: sauvegarde complète avant pull $(date +%Y-%m-%d_%H:%M:%S)"
    STASHED=true
    echo -e "${GREEN}   Tout a été mis dans le stash (modifications + fichiers non suivis)${NC}"
fi

echo -e "${YELLOW}2. Pull origin main...${NC}"
if git pull origin main; then
    echo -e "${GREEN}   Pull réussi${NC}"
else
    echo -e "${RED}   Échec du pull. Rétablissement du stash...${NC}"
    [ "$STASHED" = true ] && git stash pop || true
    exit 1
fi

echo -e "${YELLOW}3. Récupération des modifications (stash pop)...${NC}"
if [ "$STASHED" = true ]; then
    if git stash pop; then
        echo -e "${GREEN}   Modifications récupérées${NC}"
    else
        echo -e "${YELLOW}   Conflits après stash pop.${NC}"
        echo -e "${YELLOW}   Résolvez les conflits dans les fichiers indiqués, puis :${NC}"
        echo -e "${YELLOW}   git add . && git commit -m \"fix: résolution conflits après pull\"${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}Terminé. Vérifiez avec : git status${NC}"
