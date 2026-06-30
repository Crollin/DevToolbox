import DOMPurify from "dompurify";
import { marked } from "marked";

marked.use({ breaks: true, gfm: true });

export function markdownToHtml(md: string): string {
  return marked.parse(md) as string;
}

export function markdownToSafeHtml(md: string): string {
  return DOMPurify.sanitize(markdownToHtml(md));
}

export const PDF_PROSE_CLASS =
  "prose prose-slate prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600 prose-strong:text-slate-900 prose-code:text-blue-700 prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded prose-pre:bg-slate-100 prose-pre:border prose-pre:border-slate-200 prose-blockquote:border-l-blue-500 prose-blockquote:text-slate-600 prose-hr:border-slate-300";

export const PREVIEW_PROSE_CLASS =
  "prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-primary prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border/50 prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-hr:border-border";
