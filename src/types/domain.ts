export type RegistrarId = 'cloudflare' | 'hostinger' | 'ovh';
export type PortfolioRegistrar = RegistrarId | 'o2switch' | 'other';
export type OfferStatus = 'ok' | 'skipped' | 'error';
export type DomainPayer = 'agency' | 'client';
export type DomainBillingStatus = 'pending' | 'invoiced' | 'paid' | 'n/a';

export interface DomainOffer {
  registrar: RegistrarId;
  status: OfferStatus;
  currency: string | null;
  registration: number | null;
  renewal: number | null;
  registrationEur: number | null;
  renewalEur: number | null;
  available?: boolean | null;
  message?: string;
  buyUrl?: string;
}

export interface DomainCompareResult {
  domain: string;
  available: boolean | null;
  offers: DomainOffer[];
  o2switch: { note: string; url: string } | null;
}

export interface CompareResponse {
  query: string;
  results: DomainCompareResult[];
}

export interface PortfolioDomain {
  id: string;
  name: string;
  registrar: PortfolioRegistrar;
  clientName: string | null;
  clientEmail: string | null;
  payer: DomainPayer;
  costYearly: number | null;
  sellYearly: number | null;
  currency: string;
  expiresAt: string | null;
  autoRenew: boolean;
  notes: string | null;
  externalId: string | null;
  notificationsEnabled: boolean;
  billingStatus: DomainBillingStatus;
  lastBilledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PortfolioDomainInput = {
  name: string;
  registrar: PortfolioRegistrar;
  clientName?: string | null;
  clientEmail?: string | null;
  payer?: DomainPayer;
  costYearly?: number | null;
  sellYearly?: number | null;
  currency?: string;
  expiresAt?: string | null;
  autoRenew?: boolean;
  notes?: string | null;
  externalId?: string | null;
  notificationsEnabled?: boolean;
  billingStatus?: DomainBillingStatus;
};

export const BILLING_STATUS_LABELS: Record<DomainBillingStatus, string> = {
  pending: 'À facturer',
  invoiced: 'Facturé',
  paid: 'Payé',
  'n/a': 'N/A',
};

export const DEFAULT_COMPARE_TLDS = ['com', 'fr', 'net', 'org', 'io', 'dev', 'app', 'eu'];

export const REGISTRAR_LABELS: Record<PortfolioRegistrar, string> = {
  cloudflare: 'Cloudflare',
  hostinger: 'Hostinger',
  ovh: 'OVH',
  o2switch: 'o2switch',
  other: 'Autre',
};

export type CompareRegistrarId = RegistrarId;

export interface CompareSettings {
  cloudflare: boolean;
  hostinger: boolean;
  ovh: boolean;
  o2switch: boolean;
}

export const DEFAULT_COMPARE_SETTINGS: CompareSettings = {
  cloudflare: true,
  hostinger: true,
  ovh: false,
  o2switch: false,
};

export const COMPARE_SETTINGS_KEY = 'domain-hub-compare-settings';

export function loadCompareSettings(): CompareSettings {
  try {
    const raw = localStorage.getItem(COMPARE_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_COMPARE_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<CompareSettings>;
    return {
      cloudflare: parsed.cloudflare ?? DEFAULT_COMPARE_SETTINGS.cloudflare,
      hostinger: parsed.hostinger ?? DEFAULT_COMPARE_SETTINGS.hostinger,
      ovh: parsed.ovh ?? DEFAULT_COMPARE_SETTINGS.ovh,
      o2switch: parsed.o2switch ?? DEFAULT_COMPARE_SETTINGS.o2switch,
    };
  } catch {
    return { ...DEFAULT_COMPARE_SETTINGS };
  }
}

export function saveCompareSettings(settings: CompareSettings): void {
  localStorage.setItem(COMPARE_SETTINGS_KEY, JSON.stringify(settings));
}

export function settingsToRegistrars(settings: CompareSettings): CompareRegistrarId[] {
  const list: CompareRegistrarId[] = [];
  if (settings.cloudflare) list.push('cloudflare');
  if (settings.hostinger) list.push('hostinger');
  if (settings.ovh) list.push('ovh');
  return list;
}
