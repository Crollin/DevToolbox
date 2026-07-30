# Task Reminder — Pièces jointes (design)

Date: 2026-07-30  
Statut: Approuvé (brainstorming)

## Objectif

Permettre d’ajouter des pièces jointes aux tâches Task Reminder, avec prévisualisation rapide (images, PDF, etc.) et une UX responsive : sheet mobile OK, lightbox large sur desktop.

## Décisions produit

| Sujet | Décision |
|-------|----------|
| Types de fichiers | Tous types. Preview riche pour images + PDF ; sinon icône + téléchargement |
| Stockage | Disque local + métadonnées SQLite (aligné DevToolbox actuel, pas Postgres) |
| Preview desktop | Lightbox / Dialog ~90 % viewport, overlay sombre, Esc pour fermer |
| Preview mobile | Miniature / liste dans le sheet latéral existant ; clic ouvre aussi la lightbox |
| Où gérer les PJ | Modal création/édition **et** sheet détail |
| Limites V1 | 10 Mo / fichier, max 10 PJ par tâche |
| Rappels email | Pas de PJ dans les emails (YAGNI V1) |

## Architecture

### Données

Table `task_attachments` :

- `id` TEXT PK
- `task_id` TEXT NOT NULL → `tasks(id)` ON DELETE CASCADE
- `user_id` TEXT NOT NULL → `users(id)` ON DELETE CASCADE
- `original_filename` TEXT NOT NULL
- `stored_filename` TEXT NOT NULL
- `mime_type` TEXT NOT NULL
- `size_bytes` INTEGER NOT NULL
- `created_at` TEXT NOT NULL

Fichiers sur disque : `data/uploads/tasks/{user_id}/{task_id}/{stored_filename}`  
(`data/` déjà gitignoré.)

### API (auth `tasks` requise)

- `GET /api/tasks/:taskId/attachments` — liste
- `POST /api/tasks/:taskId/attachments` — upload multipart champ `file`
- `GET /api/tasks/:taskId/attachments/:attachmentId` — stream (inline preview / download via `?download=1`)
- `DELETE /api/tasks/:taskId/attachments/:attachmentId` — supprime fichier + ligne

Toujours vérifier que la tâche appartient à l’utilisateur authentifié.

À la suppression d’une tâche : CASCADE SQL + nettoyage disque du dossier tâche (défense en profondeur).

### Flux création avec PJ

1. L’utilisateur sélectionne des fichiers dans le modal (état local, pas encore uploadés).
2. À la sauvegarde : créer la tâche, puis uploader chaque fichier.
3. En édition / détail : upload immédiat vers la tâche existante.

### Frontend

- Types `TaskAttachment` + helpers API (FormData, pas JSON Content-Type).
- Composant liste + zone d’ajout (drag-drop optionnel si simple).
- `AttachmentLightbox` : Dialog large ; `<img>` pour images ; `<iframe>`/`<object>` pour PDF ; fallback icône + bouton télécharger pour le reste.
- Intégration dans `TaskModal` et `TaskDetailSheet`.

## Hors scope V1

- Stockage objet (S3/R2)
- OCR / miniatures serveur
- PJ dans emails/ntfy/telegram
- Partage public de fichiers
- Versioning de fichiers

## Critères de succès

- Ajouter / lister / prévisualiser / télécharger / supprimer des PJ sur une tâche
- Respect des limites 10 Mo / 10 fichiers
- Preview images + PDF dans lightbox desktop
- Autres types : icône + téléchargement
- Isolation par utilisateur (pas d’accès cross-user)
