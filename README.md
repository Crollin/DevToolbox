# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/49a2ec20-d4bd-4db1-bbac-4e2543391366

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/49a2ec20-d4bd-4db1-bbac-4e2543391366) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

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
