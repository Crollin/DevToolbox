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
} from '../lib/validate';
import { compareDomains } from '../lib/registrars/compare';
import { buildBillingCsv, filterBillingRows, type BillingExportRow } from '../lib/domainBillingExport';

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
    const result = await compareDomains({ name, tlds, registrars, includeO2switch });
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
      SELECT * FROM domains WHERE user_id = ? ORDER BY name ASC
    `).all(req.user!.id) as DomainRow[];

    rows.sort((a, b) => {
      if (!a.expires_at && !b.expires_at) return a.name.localeCompare(b.name);
      if (!a.expires_at) return 1;
      if (!b.expires_at) return -1;
      return a.expires_at.localeCompare(b.expires_at) || a.name.localeCompare(b.name);
    });

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
    const name = body.name !== undefined ? body.name.trim().toLowerCase() : existing.name;
    const registrar = body.registrar ?? existing.registrar;
    const clientName =
      body.clientName !== undefined ? emptyToNull(body.clientName) : existing.client_name;
    const clientEmail =
      body.clientEmail !== undefined ? emptyToNull(body.clientEmail) : existing.client_email;
    const payer = body.payer ?? existing.payer;
    const costYearly = body.costYearly !== undefined ? body.costYearly : existing.cost_yearly;
    const sellYearly = body.sellYearly !== undefined ? body.sellYearly : existing.sell_yearly;
    const currency = body.currency ?? existing.currency;
    const expiresAt =
      body.expiresAt !== undefined ? emptyToNull(body.expiresAt) : existing.expires_at;
    const autoRenew =
      body.autoRenew !== undefined ? (body.autoRenew ? 1 : 0) : existing.auto_renew;
    const notes = body.notes !== undefined ? emptyToNull(body.notes) : existing.notes;
    const externalId =
      body.externalId !== undefined ? emptyToNull(body.externalId) : existing.external_id;
    const notificationsEnabled =
      body.notificationsEnabled !== undefined
        ? body.notificationsEnabled
          ? 1
          : 0
        : existing.notifications_enabled;
    const billingStatus =
      body.billingStatus !== undefined
        ? body.billingStatus
        : body.payer !== undefined
          ? defaultBillingStatus(payer)
          : existing.billing_status || defaultBillingStatus(payer);

    db.prepare(`
      UPDATE domains SET
        name = ?, registrar = ?, client_name = ?, client_email = ?, payer = ?,
        cost_yearly = ?, sell_yearly = ?, currency = ?, expires_at = ?, auto_renew = ?,
        notes = ?, external_id = ?, notifications_enabled = ?, billing_status = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      name,
      registrar,
      clientName,
      clientEmail,
      payer,
      costYearly,
      sellYearly,
      currency,
      expiresAt,
      autoRenew,
      notes,
      externalId,
      notificationsEnabled,
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

// Sync expiration from Hostinger portfolio (best-effort)
router.post('/sync/hostinger', async (req, res) => {
  try {
    const token = process.env.HOSTINGER_API_TOKEN;
    if (!token) {
      return res.status(400).json({ error: 'HOSTINGER_API_TOKEN non configuré' });
    }

    const apiRes = await fetch('https://developers.hostinger.com/api/domains/v1/portfolio', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!apiRes.ok) {
      const text = await apiRes.text().catch(() => '');
      return res.status(502).json({ error: `Hostinger HTTP ${apiRes.status}`, detail: text.slice(0, 200) });
    }

    const data = (await apiRes.json()) as
      | Array<{ domain?: string; expires_at?: string; id?: string | number }>
      | { data?: Array<{ domain?: string; expires_at?: string; id?: string | number }> };

    const items = Array.isArray(data) ? data : data.data || [];
    let updated = 0;
    let created = 0;
    const now = new Date().toISOString();
    const userId = req.user!.id;

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
        updated += 1;
      } else {
        db.prepare(`
          INSERT INTO domains (
            id, user_id, name, registrar, client_name, client_email, payer,
            cost_yearly, sell_yearly, currency, expires_at, auto_renew, notes,
            external_id, notifications_enabled, billing_status, last_billed_at,
            created_at, updated_at
          ) VALUES (?, ?, ?, 'hostinger', NULL, NULL, 'agency', NULL, NULL, 'EUR', ?, 0, NULL, ?, 1, 'n/a', NULL, ?, ?)
        `).run(uuidv4(), userId, name, expiresAt, externalId, now, now);
        created += 1;
      }
    }

    res.json({ synced: items.length, updated, created });
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
