import DOMPurify from 'dompurify';

/** Sanitize un fragment SVG avant dangerouslySetInnerHTML. */
export function sanitizeSvg(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });
}
