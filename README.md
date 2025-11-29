# DevToolbox — Boîte à outils développeur

## À propos du projet

DevToolbox est une plateforme personnelle développée par **Creactiveweb** pour centraliser, organiser et lancer rapidement tous vos outils de développement web.

Cette application regroupe une collection d'outils pratiques pour les développeurs, incluant :
- Gestionnaire de commandes Git
- Gestionnaire de commandes Docker
- Bibliothèque de snippets de code
- Générateur de palettes de couleurs
- Bibliothèque d'icônes SVG
- Outils WordPress (WP-CLI, scripts)
- Calculateur électrique
- Gestionnaire de clés de licence
- Et bien plus encore...

## Comment éditer ce code ?

Il existe plusieurs façons d'éditer cette application.

### Utiliser votre IDE préféré

Si vous voulez travailler localement avec votre propre IDE, vous pouvez cloner ce dépôt et pousser les changements.

La seule exigence est d'avoir Node.js & npm installés - [installer avec nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Suivez ces étapes :

```sh
# Étape 1 : Cloner le dépôt en utilisant l'URL Git du projet.
git clone <YOUR_GIT_URL>

# Étape 2 : Naviguer vers le répertoire du projet.
cd <YOUR_PROJECT_NAME>

# Étape 3 : Installer les dépendances nécessaires.
npm i

# Étape 4 : Démarrer le serveur de développement avec rechargement automatique et aperçu instantané.
npm run dev
```

### Éditer un fichier directement dans GitHub

- Naviguez vers le fichier souhaité.
- Cliquez sur le bouton "Edit" (icône crayon) en haut à droite de la vue du fichier.
- Effectuez vos modifications et commitez les changements.

### Utiliser GitHub Codespaces

- Naviguez vers la page principale de votre dépôt.
- Cliquez sur le bouton "Code" (bouton vert) près du haut à droite.
- Sélectionnez l'onglet "Codespaces".
- Cliquez sur "New codespace" pour lancer un nouvel environnement Codespace.
- Éditez les fichiers directement dans le Codespace et commitez et poussez vos changements une fois terminé.

## Quelles technologies sont utilisées pour ce projet ?

Ce projet est construit avec :

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Comment déployer ce projet sur Netlify ?

Ce projet est configuré pour être déployé facilement sur [Netlify](https://www.netlify.com/), une plateforme d'hébergement gratuite et performante.

### Prérequis

- Un compte GitHub avec le dépôt du projet
- Un compte Netlify (gratuit)

### Déploiement automatique depuis GitHub

1. **Connecter votre dépôt à Netlify**
   - Connectez-vous à [Netlify](https://app.netlify.com/)
   - Cliquez sur "Add new site" → "Import an existing project"
   - Sélectionnez "GitHub" et autorisez Netlify à accéder à vos dépôts
   - Choisissez votre dépôt `DevToolbox`

2. **Configuration du build**
   - Netlify détectera automatiquement les paramètres depuis `netlify.toml` :
     - **Build command** : `npm run build`
     - **Publish directory** : `dist`
   - Si nécessaire, vérifiez que ces paramètres sont corrects dans les paramètres du site

3. **Déploiement**
   - Cliquez sur "Deploy site"
   - Netlify va automatiquement :
     - Installer les dépendances (`npm install`)
     - Construire le projet (`npm run build`)
     - Déployer les fichiers statiques
   - Votre site sera disponible sur une URL Netlify (ex: `votre-site.netlify.app`)

4. **Déploiements automatiques**
   - Chaque push sur la branche `main` déclenchera automatiquement un nouveau déploiement
   - Les pull requests génèrent des "Deploy previews" pour tester les changements

### Configuration d'un domaine personnalisé

1. **Dans Netlify**
   - Allez dans **Site settings** → **Domain management**
   - Cliquez sur **Add custom domain**
   - Entrez votre nom de domaine (ex: `devtoolbox.example.com`)

2. **Configuration DNS**
   - Netlify vous fournira les enregistrements DNS à configurer
   - Ajoutez-les dans votre gestionnaire de DNS (chez votre registrar ou votre hébergeur DNS)
   - Types d'enregistrements courants :
     - **A record** : Point vers l'IP Netlify
     - **CNAME** : Point vers `votre-site.netlify.app`

3. **SSL automatique**
   - Netlify génère automatiquement un certificat SSL (HTTPS) via Let's Encrypt
   - Le certificat est renouvelé automatiquement
   - Votre site sera accessible en HTTPS après la configuration DNS

### Commandes utiles

```sh
# Build local pour tester
npm run build

# Prévisualiser le build localement
npm run preview

# Vérifier la configuration Netlify
# Le fichier netlify.toml contient toute la configuration nécessaire
```

### Fichiers de configuration

- `netlify.toml` : Configuration principale (build, redirections)
- `public/_redirects` : Redirections pour le routing React (SPA)

### Support du routing React

Le projet utilise React Router avec `BrowserRouter`. Les fichiers de configuration Netlify sont déjà configurés pour rediriger toutes les routes vers `index.html`, permettant au routing côté client de fonctionner correctement.

### Alternatives de déploiement

Si vous préférez utiliser une autre plateforme :
- **Vercel** : Similaire à Netlify, excellent pour les projets React
- **GitHub Pages** : Gratuit mais nécessite une configuration supplémentaire pour le routing SPA

## Développé par Creactiveweb

Ce projet est développé et maintenu par **Creactiveweb**.
