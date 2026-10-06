import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeEmailDisplayName } from '../../lib/htmlEscape';

describe('escapeHtml', () => {
  it('échappe les caractères HTML critiques', () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    );
  });

  it('gère null/undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('échappe les apostrophes', () => {
    expect(escapeHtml("O'Brien")).toBe('O&#39;Brien');
  });
});

describe('sanitizeEmailDisplayName', () => {
  it('retire guillemets et retours ligne', () => {
    expect(sanitizeEmailDisplayName('Acme "Corp"\r\nBcc: evil@x.com')).toBe(
      'Acme CorpBcc: evil@x.com'
    );
  });
});
