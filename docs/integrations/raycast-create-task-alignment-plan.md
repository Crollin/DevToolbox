# Raycast Create Task Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aligner la commande Raycast Create Task sur le modal web Task Reminder (champs métier + canaux préremplis + rappel jour même), sans pièces jointes ni wizard.

**Architecture:** Endpoint `GET /api/tasks/notification-defaults` (scope PAT `tasks`) expose les canaux compte ; Raycast charge clients + defaults au montage, puis soumet `POST /api/tasks` avec le même payload métier que le web (hors fichiers).

**Tech Stack:** Express + Vitest (backend), `@raycast/api` Form (extension locale `raycast/`).

**Spec:** `docs/integrations/raycast-create-task-alignment-design.md`

## Global Constraints

- Pas de pièces jointes, pas de wizard 2 étapes, pas de preview Markdown, pas de couleurs client.
- `dueDate` envoyé en `YYYY-MM-DD`.
- Si aucun canal coché → `notificationChannels: undefined` dans le body.
- Endpoint defaults : réponse minimale `{ notificationChannels }` uniquement (pas de topic/token).
- Route `GET /notification-defaults` enregistrée **avant** `GET /:id`.
- Extension Raycast : bump version `1.2.1` → `1.3.0`.
- Préférence PAT : mentionner les scopes `licences`, `tasks`, `knowledge_base` selon les commandes utilisées.

## File map

| File | Responsibility |
| --- | --- |
| `backend/src/routes/tasks.ts` | Nouvelle route `GET /notification-defaults` |
| `backend/src/__tests__/routes/tasks.test.ts` | Test auth + shape de la réponse |
| `raycast/src/task-api.ts` | `getNotificationDefaults()` + type de retour |
| `raycast/src/create-task.tsx` | Formulaire aligné (rappel 0, defaults canaux, ordre champs) |
| `raycast/package.json` | Version + description préférence PAT |
| `raycast/README.md` | Note courte sur Create Task / scope `tasks` si besoin |

---

### Task 1: Backend `GET /api/tasks/notification-defaults`

**Files:**
- Modify: `backend/src/routes/tasks.ts` (imports + route, **avant** `router.get('/:id'…)`)
- Modify: `backend/src/__tests__/routes/tasks.test.ts`
- Test: `backend/src/__tests__/routes/tasks.test.ts`

**Interfaces:**
- Consumes: `getOrCreateNtfyConfig(userId: string)` from `../lib/ntfyConfig` (retourne notamment `notificationChannels: Array<'ntfy'|'email'|'telegram'>`)
- Produces: `GET /api/tasks/notification-defaults` → `200` + `{ notificationChannels: string[] }` ; `401` sans auth

- [ ] **Step 1: Write the failing test**

Ajouter dans `backend/src/__tests__/routes/tasks.test.ts` :

```ts
  it('GET /api/tasks/notification-defaults requiert une authentification', async () => {
    const res = await request(app).get('/api/tasks/notification-defaults');
    expect(res.status).toBe(401);
  });

  it('GET /api/tasks/notification-defaults retourne les canaux', async () => {
    const res = await request(app)
      .get('/api/tasks/notification-defaults')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notificationChannels)).toBe(true);
    for (const channel of res.body.notificationChannels) {
      expect(['ntfy', 'email', 'telegram']).toContain(channel);
    }
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd backend && npx vitest run src/__tests__/routes/tasks.test.ts -t "notification-defaults"
```

Expected: FAIL (404 ou route absente / assertion échouée).

- [ ] **Step 3: Implement the route**

Dans `backend/src/routes/tasks.ts` :

1. Ajouter l’import :

```ts
import { getOrCreateNtfyConfig } from '../lib/ntfyConfig';
```

2. Insérer **après** les routes `/clients` et **avant** `router.use('/:taskId/attachments'…)` / `router.get('/:id'…)` :

```ts
// GET /api/tasks/notification-defaults — canaux compte (compatible PAT scope tasks)
router.get('/notification-defaults', (req, res) => {
  try {
    const config = getOrCreateNtfyConfig(req.user!.id);
    res.json({ notificationChannels: config.notificationChannels ?? [] });
  } catch (error) {
    console.error('Erreur lors de la récupération des canaux de notification:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des canaux de notification' });
  }
});
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd backend && npx vitest run src/__tests__/routes/tasks.test.ts -t "notification-defaults"
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/tasks.ts backend/src/__tests__/routes/tasks.test.ts
git commit -m "$(cat <<'EOF'
feat(tasks): expose notification defaults for PAT clients

EOF
)"
```

---

### Task 2: Client API Raycast `getNotificationDefaults`

**Files:**
- Modify: `raycast/src/task-api.ts`

**Interfaces:**
- Consumes: `request<T>(path, init?)` from `./api`
- Produces: `getNotificationDefaults(): Promise<Array<"ntfy" | "email" | "telegram">>`

