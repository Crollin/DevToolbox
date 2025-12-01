# Image Resizer

Guide d'utilisation de l'outil Image Resizer dans DevToolbox.

## Description

Image Resizer est un outil complet de redimensionnement et d'optimisation d'images pour WordPress. Il fonctionne entièrement côté client, sans nécessiter de backend, et supporte tous les formats d'images courants.

## Fonctionnalités

- **Présets WordPress** : Présets optimisés pour WordPress (Hero, Banner, Container, etc.)
- **Redimensionnement manuel** : Dimensions personnalisables avec conservation du ratio d'aspect
- **Conversion WebP** : Export optimisé avec qualité ajustable (50-100%)
- **Prévisualisation** : Comparaison avant/après avec statistiques détaillées
- **Traitement côté client** : Aucun backend requis, traitement dans le navigateur
- **Support multi-formats** : JPG, PNG, GIF, WebP, SVG

## Utilisation

### Accéder à l'outil

1. Depuis la page d'accueil, cliquez sur "Image Resizer"
2. Ou accédez directement à `/tools/image-resizer`

### Charger une image

1. Cliquez sur "Choisir une image" ou glissez-déposez une image
2. L'image sera chargée et affichée dans l'éditeur

### Utiliser un préset WordPress

1. Sélectionnez un préset dans la liste :
   - **Hero** : 1920x1080px
   - **Banner** : 1200x630px (Open Graph)
   - **Container** : 1200x800px
   - **Thumbnail** : 150x150px
   - **Medium** : 300x300px
   - **Large** : 1024x1024px
   - **Full** : Taille originale
2. L'image sera redimensionnée automatiquement
3. Cliquez sur "Exporter" pour télécharger

### Redimensionnement manuel

1. Entrez les dimensions souhaitées (largeur et hauteur)
2. Cochez "Conserver le ratio" pour maintenir les proportions
3. L'image sera redimensionnée en temps réel
4. Cliquez sur "Exporter" pour télécharger

### Conversion WebP

1. Cochez "Convertir en WebP"
2. Ajustez la qualité (50-100%, défaut: 75%)
3. L'image sera convertie en WebP
4. Cliquez sur "Exporter" pour télécharger

### Prévisualisation

L'outil affiche :
- **Image originale** : Dimensions, taille du fichier
- **Image redimensionnée** : Nouvelles dimensions, nouvelle taille
- **Gain** : Réduction de taille en pourcentage
- **Statistiques** : Comparaison détaillée

## Présets WordPress

| Préset | Dimensions | Usage |
|--------|-----------|-------|
| Hero | 1920x1080px | Images hero en plein écran |
| Banner | 1200x630px | Images Open Graph / Social |
| Container | 1200x800px | Images dans le contenu |
| Thumbnail | 150x150px | Miniatures |
| Medium | 300x300px | Images moyennes |
| Large | 1024x1024px | Grandes images |
| Full | Original | Taille originale |

## Formats supportés

- **JPG/JPEG** : Images photos
- **PNG** : Images avec transparence
- **GIF** : Images animées (première frame)
- **WebP** : Format moderne optimisé
- **SVG** : Vecteurs (affichage uniquement, pas de redimensionnement)

## Qualité WebP

La qualité WebP peut être ajustée de 50% à 100% :

- **50-60%** : Très compressé, petite taille
- **70-80%** : Bon compromis (recommandé)
- **90-100%** : Haute qualité, taille plus grande

## Statistiques

L'outil affiche :
- **Dimensions originales** : Largeur x Hauteur
- **Dimensions finales** : Largeur x Hauteur
- **Taille originale** : Taille du fichier en KB/MB
- **Taille finale** : Taille du fichier en KB/MB
- **Gain** : Pourcentage de réduction
- **Ratio d'aspect** : Ratio largeur/hauteur

## Astuces

1. **Présets WordPress** : Utilisez les présets pour des dimensions standardisées
2. **Qualité WebP** : 75% est généralement un bon compromis
3. **Ratio d'aspect** : Conservez le ratio pour éviter la déformation
4. **Taille** : Vérifiez la taille finale pour l'optimisation
5. **Formats** : Utilisez WebP pour une meilleure compression

## Limitations

- **SVG** : Les SVG ne peuvent pas être redimensionnés (affichage uniquement)
- **GIF animés** : Seule la première frame est traitée
- **Taille maximale** : Dépend des limites du navigateur (généralement plusieurs MB)

## Support

Pour toute question :

1. Consultez le [Guide de dépannage](Troubleshooting)
2. Ouvrez une issue sur GitHub

---

*Dernière mise à jour : 2024*

