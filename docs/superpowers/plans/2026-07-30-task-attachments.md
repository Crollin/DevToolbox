# Task Reminder Attachments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter des pièces jointes aux tâches Task Reminder avec preview images/PDF en lightbox desktop et fallback téléchargement pour les autres types.

**Architecture:** Métadonnées en SQLite (`task_attachments`), fichiers sur disque sous `data/uploads/tasks/{userId}/{taskId}/`. API multipart Express + multer. UI React : liste/upload dans `TaskModal` + `TaskDetailSheet`, preview via Dialog lightbox (`img` / `iframe`).

**Tech Stack:** Express, better-sqlite3, multer, Vitest/supertest, React, Dialog shadcn existant.

## Global Constraints

- Max **10 Mo** par fichier ; max **10** pièces jointes par tâche
- Preview riche : **images** (`image/*`) et **PDF** (`application/pdf`) ; autres types = icône + téléchargement
- Stockage : disque local `data/uploads/tasks/...` + table SQLite (pas de BLOB, pas de S3)
- Desktop preview : Dialog lightbox ~90 % viewport ; mobile : liste dans le sheet, clic ouvre aussi la lightbox
- Auth : mêmes guards que `/api/tasks` (`authenticateTokenOrPersonalAccessToken('tasks')`)
- Ownership : toute opération vérifie `tasks.user_id === req.user.id`
- Pas de PJ dans emails/notifications V1
- Pas de dépendance `react-pdf` : utiliser `<img>` et `<iframe>`/`<object>`
- Réponses API en français pour les messages d’erreur (comme le reste de `tasks.ts`)
- Commits atomiques par tâche ; TDD sur le backend

## File Structure

| File | Responsibility |
|------|----------------|
| `backend/src/db/database.ts` | Créer table `task_attachments` |
| `backend/src/lib/taskAttachments.ts` | Chemins disque, limites, helpers CRUD fichiers |
| `backend/src/routes/taskAttachments.ts` | Routes REST attachments |
| `backend/src/routes/tasks.ts` | Monter sous-router + cleanup fichiers à DELETE tâche |
| `backend/src/app.ts` | (si besoin) rien de plus si monté via tasks |
| `backend/src/__tests__/routes/taskAttachments.test.ts` | Tests API |
| `src/types/task.ts` | Type `TaskAttachment` |
| `src/lib/taskAttachmentsApi.ts` | Appels API FormData + URL stream |
| `src/components/tasks/TaskAttachmentsPanel.tsx` | Liste + upload UI |
| `src/components/tasks/AttachmentLightbox.tsx` | Dialog preview |
| `src/components/tasks/TaskModal.tsx` | Intégrer panel (pending files à la création) |
| `src/components/tasks/TaskDetailSheet.tsx` | Intégrer panel |
| `src/pages/tools/TaskReminder.tsx` | Adapter `onSave` pour uploader après create si besoin |
| `backend/package.json` | Ajouter `multer` + `@types/multer` |

---

### Task 1: Schema SQLite + helpers stockage

**Files:**
- Modify: `backend/src/db/database.ts` (après la table `tasks` / `task_clients`)
- Create: `backend/src/lib/taskAttachments.ts`
- Modify: `backend/package.json` (multer)
- Test: `backend/src/__tests__/lib/taskAttachments.test.ts`

**Interfaces:**
- Produces:
  - `MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024`
  - `MAX_ATTACHMENTS_PER_TASK = 10`
  - `getTaskUploadDir(userId: string, taskId: string): string`
  - `ensureTaskUploadDir(userId: string, taskId: string): string`
  - `removeTaskUploadDir(userId: string, taskId: string): void`
  - `removeAttachmentFile(userId: string, taskId: string, storedFilename: string): void`
  - `isPreviewableMime(mime: string): boolean` — true pour `image/*` et `application/pdf`
  - `sanitizeOriginalFilename(name: string): string`

- [ ] **Step 1: Installer multer**

```bash
cd backend && npm install multer && npm install -D @types/multer
```

- [ ] **Step 2: Write failing tests for helpers**

