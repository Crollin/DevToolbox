# Docker Commander

Guide d'utilisation de l'outil Docker Commander dans DevToolbox.

## Description

Docker Commander est un glossaire complet des commandes Docker avec exemples pratiques et bonnes pratiques. Cet outil vous permet de gérer et organiser vos commandes Docker les plus utilisées.

## Fonctionnalités

- **Collection de commandes** : Accédez rapidement à vos commandes Docker favorites
- **Catégorisation** : Organisez vos commandes par catégories (Containers, Images, Networks, etc.)
- **Recherche** : Trouvez rapidement une commande avec la barre de recherche
- **Favoris** : Marquez vos commandes les plus utilisées
- **Édition** : Ajoutez, modifiez ou supprimez des commandes
- **Exemples** : Chaque commande inclut des exemples d'utilisation

## Utilisation

### Accéder à Docker Commander

1. Depuis la page d'accueil, cliquez sur "Docker Commander"
2. Ou accédez directement à `/tools/docker-commander`

### Rechercher une commande

Utilisez la barre de recherche en haut pour filtrer les commandes par :
- Nom de la commande
- Description
- Catégorie
- Tags

### Ajouter une commande

1. Cliquez sur le bouton "Ajouter une commande"
2. Remplissez le formulaire :
   - **Commande** : La commande Docker (ex: `docker ps`)
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

- **Containers** : Gestion des conteneurs
- **Images** : Gestion des images
- **Networks** : Gestion des réseaux
- **Volumes** : Gestion des volumes
- **Compose** : Commandes Docker Compose
- **Build** : Construction d'images
- **Logs** : Consultation des logs
- **Advanced** : Commandes avancées

## Exemples de commandes

### Gestion des conteneurs

```bash
# Lister les conteneurs en cours d'exécution
docker ps

# Lister tous les conteneurs
docker ps -a

# Démarrer un conteneur
docker start mon-conteneur

# Arrêter un conteneur
docker stop mon-conteneur

# Supprimer un conteneur
docker rm mon-conteneur
```

### Gestion des images

```bash
# Lister les images
docker images

# Construire une image
docker build -t mon-image .

# Supprimer une image
docker rmi mon-image

# Télécharger une image
docker pull nginx
```

### Docker Compose

```bash
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Voir les logs
docker-compose logs -f

# Rebuild
docker-compose up -d --build
```

## API Backend

Les commandes Docker sont gérées via l'API backend :

- `GET /api/docker` - Liste toutes les commandes
- `POST /api/docker` - Crée une commande
- `PUT /api/docker/:id` - Met à jour une commande
- `DELETE /api/docker/:id` - Supprime une commande

Pour plus de détails, consultez la [Référence API](API-Reference#commandes-docker).

## Astuces

1. **Utilisez les tags** : Ajoutez des tags pertinents pour faciliter la recherche
2. **Organisez par catégories** : Créez des catégories logiques pour vos commandes
3. **Ajoutez des exemples** : Les exemples aident à comprendre l'utilisation de chaque commande
4. **Marquez en favori** : Gardez vos commandes les plus utilisées en favori

## Ressources

- [Documentation Docker officielle](https://docs.docker.com/)
- [Guide Docker de DevToolbox](Docker-Guide)

## Support

Pour toute question :

1. Consultez la [documentation Docker officielle](https://docs.docker.com/)
2. Consultez le [Guide Docker](Docker-Guide)
3. Consultez le [Guide de dépannage](Troubleshooting)
4. Ouvrez une issue sur GitHub

---

*Dernière mise à jour : 2024*

