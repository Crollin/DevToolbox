#!/bin/bash
# Script de mise à jour Git pour DevToolbox
# Gère automatiquement les conflits avec les fichiers locaux (BDD, etc.)

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Mise à jour de DevToolbox${NC}"
echo ""

# Vérifier que nous sommes dans un dépôt Git
if [ ! -d .git ]; then
    echo -e "${RED}❌ Erreur : Ce script doit être exécuté depuis la racine du dépôt Git${NC}"
    exit 1
fi

# Sauvegarder la base de données avant mise à jour (si elle existe)
if [ -f "data/devtoolbox.db" ]; then
    echo -e "${YELLOW}💾 Sauvegarde de la base de données...${NC}"
    BACKUP_FILE="data/devtoolbox.db.backup.$(date +%Y%m%d_%H%M%S)"
    cp data/devtoolbox.db "$BACKUP_FILE"
    echo -e "${GREEN}✓ Base de données sauvegardée : $BACKUP_FILE${NC}"
fi

# Sauvegarder les modifications locales
echo -e "${YELLOW}📦 Sauvegarde des modifications locales...${NC}"
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${GREEN}✓ Aucune modification locale à sauvegarder${NC}"
    STASHED=false
else
    git stash push -m "Modifications locales avant pull - $(date +%Y-%m-%d_%H:%M:%S)"
    echo -e "${GREEN}✓ Modifications locales sauvegardées (stash)${NC}"
    STASHED=true
fi

# Retirer les fichiers ignorés du suivi Git (au cas où ils seraient encore trackés)
echo -e "${YELLOW}🧹 Nettoyage des fichiers ignorés du suivi Git...${NC}"
git rm -r --cached data/*.db 2>/dev/null || true
git rm -r --cached data/*.backup 2>/dev/null || true
git rm -r --cached data/*.bak 2>/dev/null || true
echo -e "${GREEN}✓ Fichiers ignorés retirés du suivi${NC}"

# Récupérer les modifications distantes
echo -e "${YELLOW}⬇️  Récupération des modifications distantes...${NC}"
# Détecter la branche actuelle (compatible avec toutes les versions de Git)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ -z "$BRANCH" ] || [ "$BRANCH" = "HEAD" ]; then
    # Fallback si on est en état détaché
    BRANCH=$(git branch | grep '^\*' | sed 's/^\* //')
fi
echo "Branche actuelle : $BRANCH"

# Faire le pull
if git pull origin "$BRANCH"; then
    echo -e "${GREEN}✓ Pull réussi${NC}"
else
    echo -e "${RED}❌ Erreur lors du pull${NC}"
    if [ "$STASHED" = true ]; then
        echo -e "${YELLOW}Récupération des modifications locales...${NC}"
        git stash pop || true
    fi
    exit 1
fi

# Récupérer les modifications locales si elles ont été stashées
if [ "$STASHED" = true ]; then
    echo -e "${YELLOW}🔄 Récupération des modifications locales...${NC}"
    if git stash pop; then
        echo -e "${GREEN}✓ Modifications locales récupérées${NC}"
        echo -e "${YELLOW}⚠️  Vérifiez les conflits éventuels avec : git status${NC}"
    else
        echo -e "${YELLOW}⚠️  Conflits détectés lors de la récupération des modifications locales${NC}"
        echo -e "${YELLOW}   Résolvez les conflits manuellement, puis :${NC}"
        echo -e "${YELLOW}   git add . && git commit${NC}"
    fi
fi

# Nettoyer les anciennes images Docker (optionnel)
echo ""
read -p "Voulez-vous nettoyer les anciennes images Docker non utilisées ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🧹 Nettoyage des images Docker...${NC}"
    docker image prune -f
    echo -e "${GREEN}✓ Nettoyage terminé${NC}"
fi

echo ""
echo -e "${GREEN}✅ Mise à jour terminée avec succès !${NC}"
echo ""
echo "📝 Prochaines étapes :"
echo "   1. Vérifiez l'état : git status"
echo "   2. Si des conflits : résolvez-les puis git add . && git commit"
echo "   3. Rebuild les containers si nécessaire : docker-compose up -d --build"

