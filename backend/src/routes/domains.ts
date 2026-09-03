import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { authenticateTokenOrPersonalAccessToken } from '../middleware/auth';
import {
  validateBody,
  domainCompareSchema,
  domainPortfolioCreateSchema,
  domainPortfolioUpdateSchema,
  domainBillingUpdateSchema,
  domainBillingExportQuerySchema,
  hostingResourceCreateSchema,
  hostingResourceUpdateSchema,
} from '../lib/validate';
import { compareDomains } from '../lib/registrars/compare';
import { getCredentialsRow, toRegistrarCredentials } from '../lib/domainHubCredentials';
import { buildBillingCsv, filterBillingRows, type BillingExportRow } from '../lib/domainBillingExport';
import {
  fetchHostingerJson,
  listHostingResources,
  serializeHostingResource,
  unwrapHostingerList,
  upsertHostingResourceFromSync,
  type HostingResourceRow,
} from '../lib/hostingResources';

const router = express.Router();

router.use(authenticateTokenOrPersonalAccessToken('domains'));

type DomainRow = {
  id: string;
  user_id: string;
  name: string;
  registrar: string;
  client_name: string | null;
  client_email: string | null;
  payer: string;
  cost_yearly: number | null;
  sell_yearly: number | null;
  currency: string;
  expires_at: string | null;
  auto_renew: number;
  notes: string | null;
  external_id: string | null;
  notifications_enabled: number;
  billing_status: string;
  last_billed_at: string | null;
  created_at: string;
  updated_at: string;
};

function defaultBillingStatus(payer: string): string {
  return payer === 'agency' ? 'n/a' : 'pending';
}

