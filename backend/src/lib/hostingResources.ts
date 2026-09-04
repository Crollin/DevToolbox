import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';

export type HostingResourceRow = {
  id: string;
  user_id: string;
  kind: string;
  label: string;
  provider: string;
  external_id: string | null;
  plan: string | null;
  hostname: string | null;
  ipv4: string | null;
  state: string | null;
  client_name: string | null;
  client_email: string | null;
  payer: string;
  cost_yearly: number | null;
  sell_yearly: number | null;
  currency: string;
  expires_at: string | null;
  notes: string | null;
  notifications_enabled: number;
  billing_status: string;
  last_billed_at: string | null;
  created_at: string;
  updated_at: string;
};

function defaultBillingStatus(payer: string): string {
  return payer === 'agency' ? 'n/a' : 'pending';
}

export function serializeHostingResource(row: HostingResourceRow) {
  return {
    id: row.id,
    kind: row.kind as 'vps' | 'hosting',
    label: row.label,
    provider: row.provider as 'hostinger' | 'other',
    externalId: row.external_id,
    plan: row.plan,
    hostname: row.hostname,
    ipv4: row.ipv4,
    state: row.state,
    clientName: row.client_name,
    clientEmail: row.client_email,
    payer: row.payer as 'agency' | 'client',
    costYearly: row.cost_yearly,
    sellYearly: row.sell_yearly,
    currency: row.currency,
    expiresAt: row.expires_at,
    notes: row.notes,
    notificationsEnabled: Boolean(row.notifications_enabled),
    billingStatus: row.billing_status || defaultBillingStatus(row.payer),
    lastBilledAt: row.last_billed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function emptyToNull(v: string | null | undefined): string | null {
  if (v === undefined || v === null || v === '') return null;
  return v;
}

export function listHostingResources(userId: string) {
  const rows = db.prepare(`
    SELECT * FROM hosting_resources
    WHERE user_id = ?
    ORDER BY kind ASC, label ASC
  `).all(userId) as HostingResourceRow[];
  return rows.map(serializeHostingResource);
}

type SyncInventory = {
  kind: 'vps' | 'hosting';
  label: string;
  externalId: string;
  plan?: string | null;
  hostname?: string | null;
  ipv4?: string | null;
  state?: string | null;
};

/** Upsert inventory fields only; never overwrite client/billing/pricing. */
export function upsertHostingResourceFromSync(
  userId: string,
  item: SyncInventory
): 'created' | 'updated' {
  const now = new Date().toISOString();
  const existing = db.prepare(`
    SELECT id FROM hosting_resources
    WHERE user_id = ? AND provider = 'hostinger' AND kind = ? AND external_id = ?
  `).get(userId, item.kind, item.externalId) as { id: string } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE hosting_resources SET
        plan = COALESCE(?, plan),
        hostname = COALESCE(?, hostname),
        ipv4 = COALESCE(?, ipv4),
        state = COALESCE(?, state),
        updated_at = ?
      WHERE id = ?
    `).run(
      item.plan ?? null,
      item.hostname ?? null,
      item.ipv4 ?? null,
      item.state ?? null,
      now,
      existing.id
    );
    return 'updated';
  }

  db.prepare(`
    INSERT INTO hosting_resources (
      id, user_id, kind, label, provider, external_id, plan, hostname, ipv4, state,
      client_name, client_email, payer, cost_yearly, sell_yearly, currency, expires_at,
      notes, notifications_enabled, billing_status, last_billed_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'hostinger', ?, ?, ?, ?, ?, NULL, NULL, 'agency', NULL, NULL, 'EUR', NULL, NULL, 1, 'n/a', NULL, ?, ?)
  `).run(
    uuidv4(),
    userId,
    item.kind,
    item.label,
    item.externalId,
    item.plan ?? null,
    item.hostname ?? null,
    item.ipv4 ?? null,
    item.state ?? null,
    now,
    now
  );
  return 'created';
}

export async function fetchHostingerJson<T>(
  token: string,
  path: string
): Promise<{ ok: true; data: T } | { ok: false; status: number; detail: string }> {
  const apiRes = await fetch(`https://developers.hostinger.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!apiRes.ok) {
    const text = await apiRes.text().catch(() => '');
    return { ok: false, status: apiRes.status, detail: text.slice(0, 200) };
  }
  return { ok: true, data: (await apiRes.json()) as T };
}

type HostingerPaginatedPayload<T> = {
  data?: T[];
  meta?: {
    current_page?: number;
    per_page?: number;
    total?: number;
  };
};

export function unwrapHostingerList<T>(
  payload: T[] | HostingerPaginatedPayload<T> | null | undefined
): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return payload.data || [];
}

export async function fetchAllHostingerPages<T>(
  token: string,
  path: string
): Promise<{ ok: true; data: T[] } | { ok: false; status: number; detail: string }> {
  const items: T[] = [];
  let page = 1;

  while (true) {
    const separator = path.includes('?') ? '&' : '?';
    const result = await fetchHostingerJson<T[] | HostingerPaginatedPayload<T>>(
      token,
      `${path}${separator}page=${page}`
    );
    if (!result.ok) return result;

    const pageItems = unwrapHostingerList(result.data);
    items.push(...pageItems);

    if (Array.isArray(result.data) || !result.data.meta) {
      return { ok: true, data: items };
    }

    const total = result.data.meta.total;
    if (total === undefined || items.length >= total || pageItems.length === 0) {
      return { ok: true, data: items };
    }

    page += 1;
  }
}
