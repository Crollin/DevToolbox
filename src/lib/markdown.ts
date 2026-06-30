import DOMPurify from "dompurify";
import { marked } from "marked";

marked.use({ breaks: true, gfm: true });

export function markdownToHtml(md: string): string {
  return marked.parse(md) as string;
}

export function markdownToSafeHtml(md: string): string {
  return DOMPurify.sanitize(markdownToHtml(md));
}

export const PREVIEW_PROSE_CLASS =
  "prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-primary prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border/50 prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-hr:border-border";

const PDF_INLINE_STYLES = `
.pdf-export { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; line-height: 1.625; color: #334155; background: #ffffff; }
.pdf-export h1 { font-size: 1.75em; font-weight: 700; margin: 0.8em 0 0.4em; color: #0f172a; }
.pdf-export h2 { font-size: 1.4em; font-weight: 600; margin: 0.8em 0 0.4em; color: #0f172a; }
.pdf-export h3 { font-size: 1.15em; font-weight: 600; margin: 0.7em 0 0.35em; color: #0f172a; }
.pdf-export p { margin: 0.5em 0; }
.pdf-export ul, .pdf-export ol { margin: 0.5em 0; padding-left: 1.5em; }
.pdf-export li { margin: 0.2em 0; }
.pdf-export a { color: #2563eb; text-decoration: underline; }
.pdf-export strong { font-weight: 600; color: #0f172a; }
.pdf-export code { font-family: ui-monospace, monospace; font-size: 0.9em; background: #f1f5f9; color: #1d4ed8; padding: 0.1em 0.3em; border-radius: 3px; }
.pdf-export pre { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.75em 1em; overflow-x: auto; margin: 0.75em 0; }
.pdf-export pre code { background: none; padding: 0; color: #1e293b; }
.pdf-export blockquote { border-left: 4px solid #3b82f6; margin: 0.75em 0; padding-left: 1em; color: #64748b; }
.pdf-export hr { border: none; border-top: 1px solid #cbd5e1; margin: 1.5em 0; }
.pdf-export table { border-collapse: collapse; width: 100%; margin: 0.75em 0; }
.pdf-export th, .pdf-export td { border: 1px solid #cbd5e1; padding: 0.4em 0.6em; text-align: left; }
.pdf-export th { background: #f8fafc; font-weight: 600; }
.pdf-export img { max-width: 100%; height: auto; }
`;

/** HTML document fragment with inline CSS for reliable html2pdf capture */
export function buildPdfHtml(safeHtml: string): string {
  return `<div class="pdf-export"><style>${PDF_INLINE_STYLES}</style>${safeHtml}</div>`;
}