function serializeDomain(row: DomainRow) {
  return {
    id: row.id,
    name: row.name,
    registrar: row.registrar,
    clientName: row.client_name,
    clientEmail: row.client_email,
    payer: row.payer,
    costYearly: row.cost_yearly,
    sellYearly: row.sell_yearly,
    currency: row.currency,
    expiresAt: row.expires_at,
    autoRenew: Boolean(row.auto_renew),
    notes: row.notes,
    externalId: row.external_id,
    notificationsEnabled: Boolean(row.notifications_enabled),
    billingStatus: row.billing_status || defaultBillingStatus(row.payer),
    lastBilledAt: row.last_billed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function emptyToNull(v: string | null | undefined): string | null {
  if (v === undefined || v === null || v === '') return null;
  return v;
}

// -------------------------
// Compare (V1)
// -------------------------
router.post('/compare', validateBody(domainCompareSchema), async (req, res) => {
  try {
    const { name, tlds, registrars, includeO2switch } = req.body as {
      name: string;
      tlds?: string[];
      registrars?: Array<'cloudflare' | 'hostinger' | 'ovh'>;
      includeO2switch?: boolean;
    };
    const creds = toRegistrarCredentials(getCredentialsRow(req.user!.id));
    const result = await compareDomains({ name, tlds, registrars, includeO2switch, credentials: creds });
    res.json(result);
  } catch (error) {
    console.error('Erreur domains/compare:', error);
    res.status(500).json({ error: 'Erreur lors de la comparaison des domaines' });
  }
});

// -------------------------
// Portfolio CRUD (V2)
// -------------------------
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM domains
      WHERE user_id = ?
      ORDER BY (expires_at IS NULL), expires_at ASC, name ASC
    `).all(req.user!.id) as DomainRow[];

    res.json({ domains: rows.map(serializeDomain) });
  } catch (error) {
    console.error('Erreur domains list:', error);
    res.status(500).json({ error: 'Erreur lors du chargement du portefeuille' });
  }
});

router.post('/', validateBody(domainPortfolioCreateSchema), (req, res) => {
  try {
    const body = req.body as {
      name: string;
      registrar: string;
      clientName?: string | null;
      clientEmail?: string | null;
      payer?: string;
      costYearly?: number | null;
      sellYearly?: number | null;
      currency?: string;
      expiresAt?: string | null;
      autoRenew?: boolean;
      notes?: string | null;
      externalId?: string | null;
      notificationsEnabled?: boolean;
      billingStatus?: string;
    };

    const id = uuidv4();
    const now = new Date().toISOString();
    const payer = body.payer || 'agency';
    const billingStatus =
      body.billingStatus || defaultBillingStatus(payer);

    db.prepare(`
      INSERT INTO domains (
        id, user_id, name, registrar, client_name, client_email, payer,
        cost_yearly, sell_yearly, currency, expires_at, auto_renew, notes,
        external_id, notifications_enabled, billing_status, last_billed_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
    `).run(
      id,
      req.user!.id,
      body.name.trim().toLowerCase(),
      body.registrar,
      emptyToNull(body.clientName),
      emptyToNull(body.clientEmail),
      payer,
      body.costYearly ?? null,
      body.sellYearly ?? null,
      body.currency || 'EUR',
      emptyToNull(body.expiresAt),
      body.autoRenew ? 1 : 0,
      emptyToNull(body.notes),
      emptyToNull(body.externalId),
      body.notificationsEnabled === false ? 0 : 1,
      billingStatus,
      now,
      now
    );

    const row = db.prepare('SELECT * FROM domains WHERE id = ?').get(id) as DomainRow;
    res.status(201).json({ domain: serializeDomain(row) });
  } catch (error) {
    console.error('Erreur domains create:', error);
    res.status(500).json({ error: 'Erreur lors de la création du domaine' });
  }
});

// -------------------------
// Hosting resources (VPS / comptes web)
// -------------------------
router.get('/resources', (req, res) => {
  try {
    res.json({ resources: listHostingResources(req.user!.id) });
  } catch (error) {
    console.error('Erreur hosting resources list:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des ressources' });
  }
});

router.post('/resources', validateBody(hostingResourceCreateSchema), (req, res) => {
  try {
    const body = req.body as {
      kind: 'vps' | 'hosting';
      label: string;
      provider?: string;
      externalId?: string | null;
      plan?: string | null;
      hostname?: string | null;
      ipv4?: string | null;
      state?: string | null;
      clientName?: string | null;
      clientEmail?: string | null;
      payer?: string;
      costYearly?: number | null;
      sellYearly?: number | null;
      currency?: string;
      expiresAt?: string | null;
      notes?: string | null;
      notificationsEnabled?: boolean;
      billingStatus?: string;
    };

    const id = uuidv4();
    const now = new Date().toISOString();
    const payer = body.payer || 'agency';
    const billingStatus = body.billingStatus || (payer === 'agency' ? 'n/a' : 'pending');

    db.prepare(`
      INSERT INTO hosting_resources (
        id, user_id, kind, label, provider, external_id, plan, hostname, ipv4, state,
        client_name, client_email, payer, cost_yearly, sell_yearly, currency, expires_at,
        notes, notifications_enabled, billing_status, last_billed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
    `).run(
      id,
      req.user!.id,
      body.kind,
      body.label.trim(),
      body.provider || 'hostinger',
      emptyToNull(body.externalId),
      emptyToNull(body.plan),
      emptyToNull(body.hostname),
      emptyToNull(body.ipv4),
      emptyToNull(body.state),
      emptyToNull(body.clientName),
      emptyToNull(body.clientEmail),
      payer,
      body.costYearly ?? null,
      body.sellYearly ?? null,
      body.currency || 'EUR',
      emptyToNull(body.expiresAt),
      emptyToNull(body.notes),
      body.notificationsEnabled === false ? 0 : 1,
      billingStatus,
      now,
      now
    );

    const row = db.prepare('SELECT * FROM hosting_resources WHERE id = ?').get(id) as HostingResourceRow;
    res.status(201).json({ resource: serializeHostingResource(row) });
  } catch (error) {
    console.error('Erreur hosting resource create:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la ressource' });
  }
});

router.put('/resources/:id', validateBody(hostingResourceUpdateSchema), (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM hosting_resources WHERE id = ? AND user_id = ?').get(
      req.params.id,
      req.user!.id
    ) as HostingResourceRow | undefined;

    if (!existing) {
      return res.status(404).json({ error: 'Ressource introuvable' });
    }

    const body = req.body as Partial<{
      label: string;
      provider: string;
      externalId: string | null;
      plan: string | null;
      hostname: string | null;
      ipv4: string | null;
      state: string | null;
      clientName: string | null;
      clientEmail: string | null;
      payer: string;
      costYearly: number | null;
      sellYearly: number | null;
      currency: string;
      expiresAt: string | null;
      notes: string | null;
      notificationsEnabled: boolean;
      billingStatus: string;
    }>;

    const now = new Date().toISOString();
    const payer = body.payer ?? existing.payer;
    const billingStatus =
      body.billingStatus ??
      (body.payer !== undefined
        ? payer === 'agency'
          ? 'n/a'
          : 'pending'
        : existing.billing_status);

    db.prepare(`
      UPDATE hosting_resources SET
        label = ?, provider = ?, external_id = ?, plan = ?, hostname = ?, ipv4 = ?, state = ?,
        client_name = ?, client_email = ?, payer = ?, cost_yearly = ?, sell_yearly = ?,
        currency = ?, expires_at = ?, notes = ?, notifications_enabled = ?, billing_status = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      body.label !== undefined ? body.label.trim() : existing.label,
      body.provider ?? existing.provider,
      body.externalId !== undefined ? emptyToNull(body.externalId) : existing.external_id,
      body.plan !== undefined ? emptyToNull(body.plan) : existing.plan,
      body.hostname !== undefined ? emptyToNull(body.hostname) : existing.hostname,
      body.ipv4 !== undefined ? emptyToNull(body.ipv4) : existing.ipv4,
      body.state !== undefined ? emptyToNull(body.state) : existing.state,
      body.clientName !== undefined ? emptyToNull(body.clientName) : existing.client_name,
      body.clientEmail !== undefined ? emptyToNull(body.clientEmail) : existing.client_email,
      payer,
      body.costYearly !== undefined ? body.costYearly : existing.cost_yearly,
      body.sellYearly !== undefined ? body.sellYearly : existing.sell_yearly,
      body.currency ?? existing.currency,
      body.expiresAt !== undefined ? emptyToNull(body.expiresAt) : existing.expires_at,
      body.notes !== undefined ? emptyToNull(body.notes) : existing.notes,
      body.notificationsEnabled !== undefined
        ? body.notificationsEnabled
          ? 1
          : 0
        : existing.notifications_enabled,
      billingStatus,
      now,
      req.params.id,
      req.user!.id
    );

    const row = db.prepare('SELECT * FROM hosting_resources WHERE id = ?').get(req.params.id) as HostingResourceRow;
    res.json({ resource: serializeHostingResource(row) });
  } catch (error) {
    console.error('Erreur hosting resource update:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la ressource' });
  }
});

