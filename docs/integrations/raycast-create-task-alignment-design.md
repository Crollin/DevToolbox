# Alignement Raycast Create Task ↔ Task Reminder — Design

Date: 2026-09-10  
Status: approved (brainstorming)

## Goal

Aligner la commande Raycast **Create Task** sur le modal web Task Reminder (parité fonctionnelle des champs de création), **sans** pièces jointes et **sans** wizard 2 étapes.

## Decisions

| Topic | Choice |
| --- | --- |
| Scope UX | Approche formulaire plat Raycast (une Form scrollable) |
| Parité champs | Titre, description, date, priorité, client (+ création), tags, lien, canaux, rappels (7/3/1/0 + datetime) |
| Pièces jointes | Hors scope |
| Wizard 2 étapes / Markdown preview / couleurs client | Hors scope |
| Canaux par défaut | Préremplir comme le web ; nouvel endpoint sous scope `tasks` (PAT Raycast n’a pas accès à `/account/*`) |
| Si aucune case canal cochée | Envoyer `notificationChannels: undefined` (backend / compte) |
| Format `dueDate` | `YYYY-MM-DD` (DatePicker Raycast) |

## Architecture

```
Raycast Create Task
  ├─ GET  /api/tasks/clients/list          (existant, scope tasks)
  ├─ GET  /api/tasks/notification-defaults (nouveau, scope tasks)
  ├─ POST /api/tasks/clients               (existant, si nouveau client)
  └─ POST /api/tasks                       (existant)
```

`GET /api/tasks/notification-defaults` retourne `{ notificationChannels: Array<'ntfy'|'email'|'telegram'> }` via `getOrCreateNtfyConfig(userId)` (même source que `/account/ntfy-config` et l’alias licences). Auth : `authenticateTokenOrPersonalAccessToken('tasks')` déjà appliqué au router tasks.

## Components

### Backend — `backend/src/routes/tasks.ts`

- Ajouter `GET /notification-defaults` **avant** les routes `/:id` pour éviter le collision de param.
- Réponse minimale : canaux uniquement (pas besoin d’exposer topic/token ntfy au client Raycast).
- Test unitaire éventuel : route accessible avec auth tasks, shape de réponse.

### Raycast — `raycast/src/task-api.ts`

- Étendre `Task` / `TaskInput` si besoin (`reminderDays` déjà présent).
- Ajouter `getNotificationDefaults()` → `GET /tasks/notification-defaults`.

### Raycast — `raycast/src/create-task.tsx`

Ordre des champs :

1. Titre (requis, autofocus)
2. Description (TextArea)
3. Date d’échéance (DatePicker Date, défaut demain)
4. Priorité (Dropdown)
5. Client (Dropdown + champ « Ajouter un client »)
6. Tags (texte → split virgules)
7. Lien
8. Séparateur + checkboxes canaux (Email, Telegram, Ntfy), précochés depuis defaults
9. Séparateur + rappels 7 / 3 / 1 / **0 (Le jour même)** + DatePicker DateTime optionnel

Submit : validation titre + date → création client optionnelle → `createTask` → toast succès → `closeMainWindow()`.

### Package

- Bump version mineure Raycast (`package.json`).
- Préférence PAT : clarifier que le scope `tasks` est requis pour Create/Search Tasks (si le texte actuel ne mentionne que licences).

## Data flow

1. Montage : `Promise.all` clients + notification defaults ; échec silencieux → listes / cases vides.
2. Submit : `reminderDays = [7,3,1,0].filter(checked)` ; canaux = cases cochées (tableau vide → `undefined`).
3. Erreur API : toast Failure, fenêtre reste ouverte.

## Error handling

| Cas | Comportement |
| --- | --- |
| Titre / date manquants | Toast Failure, pas d’appel API |
| Token invalide / 401 | Message PAT clair (via `request`) |
| Defaults indisponibles | Formulaire utilisable, cases décochées |
| Création client en conflit | Surface l’erreur API (ou réutiliser le client existant si déjà sélectionnable — garder le comportement actuel de `createTaskClient`) |

## Out of scope

- Upload / gestion pièces jointes depuis Raycast
- Édition de tâche depuis Raycast
- Search Tasks (affichage tags/priorité) — non requis pour cet alignement création
- Refactor types partagés web / MCP / Raycast

## Verification (manuel)

- [ ] Création minimale (titre + date) → tâche visible dans Task Reminder web
- [ ] Rappel « Le jour même » persisté (`reminderDays` contient `0`)
- [ ] Canaux précochés si config compte non vide ; token **scope `tasks` seul**
- [ ] Nouveau client via le champ dédié
- [ ] Recharger l’extension (`npm run dev` / Import) : plus le vieux formulaire Titre/Date texte/Client/Lien/Description seul

## Success criteria

L’utilisateur Raycast peut créer une tâche avec le même ensemble de champs métier que le modal web (hors PJ), avec un PAT `tasks`, et l’UI installée n’affiche plus l’ancien formulaire minimal.
