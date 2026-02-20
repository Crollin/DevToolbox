# Stage 1: Build avec cache optimisé
FROM node:20-alpine AS builder

LABEL maintainer="DevToolbox"
LABEL description="DevToolbox Frontend - Build Stage"

WORKDIR /app

# Copier tous les fichiers de configuration en une fois pour optimiser le cache
COPY package*.json vite.config.ts tsconfig*.json tailwind.config.ts postcss.config.js components.json ./

# Installer les dépendances (inclut devDependencies pour Vite/TypeScript)
# Coolify injecte NODE_ENV=production à la build → npm omet les devDependencies
# NODE_ENV=development forcé pour garantir l'installation de Vite/TypeScript
RUN NODE_ENV=development npm ci --include=dev 2>/dev/null || NODE_ENV=development npm install --include=dev

# Copier le code source
COPY src ./src
COPY index.html public ./

# Builder l'application (inclut l'outil Image Resizer)
RUN npm run build

# Stage 2: Production avec Nginx
FROM nginx:alpine

LABEL maintainer="DevToolbox"
LABEL description="DevToolbox Frontend - Production"
LABEL version="1.1"

# Nginx utilise déjà l'utilisateur nginx (non-root), s'assurer des permissions correctes
COPY --chown=nginx:nginx docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés avec les bonnes permissions
COPY --chown=nginx:nginx --from=builder /app/dist /usr/share/nginx/html

# Exposer le port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]