router.delete('/resources/:id', (req, res) => {
  try {
    const result = db
      .prepare('DELETE FROM hosting_resources WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user!.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Ressource introuvable' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur hosting resource delete:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la ressource' });
  }
});

router.patch('/resources/:id/billing', validateBody(domainBillingUpdateSchema), (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM hosting_resources WHERE id = ? AND user_id = ?').get(
      req.params.id,
      req.user!.id
    ) as HostingResourceRow | undefined;

    if (!existing) {
      return res.status(404).json({ error: 'Ressource introuvable' });
    }

    const { billingStatus } = req.body as { billingStatus: string };
    const now = new Date().toISOString();
    const lastBilledAt =
      billingStatus === 'invoiced' || billingStatus === 'paid' ? now : existing.last_billed_at;

    db.prepare(`
      UPDATE hosting_resources SET billing_status = ?, last_billed_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(billingStatus, lastBilledAt, now, req.params.id, req.user!.id);

    const row = db.prepare('SELECT * FROM hosting_resources WHERE id = ?').get(req.params.id) as HostingResourceRow;
    res.json({ resource: serializeHostingResource(row) });
  } catch (error) {
    console.error('Erreur hosting resource billing:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
});

router.put('/:id', validateBody(domainPortfolioUpdateSchema), (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM domains WHERE id = ? AND user_id = ?').get(
      req.params.id,
      req.user!.id
    ) as DomainRow | undefined;

    if (!existing) {
      return res.status(404).json({ error: 'Domaine introuvable' });
    }

    const body = req.body as Partial<{
      name: string;
      registrar: string;
      clientName: string | null;
      clientEmail: string | null;
      payer: string;
      costYearly: number | null;
      sellYearly: number | null;
      currency: string;
      expiresAt: string | null;
      autoRenew: boolean;
      notes: string | null;
      externalId: string | null;
      notificationsEnabled: boolean;
      billingStatus: string;
    }>;

    const now = new Date().toISOString();
    const payer = body.payer ?? existing.payer;
    const billingStatus =
      body.billingStatus ??
      (body.payer !== undefined
        ? defaultBillingStatus(payer)
        : existing.billing_status || defaultBillingStatus(payer));

    db.prepare(`
      UPDATE domains SET
        name = ?, registrar = ?, client_name = ?, client_email = ?, payer = ?,
        cost_yearly = ?, sell_yearly = ?, currency = ?, expires_at = ?, auto_renew = ?,
        notes = ?, external_id = ?, notifications_enabled = ?, billing_status = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      body.name !== undefined ? body.name.trim().toLowerCase() : existing.name,
      body.registrar ?? existing.registrar,
      body.clientName !== undefined ? emptyToNull(body.clientName) : existing.client_name,
      body.clientEmail !== undefined ? emptyToNull(body.clientEmail) : existing.client_email,
      payer,
      body.costYearly !== undefined ? body.costYearly : existing.cost_yearly,
      body.sellYearly !== undefined ? body.sellYearly : existing.sell_yearly,
      body.currency ?? existing.currency,
      body.expiresAt !== undefined ? emptyToNull(body.expiresAt) : existing.expires_at,
      body.autoRenew !== undefined ? (body.autoRenew ? 1 : 0) : existing.auto_renew,
      body.notes !== undefined ? emptyToNull(body.notes) : existing.notes,
      body.externalId !== undefined ? emptyToNull(body.externalId) : existing.external_id,
      body.notificationsEnabled !== undefined
        ? (body.notificationsEnabled ? 1 : 0)
        : existing.notifications_enabled,
      billingStatus,
      now,
      req.params.id,
      req.user!.id
    );

    const row = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id) as DomainRow;
    res.json({ domain: serializeDomain(row) });
  } catch (error) {
    console.error('Erreur domains update:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du domaine' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db
      .prepare('DELETE FROM domains WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user!.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Domaine introuvable' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur domains delete:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du domaine' });
  }
});

