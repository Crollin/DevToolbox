import { describe, it, expect } from 'vitest';
import { formatDomainMessage, type ExpiringDomain } from '../../lib/notificationDispatch';

describe('formatDomainMessage', () => {
  it('includes billing amount when payer is client', () => {
    const domains: ExpiringDomain[] = [
      {
        name: 'client.com',
        clientName: 'Acme',
        clientEmail: 'facturation@acme.com',
        payer: 'client',
        sellYearly: 29.99,
        currency: 'EUR',
        daysUntilExpiry: 30,
        isExpired: false,
      },
    ];

    const message = formatDomainMessage(domains);
    expect(message).toContain('À facturer au client');
    expect(message).toContain('29.99 EUR HT/an');
    expect(message).toContain('facturation@acme.com');
  });

  it('shows agency renewal for agency payer', () => {
    const domains: ExpiringDomain[] = [
      {
        name: 'agency.com',
        clientName: null,
        clientEmail: null,
        payer: 'agency',
        sellYearly: null,
        currency: 'EUR',
        daysUntilExpiry: 7,
        isExpired: false,
      },
    ];

    const message = formatDomainMessage(domains);
    expect(message).toContain('Renouvellement agence');
    expect(message).not.toContain('À facturer');
  });
});
