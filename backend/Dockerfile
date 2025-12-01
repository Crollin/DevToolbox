FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig.json ./

# Installer les dépendances
# Utiliser npm install car package-lock.json peut ne pas exister
RUN npm install --frozen-lockfile 2>/dev/null || npm install

# Copier le code source
COPY src ./src

# Builder l'application
RUN npm run build

# Image de production
FROM node:20-alpine

WORKDIR /app

# Installer seulement les dépendances de production
COPY package*.json ./
# Utiliser npm install car package-lock.json peut ne pas exister
RUN npm install --frozen-lockfile --omit=dev 2>/dev/null || npm install --omit=dev

# Copier les fichiers compilés
COPY --from=builder /app/dist ./dist

# Créer le dossier pour la base de données
RUN mkdir -p /app/data

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["node", "dist/index.js"]