// Sync Hostinger: domaines + VPS + comptes hébergement
router.post('/sync/hostinger', async (req, res) => {
  try {
    const creds = toRegistrarCredentials(getCredentialsRow(req.user!.id));
    if (!creds.hostingerApiToken) {
      return res.status(400).json({
        error: 'Token Hostinger non configuré — ajoutez-le dans Mon compte → Domain Hub',
      });
    }

    const token = creds.hostingerApiToken;
    const userId = req.user!.id;
    const now = new Date().toISOString();
    const report = {
      domains: { synced: 0, updated: 0, created: 0, error: null as string | null },
      vps: { synced: 0, updated: 0, created: 0, error: null as string | null },
      hosting: { synced: 0, updated: 0, created: 0, error: null as string | null },
    };

    // Domains portfolio
    const domainsRes = await fetchHostingerJson<
      | Array<{ domain?: string; expires_at?: string; id?: string | number }>
      | { data?: Array<{ domain?: string; expires_at?: string; id?: string | number }> }
    >(token, '/api/domains/v1/portfolio');

    if (!domainsRes.ok) {
      report.domains.error = `HTTP ${domainsRes.status}`;
    } else {
      const items = unwrapHostingerList(domainsRes.data);
      report.domains.synced = items.length;
      for (const item of items) {
        const name = (item.domain || '').toLowerCase();
        if (!name) continue;
        const expiresAt = item.expires_at || null;
        const externalId = item.id != null ? String(item.id) : null;
        const existing = db
          .prepare('SELECT id FROM domains WHERE user_id = ? AND name = ?')
          .get(userId, name) as { id: string } | undefined;

        if (existing) {
          db.prepare(`
            UPDATE domains SET expires_at = COALESCE(?, expires_at), external_id = COALESCE(?, external_id),
              registrar = 'hostinger', updated_at = ?
            WHERE id = ?
          `).run(expiresAt, externalId, now, existing.id);
          report.domains.updated += 1;
        } else {
          db.prepare(`
            INSERT INTO domains (
              id, user_id, name, registrar, client_name, client_email, payer,
              cost_yearly, sell_yearly, currency, expires_at, auto_renew, notes,
              external_id, notifications_enabled, billing_status, last_billed_at,
              created_at, updated_at
            ) VALUES (?, ?, ?, 'hostinger', NULL, NULL, 'agency', NULL, NULL, 'EUR', ?, 0, NULL, ?, 1, 'n/a', NULL, ?, ?)
          `).run(uuidv4(), userId, name, expiresAt, externalId, now, now);
          report.domains.created += 1;
        }
      }
    }

    // VPS
    const vpsRes = await fetchHostingerJson<
      | Array<{
          id?: number;
          hostname?: string;
          plan?: string;
          state?: string;
          ipv4?: Array<{ address?: string }>;
        }>
      | {
          data?: Array<{
            id?: number;
            hostname?: string;
            plan?: string;
            state?: string;
            ipv4?: Array<{ address?: string }>;
          }>;
        }
    >(token, '/api/vps/v1/virtual-machines');

    if (!vpsRes.ok) {
      report.vps.error = `HTTP ${vpsRes.status}`;
    } else {
      const items = unwrapHostingerList(vpsRes.data);
      report.vps.synced = items.length;
      for (const vm of items) {
        if (vm.id == null) continue;
        const result = upsertHostingResourceFromSync(userId, {
          kind: 'vps',
          externalId: String(vm.id),
          label: vm.hostname || `VPS ${vm.id}`,
          plan: vm.plan || null,
          hostname: vm.hostname || null,
          ipv4: vm.ipv4?.[0]?.address || null,
          state: vm.state || null,
        });
        if (result === 'created') report.vps.created += 1;
        else report.vps.updated += 1;
      }
    }

    // Hosting orders (1 row per account)
    const ordersRes = await fetchHostingerJson<
      | Array<{ id?: number; plan?: { name?: string }; status?: string }>
      | { data?: Array<{ id?: number; plan?: { name?: string }; status?: string }> }
    >(token, '/api/hosting/v1/orders?per_page=100');

    if (!ordersRes.ok) {
      report.hosting.error = `HTTP ${ordersRes.status}`;
    } else {
      const items = unwrapHostingerList(ordersRes.data).filter(
        (o) => o.status === 'active' || o.status === undefined
      );
      report.hosting.synced = items.length;
      for (const order of items) {
        if (order.id == null) continue;
        const planName = order.plan?.name || `Order ${order.id}`;
        const result = upsertHostingResourceFromSync(userId, {
          kind: 'hosting',
          externalId: String(order.id),
          label: planName,
          plan: planName,
          state: order.status || 'active',
        });
        if (result === 'created') report.hosting.created += 1;
        else report.hosting.updated += 1;
      }
    }

    const allFailed = Boolean(
      report.domains.error && report.vps.error && report.hosting.error
    );
    if (allFailed) {
      return res.status(502).json({
        error: 'Sync Hostinger échouée',
        ...report,
      });
    }

    // Backward-compatible top-level counts (domains)
    res.json({
      synced: report.domains.synced,
      updated: report.domains.updated,
      created: report.domains.created,
      ...report,
    });
  } catch (error) {
    console.error('Erreur sync hostinger:', error);
    res.status(500).json({ error: 'Erreur lors de la synchronisation Hostinger' });
  }
});

