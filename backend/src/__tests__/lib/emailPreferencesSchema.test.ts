import { describe, it, expect } from 'vitest';
import { emailPreferencesSchema } from '../../lib/emailPreferencesSchema';

describe('emailPreferencesSchema', () => {
  it('accepte des prefs valides', () => {
    const r = emailPreferencesSchema.safeParse({
      companyName: 'Acme',
      signature: 'Team',
      primaryColor: '#0066CC',
      secondaryColor: '#004',
      logoUrl: 'https://cdn.example.com/logo.png',
      welcomeText: 'Hello',
      licencesText: '',
      tasksText: '',
    });
    expect(r.success).toBe(true);
  });

  it('rejette une couleur invalide', () => {
    const r = emailPreferencesSchema.safeParse({
      primaryColor: 'red',
      secondaryColor: '#0066CC',
    });
    expect(r.success).toBe(false);
  });

  it('rejette un logoUrl javascript:', () => {
    const r = emailPreferencesSchema.safeParse({
      logoUrl: 'javascript:alert(1)',
      primaryColor: '#0066CC',
      secondaryColor: '#004499',
    });
    expect(r.success).toBe(false);
  });

  it('accepte logoUrl vide', () => {
    const r = emailPreferencesSchema.safeParse({
      logoUrl: '',
      primaryColor: '#fff',
      secondaryColor: '#000000',
    });
    expect(r.success).toBe(true);
  });
});