Create `backend/src/__tests__/lib/taskAttachments.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_TASK,
  getTaskUploadDir,
  ensureTaskUploadDir,
  removeTaskUploadDir,
  isPreviewableMime,
  sanitizeOriginalFilename,
} from '../../lib/taskAttachments';

describe('taskAttachments helpers', () => {
  const prev = process.env.UPLOADS_ROOT;
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dt-att-'));
    process.env.UPLOADS_ROOT = tmp;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.UPLOADS_ROOT;
    else process.env.UPLOADS_ROOT = prev;
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('exposes limits 10MB and 10 files', () => {
    expect(MAX_ATTACHMENT_BYTES).toBe(10 * 1024 * 1024);
    expect(MAX_ATTACHMENTS_PER_TASK).toBe(10);
  });

  it('creates upload dir under user/task', () => {
    const dir = ensureTaskUploadDir('u1', 't1');
    expect(dir).toBe(path.join(tmp, 'tasks', 'u1', 't1'));
    expect(fs.existsSync(dir)).toBe(true);
  });

  it('removes upload dir recursively', () => {
    const dir = ensureTaskUploadDir('u1', 't1');
    fs.writeFileSync(path.join(dir, 'a.txt'), 'x');
    removeTaskUploadDir('u1', 't1');
    expect(fs.existsSync(dir)).toBe(false);
  });

  it('detects previewable mimes', () => {
    expect(isPreviewableMime('image/png')).toBe(true);
    expect(isPreviewableMime('application/pdf')).toBe(true);
    expect(isPreviewableMime('application/zip')).toBe(false);
  });

  it('sanitizes filenames', () => {
    expect(sanitizeOriginalFilename('../../etc/passwd')).not.toContain('..');
    expect(sanitizeOriginalFilename('')).toBe('fichier');
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
cd backend && npm test -- src/__tests__/lib/taskAttachments.test.ts
```

Expected: FAIL (module missing)

- [ ] **Step 4: Implement `backend/src/lib/taskAttachments.ts`**

```ts
import fs from 'fs';
import path from 'path';

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_TASK = 10;

function uploadsRoot(): string {
  return process.env.UPLOADS_ROOT || path.join(__dirname, '../../data/uploads');
}

export function getTaskUploadDir(userId: string, taskId: string): string {
  return path.join(uploadsRoot(), 'tasks', userId, taskId);
}

export function ensureTaskUploadDir(userId: string, taskId: string): string {
  const dir = getTaskUploadDir(userId, taskId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function removeTaskUploadDir(userId: string, taskId: string): void {
  const dir = getTaskUploadDir(userId, taskId);
  fs.rmSync(dir, { recursive: true, force: true });
}

export function removeAttachmentFile(userId: string, taskId: string, storedFilename: string): void {
  const filePath = path.join(getTaskUploadDir(userId, taskId), path.basename(storedFilename));
  fs.rmSync(filePath, { force: true });
}

export function isPreviewableMime(mime: string): boolean {
  return mime.startsWith('image/') || mime === 'application/pdf';
}

export function sanitizeOriginalFilename(name: string): string {
  const base = path.basename(name).replace(/[^\w.\- ()\[\]]+/g, '_').trim();
  return base.slice(0, 200) || 'fichier';
}
```

- [ ] **Step 5: Add table in `initializeDatabase()` in `database.ts`** (after `task_clients` block):

```ts
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_attachments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id)`);
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd backend && npm test -- src/__tests__/lib/taskAttachments.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/lib/taskAttachments.ts backend/src/db/database.ts backend/src/__tests__/lib/taskAttachments.test.ts
git commit -m "$(cat <<'EOF'
feat(tasks): add attachment storage helpers and SQLite schema

