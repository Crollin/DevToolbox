#!/bin/bash

# Script de vérification pour le build Docker
# Vérifie que toutes les dépendances sont présentes avant le build

set -e

echo "🔍 Vérification des prérequis pour le build Docker..."

# Vérifier que package.json contient browser-image-compression
if grep -q "browser-image-compression" package.json; then
    echo "✅ browser-image-compression trouvé dans package.json"
else
    echo "❌ ERREUR: browser-image-compression manquant dans package.json"
    exit 1
fi

# Vérifier que package-lock.json existe
if [ -f "package-lock.json" ]; then
    echo "✅ package-lock.json trouvé"
else
    echo "⚠️  AVERTISSEMENT: package-lock.json manquant. Exécutez 'npm install' pour le générer."
fi

# Vérifier que tous les fichiers nécessaires existent
REQUIRED_FILES=(
    "Dockerfile"
    "docker/nginx.conf"
    "package.json"
    "vite.config.ts"
    "src/pages/tools/ImageResizer.tsx"
    "src/hooks/useImageResizer.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file trouvé"
    else
        echo "❌ ERREUR: $file manquant"
        exit 1
    fi
done

echo ""
echo "✅ Toutes les vérifications sont passées !"
echo "🚀 Prêt pour le build Docker : docker-compose build frontend"


