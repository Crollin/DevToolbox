# Domain Hub User Credentials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each authenticated user store Cloudflare / Hostinger / OVH API keys in `/account` when Domain Hub is enabled, with no env fallback and UI prompts when keys are missing.

**Architecture:** SQLite table `domain_hub_credentials` (1 row per user). Account API GET/PUT with `***` masking (SMTP pattern). Registrar helpers take an explicit credentials object; compare + Hostinger sync load credentials from `req.user.id`. Env registrar vars are no longer read at runtime.

**Tech Stack:** Express, better-sqlite3, Vitest + supertest, React + existing Account Tabs UI, `DOMAIN_HUB_ENABLED` feature flag.

## Global Constraints

- Per-user credentials only; **no** `process.env` fallback for registrar calls.
- Account credentials routes return **404** when `DOMAIN_HUB_ENABLED` is false.
- Secrets never returned in clear after write; `***` means keep existing on PUT; `""` clears.
- UI Domain Hub tab + banner only when `domainHubEnabled` is true.
- V1: no AES encryption, no test-connection buttons.
- Spec: `docs/superpowers/specs/2026-08-16-domain-hub-user-credentials-design.md`.

## File map

| File | Role |
|------|------|
| `backend/src/db/database.ts` | Create `domain_hub_credentials` |
| `backend/src/lib/domainHubCredentials.ts` | Load / serialize / upsert helpers |
| `backend/src/routes/account.ts` | GET/PUT `/domain-hub-credentials` |
| `backend/src/lib/registrars/types.ts` | `RegistrarCredentials` + `CompareInput.credentials` |
| `backend/src/lib/registrars/{cloudflare,hostinger,ovh,compare}.ts` | Accept credentials arg |
| `backend/src/routes/domains.ts` | Pass user credentials into compare + sync |
| `backend/src/__tests__/lib/domainHubCredentials.test.ts` | Unit tests helpers |
| `backend/src/__tests__/routes/domainHubCredentials.test.ts` | API route tests |
| `src/pages/Account.tsx` | Onglet Domain Hub |
| `src/pages/tools/DomainHub.tsx` | Bannière d’incitation |
| `src/hooks/useDomainHubCredentials.ts` | Fetch configured flags (optional small hook) |

---

### Task 1: Table + credentials helpers

**Files:**
- Modify: `backend/src/db/database.ts` (after domains indexes ~734)
- Create: `backend/src/lib/domainHubCredentials.ts`
- Test: `backend/src/__tests__/lib/domainHubCredentials.test.ts`

**Interfaces:**
- Produces:
  - `export type DomainHubCredentialsRow` (DB snake_case nullable strings)
  - `export interface DomainHubCredentialsPublic` with camelCase + `configured: { cloudflare: boolean; hostinger: boolean; ovh: boolean }`
  - `export interface RegistrarCredentials { cloudflareApiToken: string | null; cloudflareAccountId: string | null; hostingerApiToken: string | null; ovhAppKey: string | null; ovhAppSecret: string | null; ovhConsumerKey: string | null; ovhSubsidiary: string | null }`
  - `getCredentialsRow(userId: string): DomainHubCredentialsRow | undefined`
  - `toPublic(row: DomainHubCredentialsRow | undefined): DomainHubCredentialsPublic`
  - `toRegistrarCredentials(row: DomainHubCredentialsRow | undefined): RegistrarCredentials`
  - `upsertCredentials(userId: string, body: Record<string, unknown>): DomainHubCredentialsPublic`
  - `isCloudflareConfigured(c: RegistrarCredentials): boolean` (token + accountId)
  - `isHostingerConfigured(c: RegistrarCredentials): boolean`
  - `isOvhConfigured(c: RegistrarCredentials): boolean` (key + secret + consumerKey)

- [ ] **Step 1: Write failing unit tests**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import db from '../../db/database';
import {
  upsertCredentials,
  toPublic,
  getCredentialsRow,
  toRegistrarCredentials,
} from '../../lib/domainHubCredentials';

