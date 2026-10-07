import { describe, it, expect } from 'vitest';
import { isValidCorsOrigin } from '../../lib/env';

describe('isValidCorsOrigin', () => {
  it('accepte https', () => {
    expect(isValidCorsOrigin('https://devtoolbox.example.com')).toBe(true);
  });

  it('accepte http localhost', () => {
    expect(isValidCorsOrigin('http://localhost:8080')).toBe(true);
  });

  it('rejette wildcard', () => {
    expect(isValidCorsOrigin('*')).toBe(false);
  });

  it('rejette relatif', () => {
    expect(isValidCorsOrigin('/')).toBe(false);
  });

  it('rejette protocole non http(s)', () => {
    expect(isValidCorsOrigin('ftp://example.com')).toBe(false);
  });
});
