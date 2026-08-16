export interface BillingExportRow {
  name: string;
  registrar: string;
  client_name: string | null;
  client_email: string | null;
  payer: string;
  sell_yearly: number | null;
  cost_yearly: number | null;
  currency: string;
  expires_at: string | null;
  billing_status: string;
}

const VAT_RATE = 0.2;
const DUE_DAYS = 30;

const CSV_HEADERS = [
  'client_name',
  'client_email',
  'description',
  'quantity',
  'unit_price_ht',
  'vat_rate',
  'currency',
  'due_date',
  'domain',
  'registrar',
  'expires_at',
] as const;

export function escapeCsvField(value: string): string {
  if (value.includes('"') || value.includes(';') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function getUnitPrice(row: BillingExportRow): number | null {
  const amount = row.sell_yearly ?? row.cost_yearly;
  if (amount == null || amount <= 0) return null;
  return amount;
}

function computeDueDate(expiresAt: string | null): string {
  if (expiresAt) {
    return expiresAt.slice(0, 10);
  }
  const due = new Date();
  due.setDate(due.getDate() + DUE_DAYS);
  return due.toISOString().slice(0, 10);
}

export function formatBillingRow(row: BillingExportRow): string[] | null {
  const unitPrice = getUnitPrice(row);
  if (unitPrice == null) return null;

  const description = `Renouvellement nom de domaine ${row.name}${
    row.client_name ? ` — ${row.client_name}` : ''
  }`;

  return [
    row.client_name || '',
    row.client_email || '',
    description,
    '1',
    unitPrice.toFixed(2),
    String(VAT_RATE),
    row.currency || 'EUR',
    computeDueDate(row.expires_at),
    row.name,
    row.registrar,
    row.expires_at ? row.expires_at.slice(0, 10) : '',
  ];
}

export function buildBillingCsv(rows: BillingExportRow[]): string {
  const lines = [CSV_HEADERS.join(';')];

  for (const row of rows) {
    const formatted = formatBillingRow(row);
    if (!formatted) continue;
    lines.push(formatted.map(escapeCsvField).join(';'));
  }

  return `\uFEFF${lines.join('\n')}\n`;
}

export function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiresAt);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export interface BillingExportFilters {
  payer?: 'client' | 'agency' | 'all';
  days?: number;
  billingStatus?: 'pending' | 'all';
}

export function filterBillingRows(
  rows: BillingExportRow[],
  filters: BillingExportFilters
): BillingExportRow[] {
  const payer = filters.payer ?? 'client';
  const days = filters.days ?? 60;
  const billingStatus = filters.billingStatus ?? 'pending';

  return rows.filter((row) => {
    if (payer !== 'all' && row.payer !== payer) return false;
    if (billingStatus === 'pending' && row.billing_status !== 'pending') return false;
    if (getUnitPrice(row) == null) return false;

    if (days > 0) {
      const daysUntil = getDaysUntilExpiry(row.expires_at);
      if (daysUntil === null || daysUntil > days || daysUntil < 0) return false;
    }

    return true;
  });
}