- [ ] **Step 1: Add types + function**

Dans `raycast/src/task-api.ts`, après les imports / types Channel existants (ou définir le type local), ajouter :

```ts
export type NotificationChannel = "ntfy" | "email" | "telegram";

export function getNotificationDefaults() {
  return request<{ notificationChannels: NotificationChannel[] }>(
    "/tasks/notification-defaults",
  ).then((data) =>
    (data.notificationChannels ?? []).filter(
      (channel): channel is NotificationChannel =>
        channel === "ntfy" || channel === "email" || channel === "telegram",
    ),
  );
}
```

Optionnel : remplacer les unions inline de `Task` / `TaskInput` par `NotificationChannel` (même fichier, cohérent).

- [ ] **Step 2: Typecheck Raycast**

Run:

```bash
cd raycast && npx tsc --noEmit
```

Expected: exit 0 (ou uniquement erreurs préexistantes hors de ce fichier).

- [ ] **Step 3: Commit**

```bash
git add raycast/src/task-api.ts
git commit -m "$(cat <<'EOF'
feat(raycast): fetch task notification defaults

EOF
)"
```

---

### Task 3: Alignement UI `create-task.tsx`

**Files:**
- Modify: `raycast/src/create-task.tsx`

**Interfaces:**
- Consumes: `listTaskClients`, `createTaskClient`, `createTask`, `getNotificationDefaults`, `NotificationChannel` from `./task-api`
- Produces: Form Create Task avec rappel `0` et canaux précochés

- [ ] **Step 1: Replace form logic**

Réécrire `raycast/src/create-task.tsx` pour respecter ce comportement (code cible) :

```tsx
import { useEffect, useState } from "react";
import {
  Action,
  ActionPanel,
  closeMainWindow,
  Form,
  showToast,
  Toast,
} from "@raycast/api";
import {
  createTask,
  createTaskClient,
  getNotificationDefaults,
  listTaskClients,
  NotificationChannel,
  TaskClient,
} from "./task-api";

const channelFields: Array<{ id: NotificationChannel; label: string }> = [
  { id: "email", label: "Email" },
  { id: "telegram", label: "Telegram" },
  { id: "ntfy", label: "Ntfy" },
];

const reminderDayOptions = [
  { id: 7, label: "7 jours avant" },
  { id: 3, label: "3 jours avant" },
  { id: 1, label: "1 jour avant" },
  { id: 0, label: "Le jour même" },
] as const;

export default function CreateTask() {
  const [clients, setClients] = useState<TaskClient[]>([]);
  const [defaultChannels, setDefaultChannels] = useState<NotificationChannel[]>(
    [],
  );
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listTaskClients().catch(() => [] as TaskClient[]),
      getNotificationDefaults().catch(() => [] as NotificationChannel[]),
    ]).then(([nextClients, nextChannels]) => {
      if (cancelled) return;
      setClients(nextClients);
      setDefaultChannels(nextChannels);
      setIsBootstrapping(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function formatDateOnly(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async function handleSubmit(values: Form.Values) {
    const dueDate = values.dueDate;
    if (!(dueDate instanceof Date)) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Date d'échéance requise",
      });
      return;
    }

    const title = String(values.title ?? "").trim();
    if (!title) {
      await showToast({ style: Toast.Style.Failure, title: "Titre requis" });
      return;
    }

    const newClient = String(values.newClient ?? "").trim();
    let client = String(values.client ?? "").trim();

    setIsLoading(true);
    try {
      if (newClient) {
        const createdClient = await createTaskClient(newClient);
        client = createdClient.name;
        setClients((current) => [
          ...current.filter((item) => item.name !== client),
          createdClient,
        ]);
      }

      const reminderDays = reminderDayOptions
        .map((option) => option.id)
        .filter((days) => values[`reminder${days}`] === true);

      const tags = String(values.tags ?? "")
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean);

      const notificationChannels = channelFields
        .filter(({ id }) => values[`channel-${id}`] === true)
        .map(({ id }) => id);

      const reminderDatetime = values.reminderDatetime;

      await createTask({
        title,
        dueDate: formatDateOnly(dueDate),
        description: String(values.description ?? "").trim() || undefined,
        client: client || undefined,
        link: String(values.link ?? "").trim() || undefined,
        tags: tags.length ? tags : undefined,
        priority:
          (values.priority as "low" | "normal" | "high" | "urgent") || "normal",
        notificationChannels: notificationChannels.length
          ? notificationChannels
          : undefined,
        reminderDays: reminderDays.length ? reminderDays : undefined,
        reminderDatetime:
          reminderDatetime instanceof Date
            ? reminderDatetime.toISOString()
            : undefined,
      });
      await showToast({ style: Toast.Style.Success, title: "Tâche créée" });
      await closeMainWindow();
    } catch (caught) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Création impossible",
        message: String(caught),
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isBootstrapping) {
    return <Form isLoading />;
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Créer la tâche" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="title"
        title="Titre"
        autoFocus
        placeholder="Ex. Valider la maquette d'accueil"
      />
      <Form.TextArea
        id="description"
        title="Description"
        placeholder="Notes, contexte, checklist… Markdown accepté."
      />
      <Form.DatePicker
        id="dueDate"
        title="Date d'échéance"
        type={Form.DatePicker.Type.Date}
        defaultValue={new Date(Date.now() + 24 * 60 * 60 * 1000)}
      />

      <Form.Dropdown id="priority" title="Priorité" defaultValue="normal">
        <Form.Dropdown.Item value="low" title="Faible" />
        <Form.Dropdown.Item value="normal" title="Normale" />
        <Form.Dropdown.Item value="high" title="Haute" />
        <Form.Dropdown.Item value="urgent" title="Urgente" />
      </Form.Dropdown>

      <Form.Dropdown id="client" title="Client" defaultValue="">
        <Form.Dropdown.Item value="" title="Sans client" />
        {clients.map((client) => (
          <Form.Dropdown.Item
            key={client.id}
            value={client.name}
            title={client.name}
          />
        ))}
      </Form.Dropdown>
      <Form.TextField
        id="newClient"
        title="Ajouter un client"
        placeholder="Laisser vide pour utiliser la liste"
      />
      <Form.TextField
        id="tags"
        title="Tags"
        placeholder="design, urgent, site-web"
        info="Séparez les tags par des virgules."
      />
      <Form.TextField id="link" title="Lien" placeholder="https://..." />

      <Form.Separator />
      <Form.Description text="Canaux de notification — préremplis avec la config du compte. Décochez tout pour laisser le backend appliquer les défauts." />
      {channelFields.map((channel) => (
        <Form.Checkbox
          key={channel.id}
          id={`channel-${channel.id}`}
          label={channel.label}
          defaultValue={defaultChannels.includes(channel.id)}
        />
      ))}

      <Form.Separator />
      {reminderDayOptions.map((option) => (
        <Form.Checkbox
          key={option.id}
          id={`reminder${option.id}`}
          label={option.label}
        />
      ))}
      <Form.DatePicker
        id="reminderDatetime"
        title="Rappel à une date/heure précise"
        type={Form.DatePicker.Type.DateTime}
        info="Optionnel"
      />
    </Form>
  );
}
```

