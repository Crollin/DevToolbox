import { describe, expect, it } from 'vitest';
import { expandDomains, toEur, roundMoney } from '../../lib/registrars/types';

describe('registrars/types', () => {
  it('expandDomains with FQDN', () => {
    expect(expandDomains('Acme.COM')).toEqual(['acme.com']);
  });

  it('expandDomains with name + tlds', () => {
    expect(expandDomains('acme', ['com', 'fr'])).toEqual(['acme.com', 'acme.fr']);
  });

  it('expandDomains defaults and max 12', () => {
    const out = expandDomains('acme');
    expect(out.length).toBeGreaterThan(0);
    expect(out[0]).toBe('acme.com');
    expect(expandDomains('x', Array.from({ length: 20 }, (_, i) => `t${i}`)).length).toBe(12);
  });

  it('toEur converts USD', () => {
    process.env.DOMAIN_USD_EUR_RATE = '0.5';
    expect(toEur(10, 'USD')).toBe(5);
    expect(toEur(10, 'EUR')).toBe(10);
    expect(toEur(null, 'EUR')).toBeNull();
    expect(roundMoney(1.239)).toBe(1.24);
  });
});
