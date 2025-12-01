# Git Commander

Guide d'utilisation de l'outil Git Commander dans DevToolbox.

## Description

Git Commander est une collection de commandes Git avancées avec explications détaillées et exemples d'utilisation. Cet outil vous permet de gérer et organiser vos commandes Git les plus utilisées.

## Fonctionnalités

- **Collection de commandes** : Accédez rapidement à vos commandes Git favorites
- **Catégorisation** : Organisez vos commandes par catégories (Basics, Branching, Merging, etc.)
- **Recherche** : Trouvez rapidement une commande avec la barre de recherche
- **Favoris** : Marquez vos commandes les plus utilisées
- **Édition** : Ajoutez, modifiez ou supprimez des commandes
- **Exemples** : Chaque commande inclut des exemples d'utilisation

## Utilisation

### Accéder à Git Commander

1. Depuis la page d'accueil, cliquez sur "Git Commander"
2. Ou accédez directement à `/tools/git-commander`

### Rechercher une commande

Utilisez la barre de recherche en haut pour filtrer les commandes par :
- Nom de la commande
- Description
- Catégorie
- Tags

### Ajouter une commande

1. Cliquez sur le bouton "Ajouter une commande"
2. Remplissez le formulaire :
   - **Commande** : La commande Git (ex: `git status`)
   - **Description** : Description de ce que fait la commande
   - **Catégorie** : Choisissez une catégorie existante ou créez-en une
   - **Tags** : Ajoutez des tags pour faciliter la recherche
   - **Exemple** : Ajoutez un exemple d'utilisation
3. Cliquez sur "Enregistrer"

### Modifier une commande

1. Cliquez sur une commande pour l'ouvrir
2. Cliquez sur le bouton "Modifier"
3. Modifiez les champs nécessaires
4. Cliquez sur "Enregistrer"

### Supprimer une commande

1. Ouvrez la commande
2. Cliquez sur le bouton "Supprimer"
3. Confirmez la suppression

### Marquer en favori

Cliquez sur l'icône étoile sur une carte de commande pour la marquer en favori. Les favoris apparaissent en premier dans la liste.

## Catégories courantes

- **Basics** : Commandes de base (status, add, commit, etc.)
- **Branching** : Gestion des branches
- **Merging** : Fusion de branches
- **Remote** : Gestion des dépôts distants
- **History** : Consultation de l'historique
- **Stash** : Gestion du stash
- **Reset** : Commandes de réinitialisation
- **Advanced** : Commandes avancées

## Exemples de commandes

### Commandes de base

```bash
# Vérifier le statut
git status

# Ajouter des fichiers
git add .

# Créer un commit
git commit -m "Message du commit"

# Voir l'historique
git log
```

### Gestion des branches

```bash
# Créer une branche
git branch ma-branche

# Changer de branche
git checkout ma-branche

# Créer et changer de branche
git checkout -b ma-branche

# Supprimer une branche
git branch -d ma-branche
```

### Fusion

```bash
# Fusionner une branche
git merge ma-branche

# Fusionner avec rebase
git rebase ma-branche
```

## API Backend

Les commandes Git sont gérées via l'API backend :

- `GET /api/git` - Liste toutes les commandes
- `POST /api/git` - Crée une commande
- `PUT /api/git/:id` - Met à jour une commande
- `DELETE /api/git/:id` - Supprime une commande

Pour plus de détails, consultez la [Référence API](API-Reference#commandes-git).

## Astuces

1. **Utilisez les tags** : Ajoutez des tags pertinents pour faciliter la recherche
2. **Organisez par catégories** : Créez des catégories logiques pour vos commandes
3. **Ajoutez des exemples** : Les exemples aident à comprendre l'utilisation de chaque commande
4. **Marquez en favori** : Gardez vos commandes les plus utilisées en favori

## Support

Pour toute question :

1. Consultez la [documentation Git officielle](https://git-scm.com/doc)
2. Consultez le [Guide de dépannage](Troubleshooting)
3. Ouvrez une issue sur GitHub

---

*Dernière mise à jour : 2024*