- [ ] **Step 2: Typecheck**

Run:

```bash
cd raycast && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add raycast/src/create-task.tsx
git commit -m "$(cat <<'EOF'
feat(raycast): align Create Task form with Task Reminder

EOF
)"
```

---

### Task 4: Version, préférences, doc + smoke

**Files:**
- Modify: `raycast/package.json` (`version`, `preferences[1].description`)
- Modify: `raycast/README.md` (ligne courte Create Task si absente)

**Interfaces:**
- Consumes: Tasks 1–3 livrés
- Produces: extension `1.3.0` documentée

- [ ] **Step 1: Bump package + préférence**

Dans `raycast/package.json` :

- `"version": "1.3.0"`
- Préférence `personalAccessToken.description` :

```json
"description": "Token privé (dt_…) avec les scopes des commandes utilisées : licences, tasks, knowledge_base."
```

- [ ] **Step 2: README**

Dans `raycast/README.md`, s’assurer que la table des commandes mentionne Create/Search Tasks → scope `tasks` (déjà présent) ; ajouter sous « Installer » une note :

```markdown
Après mise à jour du code, relancez `npm run dev` (ou réimportez l’extension) pour recharger Create Task — l’ancien formulaire minimal ne doit plus apparaître.
```

- [ ] **Step 3: Smoke manuel**

1. Backend up + `cd raycast && npm run dev`
2. Raycast → Create Task : vérifier champs (priorité, tags, rappel « Le jour même », canaux précochés)
3. Créer une tâche minimale → visible dans Task Reminder web
4. Créer avec rappel jour même → `reminderDays` contient `0` (API ou UI web)
5. Token scope `tasks` seul : defaults + création OK

- [ ] **Step 4: Commit**

```bash
git add raycast/package.json raycast/README.md
git commit -m "$(cat <<'EOF'
chore(raycast): bump to 1.3.0 for Create Task alignment

EOF
)"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
| --- | --- |
| Endpoint `notification-defaults` scope tasks | Task 1 |
| Formulaire plat aligné (champs listés) | Task 3 |
| Rappel jour même (`0`) | Task 3 |
| Canaux préremplis | Tasks 1–3 |
| Aucun canal → `undefined` | Task 3 |
| `dueDate` YYYY-MM-DD | Task 3 |
| Hors PJ / wizard / couleurs | Respecté (non implémenté) |
| Bump version + préférence PAT | Task 4 |
| Vérif manuelle | Task 4 Step 3 |

No placeholders remaining. Types `NotificationChannel` / `getNotificationDefaults` cohérents entre Tasks 2 et 3.
