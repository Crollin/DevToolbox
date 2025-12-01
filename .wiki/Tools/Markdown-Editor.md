# Markdown Editor

Guide d'utilisation de l'éditeur Markdown dans DevToolbox.

## Description

L'éditeur Markdown est un éditeur WYSIWYG avec prévisualisation en temps réel et export. Écrivez, formatez et exportez vos documents Markdown facilement.

## Fonctionnalités

- **Éditeur WYSIWYG** : Interface intuitive pour écrire du Markdown
- **Prévisualisation en temps réel** : Voyez le rendu pendant que vous écrivez
- **Syntaxe Markdown** : Support complet de la syntaxe Markdown
- **Export** : Exportez en Markdown, HTML, PDF
- **Sauvegarde** : Sauvegardez vos documents (localStorage)

## Utilisation

### Accéder à l'éditeur

1. Depuis la page d'accueil, cliquez sur "Markdown Editor"
2. Ou accédez directement à `/tools/markdown-editor`

### Écrire du Markdown

Utilisez la syntaxe Markdown standard :

```markdown
# Titre 1
## Titre 2
### Titre 3

**Gras** et *Italique*

- Liste à puces
- Item 2

1. Liste numérotée
2. Item 2

[Lien](https://example.com)

![Image](image.jpg)

`Code inline`

```code
Bloc de code
```
```

### Prévisualisation

La prévisualisation se met à jour en temps réel pendant que vous écrivez. Vous pouvez :
- Voir le rendu HTML
- Vérifier le formatage
- Tester les liens et images

### Export

1. Cliquez sur "Exporter"
2. Choisissez le format :
   - **Markdown** : Fichier .md
   - **HTML** : Fichier .html
   - **PDF** : Fichier .pdf (si disponible)

### Sauvegarder

Vos documents sont automatiquement sauvegardés dans le localStorage du navigateur. Pour une sauvegarde permanente, exportez vos documents.

## Syntaxe Markdown

### Titres

```markdown
# Titre 1
## Titre 2
### Titre 3
```

### Formatage

```markdown
**Gras**
*Italique*
~~Barré~~
`Code`
```

### Listes

```markdown
- Liste à puces
- Item 2

1. Liste numérotée
2. Item 2
```

### Liens et images

```markdown
[Texte du lien](https://example.com)
![Texte alternatif](image.jpg)
```

### Code

```markdown
`Code inline`

```langage
Bloc de code
```
```

### Citations

```markdown
> Citation
> Sur plusieurs lignes
```

### Tableaux

```markdown
| Colonne 1 | Colonne 2 |
|-----------|-----------|
| Cellule 1 | Cellule 2 |
```

## Fonctionnalités avancées

### Raccourcis clavier

- **Ctrl+B** : Gras
- **Ctrl+I** : Italique
- **Ctrl+K** : Lien
- **Ctrl+Shift+P** : Prévisualisation

### Barre d'outils

La barre d'outils permet d'insérer rapidement :
- Titres
- Formatage (gras, italique)
- Listes
- Liens
- Images
- Code

## Astuces

1. **Prévisualisation** : Utilisez la prévisualisation pour vérifier le rendu
2. **Export** : Exportez régulièrement vos documents
3. **Syntaxe** : Apprenez la syntaxe Markdown pour une écriture plus rapide
4. **Raccourcis** : Utilisez les raccourcis clavier pour gagner du temps

## Limitations

- **Sauvegarde** : Les documents sont sauvegardés dans le localStorage (limité par le navigateur)
- **PDF** : L'export PDF peut ne pas être disponible selon le navigateur
- **Images** : Les images doivent être accessibles via URL

## Support

Pour toute question :

1. Consultez la [documentation Markdown](https://www.markdownguide.org/)
2. Consultez le [Guide de dépannage](Troubleshooting)
3. Ouvrez une issue sur GitHub

---

*Dernière mise à jour : 2024*