EOF
)"
```

---

### Task 2: API REST pièces jointes + cleanup delete tâche

**Files:**
- Create: `backend/src/routes/taskAttachments.ts`
- Modify: `backend/src/routes/tasks.ts` (mount router + file cleanup on delete)
- Create: `backend/src/__tests__/routes/taskAttachments.test.ts`

**Interfaces:**
- Consumes: helpers Task 1 ; table `task_attachments`
- Produces routes montées sous `/api/tasks/:taskId/attachments` :
  - `GET /` → `{ attachments: AttachmentDTO[] }`
  - `POST /` multipart `file` → `{ attachment: AttachmentDTO }` (201)
  - `GET /:attachmentId` stream ; `?download=1` → Content-Disposition attachment
  - `DELETE /:attachmentId` → `{ success: true }`
- `AttachmentDTO`: `{ id, taskId, originalFilename, mimeType, sizeBytes, createdAt, previewable }`

- [ ] **Step 1: Write failing API tests**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import app from '../../app';

describe('Task attachments API', () => {
  let token: string;
  let taskId: string;

  beforeEach(async () => {
    process.env.UPLOADS_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dt-att-api-'));
    const reg = await request(app).post('/api/auth/register').send({
      email: `att-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Att User',
    });
    token = reg.body.token;
    const task = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Avec PJ', dueDate: '2030-01-01' });
    taskId = task.body.task.id;
  });

  it('POST upload puis GET liste', async () => {
    const filePath = path.join(process.env.UPLOADS_ROOT!, 'hello.txt');
    fs.writeFileSync(filePath, 'hello world');
    const up = await request(app)
      .post(`/api/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', filePath);
    expect(up.status).toBe(201);
    expect(up.body.attachment.originalFilename).toBe('hello.txt');
    expect(up.body.attachment.previewable).toBe(false);

    const list = await request(app)
      .get(`/api/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.attachments).toHaveLength(1);
  });

  it('rejette fichier > 10Mo', async () => {
    const big = path.join(process.env.UPLOADS_ROOT!, 'big.bin');
    fs.writeFileSync(big, Buffer.alloc(10 * 1024 * 1024 + 1));
    const up = await request(app)
      .post(`/api/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', big);
    expect(up.status).toBe(400);
  });

  it('GET stream et DELETE', async () => {
    const filePath = path.join(process.env.UPLOADS_ROOT!, 'pic.png');
    // minimal PNG 1x1
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(filePath, png);
    const up = await request(app)
      .post(`/api/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', filePath);
    const id = up.body.attachment.id;
    const get = await request(app)
      .get(`/api/tasks/${taskId}/attachments/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(get.headers['content-type']).toMatch(/image\/png/);

    const del = await request(app)
      .delete(`/api/tasks/${taskId}/attachments/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const list = await request(app)
      .get(`/api/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.attachments).toHaveLength(0);
  });

  it('DELETE tâche nettoie les fichiers', async () => {
    const filePath = path.join(process.env.UPLOADS_ROOT!, 'a.txt');
    fs.writeFileSync(filePath, 'x');
    await request(app)
      .post(`/api/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', filePath);
    const userId = (await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)).body.user?.id
      ?? (await request(app).get('/api/account').set('Authorization', `Bearer ${token}`)).body?.id;
    // Si /me n'existe pas, vérifier via UPLOADS_ROOT après delete : dossier task absent
    await request(app).delete(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${token}`);
    const tasksDir = path.join(process.env.UPLOADS_ROOT!, 'tasks');
    const leftover = fs.existsSync(tasksDir)
      ? fs.readdirSync(tasksDir, { recursive: true })
      : [];
    expect(String(leftover)).not.toContain(taskId);
  });
});
```

Note: adapter le test cleanup si `/api/auth/me` n’existe pas — se baser uniquement sur l’absence de `taskId` sous `UPLOADS_ROOT/tasks`.

- [ ] **Step 2: Run — expect FAIL**

```bash
cd backend && npm test -- src/__tests__/routes/taskAttachments.test.ts
```

- [ ] **Step 3: Implement `taskAttachments.ts` router**

Utiliser multer memoryStorage ou diskStorage vers `ensureTaskUploadDir`, nom stocké = `${uuid}${ext}`, vérifier count < 10, size <= 10Mo, ownership tâche.

Format DTO camelCase cohérent avec `formatTask`.

- [ ] **Step 4: Mount in `tasks.ts`**

```ts
import taskAttachmentsRouter from './taskAttachments';
// ...
router.use('/:taskId/attachments', taskAttachmentsRouter);
```

Attention à l’ordre des routes : monter **avant** `/:id` générique si conflit, ou utiliser un param distinct. Preférer monter explicitement :

```ts
router.use('/:taskId/attachments', taskAttachmentsRouter);
```

et dans le sous-router, lire `req.params.taskId`. Les routes existantes `/:id` restent OK car Express matche le chemin plus spécifique avec le mount.

Sur `DELETE /:id` de la tâche : avant/après delete SQL, appeler `removeTaskUploadDir(userId, id)`.

- [ ] **Step 5: Tests PASS**

```bash
cd backend && npm test -- src/__tests__/routes/taskAttachments.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/taskAttachments.ts backend/src/routes/tasks.ts backend/src/__tests__/routes/taskAttachments.test.ts
git commit -m "$(cat <<'EOF'
feat(tasks): add REST API for task file attachments

EOF
)"
```

---

### Task 3: Types frontend + client API

**Files:**
- Modify: `src/types/task.ts`
- Create: `src/lib/taskAttachmentsApi.ts`
- Modify: `src/lib/api.ts` si besoin d’un helper upload sans forcer `Content-Type: application/json`

**Interfaces:**
- Produces:
```ts
export interface TaskAttachment {
  id: string;
  taskId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  previewable: boolean;
}

// src/lib/taskAttachmentsApi.ts
listAttachments(taskId: string): Promise<TaskAttachment[]>
uploadAttachment(taskId: string, file: File): Promise<TaskAttachment>
deleteAttachment(taskId: string, attachmentId: string): Promise<void>
attachmentContentUrl(taskId: string, attachmentId: string, download?: boolean): string
```

`attachmentContentUrl` doit pointer vers `${API_BASE}/tasks/${taskId}/attachments/${id}` (avec token via header fetch pour blob, car `<img src>` ne peut pas envoyer Bearer facilement).

Donc aussi :
```ts
fetchAttachmentBlob(taskId: string, attachmentId: string): Promise<Blob>
```

pour lightbox / téléchargement authentifié.

- [ ] **Step 1: Étendre `api.ts` avec `upload`**

Ajouter une méthode qui n’impose pas `Content-Type: application/json` :

```ts
upload: async <T>(endpoint: string, formData: FormData): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(url, { method: 'POST', headers, body: formData });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
    throw new Error(error.error || `Erreur HTTP: ${response.status}`);
  }
  return response.json();
},
```

Et `getBlob` similaire retournant `response.blob()`.

- [ ] **Step 2: Types + `taskAttachmentsApi.ts`**

Implémenter les 4 fonctions ci-dessus.

- [ ] **Step 3: Smoke manuel ou petit test unitaire optionnel** — au minimum vérifier que le module compile :

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | head -40
```

(ou le script lint/build frontend du repo)

- [ ] **Step 4: Commit**

```bash
git add src/types/task.ts src/lib/api.ts src/lib/taskAttachmentsApi.ts
git commit -m "$(cat <<'EOF'
feat(tasks): add frontend types and API client for attachments

EOF
)"
```

---

### Task 4: UI — panel PJ + lightbox

**Files:**
- Create: `src/components/tasks/AttachmentLightbox.tsx`
- Create: `src/components/tasks/TaskAttachmentsPanel.tsx`

**Interfaces:**
- `AttachmentLightbox({ attachment, open, onOpenChange, taskId })` — charge blob, affiche img/iframe/fallback
- `TaskAttachmentsPanel({ taskId?: string; pendingFiles: File[]; onPendingFilesChange: (f: File[]) => void; readOnly?: boolean })`
  - Si `taskId` défini : charge liste API, upload immédiat, delete
  - Sinon : gère uniquement `pendingFiles` locaux (création)
  - Clic item previewable → ouvre lightbox (pour pending: object URL local)

- [ ] **Step 1: Implémenter `AttachmentLightbox`**

Utiliser `Dialog` de `@/components/ui/dialog`. Contenu : `className="max-w-[90vw] w-[90vw] h-[90vh]..."`. Esc ferme déjà via Dialog.

- [ ] **Step 2: Implémenter `TaskAttachmentsPanel`**

Afficher miniatures images, icône File/FileText pour PDF/autres, bouton + input file multiple, messages d’erreur toast si limite atteinte.

- [ ] **Step 3: Vérifier rendu TypeScript**

```bash
npm run build
```

(ou lint ciblé)

- [ ] **Step 4: Commit**

```bash
git add src/components/tasks/AttachmentLightbox.tsx src/components/tasks/TaskAttachmentsPanel.tsx
git commit -m "$(cat <<'EOF'
feat(tasks): add attachment panel and desktop lightbox preview

EOF
)"
```

---

### Task 5: Intégration Modal + DetailSheet + create flow

**Files:**
- Modify: `src/components/tasks/TaskModal.tsx`
- Modify: `src/components/tasks/TaskDetailSheet.tsx`
- Modify: `src/pages/tools/TaskReminder.tsx` (si `onSave` doit retourner la tâche créée pour upload)

**Interfaces:**
- Modal : section « Pièces jointes » ; `pendingFiles` state ; si `editTask`, passer `taskId={editTask.id}`
- `onSave` actuel reste `CreateTaskInput` ; après `addTask` dans `TaskReminder.handleSave`, uploader `pendingFiles` — donc le modal doit exposer les pending files au parent **ou** le modal appelle un callback enrichi.

**Approche retenue :** changer `onSave` en :

```ts
onSave: (task: CreateTaskInput, files: File[]) => void | Promise<void>
```

`TaskReminder.handleSave` : crée/update puis `for (const f of files) await uploadAttachment(taskId, f)`.

Sheet détail : `<TaskAttachmentsPanel taskId={task.id} pendingFiles={[]} onPendingFilesChange={() => {}} />`.

- [ ] **Step 1: Adapter TaskModal**

- [ ] **Step 2: Adapter TaskDetailSheet**

- [ ] **Step 3: Adapter TaskReminder.handleSave** pour upload post-create/edit

- [ ] **Step 4: Smoke build**

```bash
npm run build
cd backend && npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/components/tasks/TaskModal.tsx src/components/tasks/TaskDetailSheet.tsx src/pages/tools/TaskReminder.tsx
git commit -m "$(cat <<'EOF'
feat(tasks): wire attachments into task modal and detail sheet

EOF
)"
```

---

## Plan Self-Review

1. **Spec coverage:** schema, API, limites, preview img/pdf, lightbox desktop, modal+sheet, stockage disque, ownership — couverts Tasks 1–5. Hors scope email/S3 respecté.
2. **Placeholders:** aucun TBD volontaire ; le test `/me` dans Task 2 a une note d’adaptation explicite.
3. **Types:** `TaskAttachment` / DTO camelCase alignés entre backend format et frontend.
