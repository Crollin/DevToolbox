export class SvgValidationError extends Error {
  status = 400 as const;
  constructor(message: string) {
    super(message);
    this.name = 'SvgValidationError';
  }
}

const MAX_SVG_CHARS = 100_000;
const FORBIDDEN =
  /<script|javascript:|<\s*foreignObject|<\s*iframe|<\s*object|<\s*embed|\bon[a-z]+\s*=|xlink:href\s*=\s*["'](?!#)/i;

export function assertValidSvg(svg: unknown): string {
  if (typeof svg !== 'string' || !svg.trim()) {
    throw new SvgValidationError('SVG requis');
  }
  const trimmed = svg.trim();
  if (trimmed.length > MAX_SVG_CHARS) {
    throw new SvgValidationError('SVG trop volumineux');
  }
  if (!/^\s*<svg[\s>]/i.test(trimmed)) {
    throw new SvgValidationError('Le contenu doit être un élément <svg>');
  }
  if (FORBIDDEN.test(trimmed)) {
    throw new SvgValidationError('SVG contient des éléments ou attributs interdits');
  }
  return trimmed;
}
