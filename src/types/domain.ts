export type RegistrarId = 'cloudflare' | 'hostinger' | 'ovh';
export type PortfolioRegistrar = RegistrarId | 'o2switch' | 'other';
export type OfferStatus = 'ok' | 'skipped' | 'error';
export type DomainPayer = 'agency' | 'client';

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
  o2switch: { note: string; url: string };
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
  qontoClientId: string | null;
  lastInvoiceId: string | null;
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
  qontoClientId?: string | null;
};

export const DEFAULT_COMPARE_TLDS = ['com', 'fr', 'net', 'org', 'io', 'dev', 'app', 'eu'];

export const REGISTRAR_LABELS: Record<PortfolioRegistrar, string> = {
  cloudflare: 'Cloudflare',
  hostinger: 'Hostinger',
  ovh: 'OVH',
  o2switch: 'o2switch',
  other: 'Autre',
};