describe('domainHubCredentials', () => {
  const userId = 'user-creds-test';

  beforeEach(() => {
    db.prepare('DELETE FROM domain_hub_credentials WHERE user_id = ?').run(userId);
    db.prepare(
      `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at, updated_at)
       VALUES (?, 'creds@test.com', 'x', 'Test', datetime('now'), datetime('now'))`
    ).run(userId);
  });

  it('masks secrets on toPublic and reports configured flags', () => {
    upsertCredentials(userId, {
      cloudflareApiToken: 'cf-secret',
      cloudflareAccountId: 'acct-1',
      hostingerApiToken: '',
    });
    const pub = toPublic(getCredentialsRow(userId));
    expect(pub.cloudflareApiToken).toBe('***');
    expect(pub.cloudflareAccountId).toBe('acct-1');
    expect(pub.configured.cloudflare).toBe(true);
    expect(pub.configured.hostinger).toBe(false);
  });

  it('keeps existing secret when body sends ***', () => {
    upsertCredentials(userId, { hostingerApiToken: 'h1' });
    upsertCredentials(userId, { hostingerApiToken: '***' });
    const raw = toRegistrarCredentials(getCredentialsRow(userId));
    expect(raw.hostingerApiToken).toBe('h1');
  });

  it('clears secret when body sends empty string', () => {
    upsertCredentials(userId, { hostingerApiToken: 'h1' });
    upsertCredentials(userId, { hostingerApiToken: '' });
    const raw = toRegistrarCredentials(getCredentialsRow(userId));
    expect(raw.hostingerApiToken).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL** (table/helpers missing)

Run: `cd backend && npx vitest run src/__tests__/lib/domainHubCredentials.test.ts`

- [ ] **Step 3: Add table in `database.ts`**

After domains indexes:

```typescript
  db.exec(`
    CREATE TABLE IF NOT EXISTS domain_hub_credentials (
      user_id TEXT PRIMARY KEY,
      cloudflare_api_token TEXT,
      cloudflare_account_id TEXT,
      hostinger_api_token TEXT,
      ovh_app_key TEXT,
      ovh_app_secret TEXT,
      ovh_consumer_key TEXT,
      ovh_subsidiary TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
```

- [ ] **Step 4: Implement `domainHubCredentials.ts`**

- Map camelCase ↔ snake_case.
- Secret fields: `cloudflareApiToken`, `hostingerApiToken`, `ovhAppKey`, `ovhAppSecret`, `ovhConsumerKey`.
- Non-secret: `cloudflareAccountId`, `ovhSubsidiary` (default display `FR` in public if null).
- `upsertCredentials`: INSERT OR replace fields per semantics above.

- [ ] **Step 5: Run tests — expect PASS**

Run: `cd backend && npx vitest run src/__tests__/lib/domainHubCredentials.test.ts`

- [ ] **Step 6: Commit**

```bash
git add backend/src/db/database.ts backend/src/lib/domainHubCredentials.ts backend/src/__tests__/lib/domainHubCredentials.test.ts
git commit -m "feat(domains): store per-user Domain Hub credentials"
```

---

### Task 2: Account API routes

**Files:**
- Modify: `backend/src/routes/account.ts`
- Test: `backend/src/__tests__/routes/domainHubCredentials.test.ts`

**Interfaces:**
- Consumes: `upsertCredentials`, `toPublic`, `getCredentialsRow`, `isDomainHubEnabled`
- Produces: `GET/PUT /api/account/domain-hub-credentials`

- [ ] **Step 1: Write failing route tests**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Domain Hub credentials API', () => {
  let token: string;
  const prev = process.env.DOMAIN_HUB_ENABLED;

  beforeEach(async () => {
    process.env.DOMAIN_HUB_ENABLED = 'true';
    const res = await request(app).post('/api/auth/register').send({
      email: `dh-creds-${Date.now()}@example.com`,
      password: 'password123',
      name: 'DH Creds',
    });
    token = res.body.token;
  });

  afterEach(() => {
    process.env.DOMAIN_HUB_ENABLED = prev;
  });

  it('GET returns empty configured flags', async () => {
    const res = await request(app)
      .get('/api/account/domain-hub-credentials')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.configured).toEqual({
      cloudflare: false,
      hostinger: false,
      ovh: false,
    });
  });

  it('PUT saves and masks secrets', async () => {
    const put = await request(app)
      .put('/api/account/domain-hub-credentials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cloudflareApiToken: 'tok',
        cloudflareAccountId: 'acc',
      });
    expect(put.status).toBe(200);
    expect(put.body.cloudflareApiToken).toBe('***');
    expect(put.body.configured.cloudflare).toBe(true);
  });

  it('returns 404 when Domain Hub disabled', async () => {
    process.env.DOMAIN_HUB_ENABLED = 'false';
    const res = await request(app)
      .get('/api/account/domain-hub-credentials')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
```

Note: if `isDomainHubEnabled()` caches env, set env **before** importing app or re-read env each call (current `features.ts` reads `process.env` live — OK).

- [ ] **Step 2: Run — expect FAIL**

Run: `cd backend && npx vitest run src/__tests__/routes/domainHubCredentials.test.ts`

- [ ] **Step 3: Add routes at end of `account.ts` (before `export default`)**

```typescript
import { isDomainHubEnabled } from '../lib/features';
import {
  getCredentialsRow,
  toPublic,
  upsertCredentials,
} from '../lib/domainHubCredentials';

function requireDomainHub(_req: Request, res: Response): boolean {
  if (!isDomainHubEnabled()) {
    res.status(404).json({ error: 'Domain Hub désactivé' });
    return false;
  }
  return true;
}

router.get('/domain-hub-credentials', (req, res) => {
  if (!requireDomainHub(req, res)) return;
  try {
    res.json(toPublic(getCredentialsRow(req.user!.id)));
  } catch (error) {
    console.error('Erreur domain-hub-credentials GET:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des clés Domain Hub' });
  }
});

router.put('/domain-hub-credentials', (req, res) => {
  if (!requireDomainHub(req, res)) return;
  try {
    res.json(upsertCredentials(req.user!.id, req.body || {}));
  } catch (error) {
    console.error('Erreur domain-hub-credentials PUT:', error);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde des clés Domain Hub' });
  }
});
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/account.ts backend/src/__tests__/routes/domainHubCredentials.test.ts
git commit -m "feat(account): Domain Hub credentials GET/PUT API"
```

---

### Task 3: Wire registrars to user credentials (no env)

**Files:**
- Modify: `backend/src/lib/registrars/types.ts` — add `credentials?: RegistrarCredentials` on `CompareInput` (import type from `domainHubCredentials` or redefine a slim type in types.ts to avoid cycles — prefer exporting `RegistrarCredentials` from `domainHubCredentials.ts` and importing in types/compare)
- Modify: `backend/src/lib/registrars/cloudflare.ts` — `checkCloudflareOffers(domains, creds: RegistrarCredentials)`
- Modify: `backend/src/lib/registrars/hostinger.ts` — same
- Modify: `backend/src/lib/registrars/ovh.ts` — `checkOvhOffer(domain, creds)` + pass subsidiary from creds
- Modify: `backend/src/lib/registrars/compare.ts` — pass `input.credentials`
- Modify: `backend/src/routes/domains.ts` — load creds for `req.user!.id` on compare + sync Hostinger
- Test: extend `backend/src/__tests__/routes/domains.test.ts` or add compare unit with mocked fetch

**Interfaces:**
- Consumes: `toRegistrarCredentials`, `getCredentialsRow`, `isHostingerConfigured`
- Produces: registrars that never read `process.env.CLOUDFLARE_*` / `HOSTINGER_*` / `OVH_*`

- [ ] **Step 1: Write failing test** — sync Hostinger without user token returns 400 even if env has token

```typescript
  it('sync Hostinger uses user credentials not env', async () => {
    process.env.HOSTINGER_API_TOKEN = 'env-should-be-ignored';
    const res = await request(app)
      .post('/api/domains/sync/hostinger')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Hostinger/i);
  });
```

(Ensure `DOMAIN_HUB_ENABLED=true` in that suite’s beforeEach if not already.)

- [ ] **Step 2: Run — expect FAIL** (still uses env → 502 or success)

- [ ] **Step 3: Update registrar functions**

Cloudflare signature change:

```typescript
export async function checkCloudflareOffers(
  domains: string[],
  creds: RegistrarCredentials
): Promise<Map<string, RegistrarOffer>> {
  const token = creds.cloudflareApiToken;
  const accountId = creds.cloudflareAccountId;
  if (!token || !accountId) {
    const skipped = skippedOffer('cloudflare', 'Clés Cloudflare non configurées — ajoutez-les dans Mon compte');
    // ...
  }
  // use token/accountId instead of process.env
}
```

Hostinger / OVH: same pattern. OVH `getSubsidiary()` → `creds.ovhSubsidiary || 'FR'`. Pass secrets into `ovhRequest` via parameters instead of reading env inside.

`compareDomains`:

```typescript
const creds = input.credentials ?? {
  cloudflareApiToken: null,
  cloudflareAccountId: null,
  hostingerApiToken: null,
  ovhAppKey: null,
  ovhAppSecret: null,
  ovhConsumerKey: null,
  ovhSubsidiary: null,
};
// pass creds to checkCloudflareOffers / checkHostingerOffers / safeOvh
```

`domains.ts` compare handler:

```typescript
const creds = toRegistrarCredentials(getCredentialsRow(req.user!.id));
const result = await compareDomains({ name, tlds, registrars, includeO2switch, credentials: creds });
```

Sync Hostinger:

```typescript
const creds = toRegistrarCredentials(getCredentialsRow(req.user!.id));
if (!creds.hostingerApiToken) {
  return res.status(400).json({ error: 'Token Hostinger non configuré — ajoutez-le dans Mon compte → Domain Hub' });
}
// fetch with Authorization: Bearer ${creds.hostingerApiToken}
```

- [ ] **Step 4: Run domains + credentials tests — expect PASS**

Run: `cd backend && npx vitest run src/__tests__/routes/domains.test.ts src/__tests__/routes/domainHubCredentials.test.ts src/__tests__/lib/domainHubCredentials.test.ts src/__tests__/registrars/types.test.ts`

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/registrars backend/src/routes/domains.ts backend/src/__tests__/routes/domains.test.ts
git commit -m "feat(domains): use per-user registrar credentials at runtime"
```

---

### Task 4: Account UI — onglet Domain Hub

**Files:**
- Modify: `src/pages/Account.tsx`
- Optional create: `src/hooks/useDomainHubCredentials.ts` (only if it keeps Account.tsx smaller; otherwise inline)

**Interfaces:**
- Consumes: `GET/PUT /account/domain-hub-credentials`, `useFeatureFlags().domainHubEnabled`
- Deep link: `?tab=domain-hub` → controlled Tabs value

- [ ] **Step 1: Add types + state + load/save** (same pattern as SMTP)

```typescript
interface DomainHubCredentialsForm {
  cloudflareApiToken: string;
  cloudflareAccountId: string;
  hostingerApiToken: string;
  ovhAppKey: string;
  ovhAppSecret: string;
  ovhConsumerKey: string;
  ovhSubsidiary: string;
  configured: { cloudflare: boolean; hostinger: boolean; ovh: boolean };
}
```

Load when `domainHubEnabled` and tab selected (or on mount if flag on).

- [ ] **Step 2: Controlled tabs + trigger**

```typescript
const [tab, setTab] = useState(() => {
  const q = new URLSearchParams(window.location.search).get('tab');
  return q === 'domain-hub' ? 'domain-hub' : 'profil';
});
```

Adjust `TabsList` grid cols: `domainHubEnabled ? 6 : 5`. Conditionally render `TabsTrigger value="domain-hub"` with `KeyRound` or `Globe`.

- [ ] **Step 3: TabsContent** — 3 Card sections (Cloudflare, Hostinger, OVH), password-style inputs for secrets, helper text, save button. If `!configured.cloudflare && !configured.hostinger && !configured.ovh`, show alert:

« Ajoutez au moins un registrar pour utiliser Domain Hub. »

- [ ] **Step 4: Manual smoke** — flag on → onglet visible; save Cloudflare → GET shows `***` and configured true.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Account.tsx src/hooks/useDomainHubCredentials.ts
git commit -m "feat(account): Domain Hub credentials tab"
```

---

### Task 5: Domain Hub banner + polish

**Files:**
- Modify: `src/pages/tools/DomainHub.tsx`
- Optional: small fetch of `/account/domain-hub-credentials` for `configured` only

- [ ] **Step 1: On mount (if authenticated), load credentials public payload**

If all `configured.*` false, render banner above tabs:

```tsx
<div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm mb-4">
  <p>Aucune clé registrar configurée. Ajoutez Cloudflare, Hostinger ou OVH pour comparer et synchroniser.</p>
  <Button variant="link" className="px-0" onClick={() => navigate('/account?tab=domain-hub')}>
    Configurer dans Mon compte
  </Button>
</div>
```

- [ ] **Step 2: Soften Hostinger sync error toast** to mention Mon compte when relevant (already may say HOSTINGER_API_TOKEN — update copy).

- [ ] **Step 3: Commit**

```bash
git add src/pages/tools/DomainHub.tsx
git commit -m "feat(domain-hub): prompt users to add registrar API keys"
```

---

### Task 6: Regression + PR

- [ ] **Step 1: Full backend tests**

Run: `cd backend && npx vitest run`  
Expected: all PASS

- [ ] **Step 2: Frontend lint on touched files**

Run: `npx eslint src/pages/Account.tsx src/pages/tools/DomainHub.tsx`

- [ ] **Step 3: Push branch + open PR**

```bash
git push -u origin HEAD
gh pr create --title "feat(domain-hub): per-user registrar API keys in Account" --body "$(cat <<'EOF'
## Summary
- Clés Cloudflare / Hostinger / OVH par utilisateur (table + API compte)
- Plus de fallback env pour les appels registrar
- Onglet Mon compte + bannière Domain Hub

## Spec
docs/superpowers/specs/2026-08-16-domain-hub-user-credentials-design.md

## Test plan
- [ ] DOMAIN_HUB_ENABLED=false : pas d'onglet, API 404
- [ ] Sans clés : bannière Domain Hub + message Account
- [ ] Saisir Cloudflare → compare fonctionne
- [ ] Second user ne partage pas les clés
- [ ] Sync Hostinger sans token user → 400 (même si env Coolify a un token)
EOF
)"
```

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| Table per user | 1 |
| GET/PUT masked, `***` / `""` | 1–2 |
| 404 when flag off | 2 |
| Registrars use user creds, no env | 3 |
| Account tab + deep link | 4 |
| Domain Hub banner CTA | 5 |
| No AES / no test buttons | respected (omitted) |

## Placeholder scan

None intentional. All steps include concrete code/commands.
