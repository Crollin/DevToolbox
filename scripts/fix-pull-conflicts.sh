#!/bin/bash
# Corrige les conflits lors d'un git pull quand des fichiers locaux
# ou non suivis seraient écrasés (README.md, docker/*, scripts/*).
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

BACKUP_DIR=".backup-pull-$(date +%Y%m%d-%H%M%S)"
FILES_MODIFIED="README.md docker/README-DEPLOY.md scripts/docker-build.sh"
FILES_UNTRACKED="docker/SETUP-REMOTE.md scripts/setup-docker-remote.sh"

echo -e "${YELLOW}1. Sauvegarde des modifications locales (stash)...${NC}"
if git diff --quiet README.md docker/README-DEPLOY.md scripts/docker-build.sh 2>/dev/null && git diff --cached --quiet -- README.md docker/README-DEPLOY.md scripts/docker-build.sh 2>/dev/null; then
    STASHED=false
    echo -e "${GREEN}   Aucune modification sur README.md, docker/README-DEPLOY.md, scripts/docker-build.sh${NC}"
else
    git stash push -m "fix-pull: sauvegarde avant pull" -- $FILES_MODIFIED
    STASHED=true
    echo -e "${GREEN}   Modifications sauvegardées dans le stash${NC}"
fi

echo -e "${YELLOW}2. Sauvegarde des fichiers non suivis qui bloquent le pull...${NC}"
mkdir -p "$BACKUP_DIR"
for f in $FILES_UNTRACKED; do
    # Fichier existe et est non suivi (??) ou serait écrasé par le merge
    if [ -f "$f" ]; then
        if git status --porcelain "$f" | grep -q '^??'; then
            cp "$f" "$BACKUP_DIR/$(basename "$f")" 2>/dev/null || true
            rm -f "$f"
            echo -e "${GREEN}   $f sauvegardé dans $BACKUP_DIR/${NC}"
        fi
    fi
done

echo -e "${YELLOW}3. Pull origin main...${NC}"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if git pull origin "${BRANCH:-main}"; then
    echo -e "${GREEN}   Pull réussi${NC}"
else
    echo -e "${RED}   Échec du pull. Rétablissement...${NC}"
    [ "$STASHED" = true ] && git stash pop || true
    [ -d "$BACKUP_DIR" ] && for f in $FILES_UNTRACKED; do [ -f "$BACKUP_DIR/$(basename "$f")" ] && cp "$BACKUP_DIR/$(basename "$f")" "$f"; done || true
    exit 1
fi

echo -e "${YELLOW}4. Récupération des modifications locales (stash pop)...${NC}"
if [ "$STASHED" = true ]; then
    if git stash pop; then
        echo -e "${GREEN}   Modifications récupérées${NC}"
    else
        echo -e "${YELLOW}   Conflits après stash pop. Résolvez-les puis : git add . && git commit${NC}"
    fi
fi

if [ -d "$BACKUP_DIR" ] && [ -n "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
    echo ""
    echo -e "${YELLOW}   Fichiers sauvegardés dans $BACKUP_DIR/${NC}"
    echo "   Si vous aviez des modifications dans SETUP-REMOTE.md ou setup-docker-remote.sh,"
    echo "   comparez avec les versions du dépôt et fusionnez si besoin, puis : rm -rf $BACKUP_DIR"
fi

echo ""
echo -e "${GREEN}Terminé. Vérifiez avec : git status${NC}"
