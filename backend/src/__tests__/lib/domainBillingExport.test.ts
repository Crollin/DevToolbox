import { describe, it, expect } from 'vitest';
import {
  buildBillingCsv,
  escapeCsvField,
  filterBillingRows,
  formatBillingRow,
  type BillingExportRow,
} from '../../lib/domainBillingExport';

const sampleRow: BillingExportRow = {
  name: 'exemple.com',
  registrar: 'cloudflare',
  client_name: 'Acme Corp',
  client_email: 'facturation@acme.com',
  payer: 'client',
  sell_yearly: 24.99,
  cost_yearly: 12,
  currency: 'EUR',
  expires_at: '2026-08-15T00:00:00.000Z',
  billing_status: 'pending',
};

describe('domainBillingExport', () => {
  it('escapeCsvField quotes fields with semicolons', () => {
    expect(escapeCsvField('hello;world')).toBe('"hello;world"');
    expect(escapeCsvField('normal')).toBe('normal');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it('formatBillingRow returns null when no billable amount', () => {
    const row: BillingExportRow = { ...sampleRow, sell_yearly: null, cost_yearly: null };
    expect(formatBillingRow(row)).toBeNull();
  });

  it('formatBillingRow includes client and amount', () => {
    const formatted = formatBillingRow(sampleRow);
    expect(formatted).not.toBeNull();
    expect(formatted![0]).toBe('Acme Corp');
    expect(formatted![4]).toBe('24.99');
    expect(formatted![2]).toContain('exemple.com');
  });

  it('buildBillingCsv produces UTF-8 BOM and headers', () => {
    const csv = buildBillingCsv([sampleRow]);
    expect(csv.startsWith('\uFEFFclient_name;')).toBe(true);
    expect(csv).toContain('Acme Corp');
    expect(csv).toContain('exemple.com');
  });

  it('filterBillingRows respects payer and billing status', () => {
    const rows: BillingExportRow[] = [
      sampleRow,
      { ...sampleRow, name: 'agency.com', payer: 'agency', billing_status: 'n/a' },
      { ...sampleRow, name: 'paid.com', billing_status: 'paid' },
    ];

    const filtered = filterBillingRows(rows, {
      payer: 'client',
      days: 0,
      billingStatus: 'pending',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('exemple.com');
  });
});
