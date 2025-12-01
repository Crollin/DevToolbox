# CSV Preview Pro

Guide d'utilisation de l'outil CSV Preview Pro dans DevToolbox.

## Description

CSV Preview Pro est un outil de visualisation et manipulation avancée de fichiers CSV avec prévisualisation en temps réel. Analysez, filtrez et exportez vos données CSV facilement.

## Fonctionnalités

- **Prévisualisation** : Visualisez vos fichiers CSV en tableau
- **Filtrage** : Filtrez les données par colonnes
- **Tri** : Triez les données par colonnes
- **Recherche** : Recherchez dans les données
- **Export** : Exportez en CSV, Excel, JSON
- **Statistiques** : Affichez des statistiques sur les données

## Utilisation

### Accéder à l'outil

1. Depuis la page d'accueil, cliquez sur "CSV Preview Pro"
2. Ou accédez directement à `/tools/csv-preview-pro`

### Charger un fichier CSV

1. Cliquez sur "Choisir un fichier" ou glissez-déposez un fichier CSV
2. Le fichier sera analysé et affiché dans un tableau
3. Les colonnes seront détectées automatiquement

### Prévisualisation

Le tableau affiche :
- **En-têtes** : Noms des colonnes
- **Données** : Données du CSV
- **Pagination** : Navigation entre les pages
- **Statistiques** : Nombre de lignes, colonnes

### Filtrer les données

1. Utilisez les filtres en haut de chaque colonne
2. Entrez des valeurs pour filtrer
3. Les données seront filtrées en temps réel

### Trier les données

1. Cliquez sur l'en-tête d'une colonne pour trier
2. Cliquez à nouveau pour inverser l'ordre
3. Le tri est appliqué immédiatement

### Rechercher

1. Utilisez la barre de recherche
2. Entrez votre terme de recherche
3. Les résultats correspondants seront mis en surbrillance

### Export

1. Cliquez sur "Exporter"
2. Choisissez le format :
   - **CSV** : Fichier CSV
   - **Excel** : Fichier .xlsx
   - **JSON** : Fichier JSON

## Formats supportés

- **CSV** : Fichiers CSV standard
- **TSV** : Fichiers TSV (tab-separated values)
- **Encodages** : UTF-8, ISO-8859-1, etc.

## Fonctionnalités avancées

### Statistiques

L'outil affiche :
- **Nombre de lignes** : Total de lignes dans le fichier
- **Nombre de colonnes** : Total de colonnes
- **Colonnes** : Liste des colonnes avec types détectés

### Pagination

- **Taille de page** : Ajustez le nombre de lignes par page
- **Navigation** : Utilisez les boutons précédent/suivant
- **Aller à la page** : Accédez directement à une page

### Tri multiple

- Triez par plusieurs colonnes
- L'ordre de tri est indiqué visuellement

## Formats d'export

### CSV

```csv
Nom,Email,Age
John,john@example.com,30
Jane,jane@example.com,25
```

### Excel

Fichier .xlsx avec formatage et formules si applicable.

### JSON

```json
[
  {
    "Nom": "John",
    "Email": "john@example.com",
    "Age": "30"
  },
  {
    "Nom": "Jane",
    "Email": "jane@example.com",
    "Age": "25"
  }
]
```

## Astuces

1. **Encodage** : Assurez-vous que votre CSV est en UTF-8 pour les caractères spéciaux
2. **Séparateurs** : Les séparateurs sont détectés automatiquement (virgule, point-virgule, tabulation)
3. **Grands fichiers** : Les très grands fichiers peuvent prendre du temps à charger
4. **Filtres** : Utilisez les filtres pour analyser des sous-ensembles de données

## Limitations

- **Taille** : Les très grands fichiers (>100MB) peuvent être lents à charger
- **Mémoire** : Dépend des limites du navigateur
- **Formats** : Seuls les formats CSV/TSV sont supportés

## Support

Pour toute question :

1. Consultez le [Guide de dépannage](Troubleshooting)
2. Ouvrez une issue sur GitHub

---

*Dernière mise à jour : 2024*