// Export CSV facturation
router.get('/export/billing.csv', (req, res) => {
  try {
    const parsed = domainBillingExportQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Paramètres invalides' });
    }

    const rows = db.prepare(`
      SELECT name, registrar, client_name, client_email, payer,
             sell_yearly, cost_yearly, currency, expires_at, billing_status
      FROM domains WHERE user_id = ?
    `).all(req.user!.id) as BillingExportRow[];

    const filtered = filterBillingRows(rows, parsed.data);
    const csv = buildBillingCsv(filtered);
    const filename = `domaines-facturation-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Erreur export billing CSV:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export CSV' });
  }
});

// Mise à jour statut facturation
router.patch('/:id/billing', validateBody(domainBillingUpdateSchema), (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM domains WHERE id = ? AND user_id = ?').get(
      req.params.id,
      req.user!.id
    ) as DomainRow | undefined;

    if (!existing) {
      return res.status(404).json({ error: 'Domaine introuvable' });
    }

    const { billingStatus } = req.body as { billingStatus: string };
    const now = new Date().toISOString();
    const lastBilledAt =
      billingStatus === 'invoiced' || billingStatus === 'paid' ? now : existing.last_billed_at;

    db.prepare(`
      UPDATE domains SET billing_status = ?, last_billed_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(billingStatus, lastBilledAt, now, req.params.id, req.user!.id);

    const row = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id) as DomainRow;
    res.json({ domain: serializeDomain(row) });
  } catch (error) {
    console.error('Erreur billing status:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut facturation' });
  }
});

export default router;
