# Stage 1: Build
FROM node:20-alpine AS builder

LABEL maintainer="DevToolbox"
LABEL description="DevToolbox Backend - Build Stage"

WORKDIR /app

# Copier les fichiers de configuration pour optimiser le cache
COPY package*.json tsconfig.json ./

# Installer les dépendances
# Utiliser npm ci si package-lock.json existe, sinon npm install
RUN npm ci 2>/dev/null || npm install

# Copier le code source
COPY src ./src

# Builder l'application
RUN npm run build

# Stage 2: Production avec utilisateur non-root
FROM node:20-alpine

LABEL maintainer="DevToolbox"
LABEL description="DevToolbox Backend - Production"
LABEL version="1.0"

# Installer wget pour le healthcheck
RUN apk add --no-cache wget

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./

# Installer seulement les dépendances de production
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev && \
    chown -R nodejs:nodejs /app

# Copier les fichiers compilés avec les bonnes permissions
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Créer le dossier pour la base de données avec les bonnes permissions
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app/data

# Passer à l'utilisateur non-root
USER nodejs

# Exposer le port
EXPOSE 1400

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Commande de démarrage
CMD ["node", "dist/index.js"]

