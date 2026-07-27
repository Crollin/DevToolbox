const DEFAULT_BASE = 'https://thirdparty.qonto.com';

export interface QontoInvoiceItem {
  description: string;
  quantity: string;
  unit?: string;
  unit_price: { value: string; currency: string };
  vat_rate: string;
}

export interface CreateDraftInvoiceInput {
  clientId: string;
  issueDate: string;
  dueDate: string;
  items: QontoInvoiceItem[];
  paymentIban?: string;
}

function getBaseUrl(): string {
  return process.env.QONTO_BASE_URL || DEFAULT_BASE;
}

function getAuthHeaders(): Record<string, string> {
  const apiKey = process.env.QONTO_API_KEY;
  if (!apiKey) {
    throw new Error('QONTO_API_KEY non configuré');
  }
  const headers: Record<string, string> = {
    Authorization: apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  if (process.env.QONTO_STAGING_TOKEN) {
    headers['X-Qonto-Staging-Token'] = process.env.QONTO_STAGING_TOKEN;
  }
  return headers;
}

export function isQontoConfigured(): boolean {
  return Boolean(process.env.QONTO_API_KEY);
}

export async function createClientInvoiceDraft(input: CreateDraftInvoiceInput): Promise<{
  id: string;
  status: string;
  invoiceUrl?: string | null;
}> {
  const body: Record<string, unknown> = {
    client_id: input.clientId,
    issue_date: input.issueDate,
    due_date: input.dueDate,
    status: 'draft',
    items: input.items,
  };

  if (input.paymentIban) {
    body.payment_methods = { iban: input.paymentIban };
  }

  const res = await fetch(`${getBaseUrl()}/v2/client_invoices`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Qonto HTTP ${res.status}${text ? `: ${text.slice(0, 300)}` : ''}`);
  }

  const json = (await res.json()) as {
    client_invoice?: { id: string; status: string; invoice_url?: string | null };
    data?: { id: string; attributes?: { status?: string; invoice_url?: string } };
  };

  if (json.client_invoice?.id) {
    return {
      id: json.client_invoice.id,
      status: json.client_invoice.status,
      invoiceUrl: json.client_invoice.invoice_url,
    };
  }

  if (json.data?.id) {
    return {
      id: json.data.id,
      status: json.data.attributes?.status || 'draft',
      invoiceUrl: json.data.attributes?.invoice_url,
    };
  }

  throw new Error('Réponse Qonto invalide');
}
