import { describe, it, expect } from 'vitest';
import { assertValidSvg, SvgValidationError } from '../../lib/svgValidation';

describe('assertValidSvg', () => {
  it('accepte un SVG simple', () => {
    expect(assertValidSvg('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>')).toContain('<svg');
  });

  it('rejette un script', () => {
    expect(() =>
      assertValidSvg('<svg><script>alert(1)</script></svg>')
    ).toThrow(SvgValidationError);
  });

  it('rejette onload', () => {
    expect(() =>
      assertValidSvg('<svg onload="alert(1)"></svg>')
    ).toThrow(SvgValidationError);
  });

  it('rejette non-svg', () => {
    expect(() => assertValidSvg('<div>x</div>')).toThrow(SvgValidationError);
  });

  it('rejette payload trop long', () => {
    expect(() => assertValidSvg('<svg>' + 'a'.repeat(100_001) + '</svg>')).toThrow(
      SvgValidationError
    );
  });
});
