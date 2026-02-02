import { useState, useCallback, useRef, DragEvent } from "react";
import { marked } from "marked";
import html2pdf from "html2pdf.js";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { remarkDocx } from "@m2d/remark-docx";
import { tools } from "@/data/tools";
import ToolLayout from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  Table,
  Minus,
  CheckSquare,
  Download,
  Copy,
  Trash2,
  Eye,
  Edit3,
  Upload,
  ChevronDown,
  File,
  FileText,
  FileType,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// DOCX processor (Markdown → .docx), created once
const docxProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDocx);

// Supported text file extensions
const TEXT_EXTENSIONS = [".txt", ".md", ".markdown", ".text", ".log", ".csv", ".json", ".xml", ".html", ".htm", ".css", ".js", ".ts", ".jsx", ".tsx", ".py", ".php", ".sql", ".sh", ".bash", ".yaml", ".yml", ".ini", ".conf", ".env"];

const MarkdownEditor = () => {
  const tool = tools.find((t) => t.id === "markdown-editor")!;
  const [content, setContent] = useState<string>(`# Bienvenue dans l'éditeur Markdown

Commencez à écrire votre contenu ici...

## Fonctionnalités

- **Gras** et *italique*
- Listes à puces
- [Liens](https://example.com)
- \`Code inline\`

### Bloc de code

\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`

> Citation en bloc

---

Bonne édition !
`);
  const [fileName, setFileName] = useState("document");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if file is a text file
  const isTextFile = (file: File): boolean => {
    const name = file.name.toLowerCase();
    return TEXT_EXTENSIONS.some(ext => name.endsWith(ext)) || file.type.startsWith("text/");
  };

  // Convert plain text to markdown (basic formatting)
  const convertToMarkdown = (text: string, fileExt: string): string => {
    // If already markdown, return as-is
    if (fileExt === ".md" || fileExt === ".markdown") {
      return text;
    }

    // For code files, wrap in code block
    const codeExtensions: Record<string, string> = {
      ".js": "javascript",
      ".jsx": "jsx",
      ".ts": "typescript",
      ".tsx": "tsx",
      ".py": "python",
      ".php": "php",
      ".sql": "sql",
      ".sh": "bash",
      ".bash": "bash",
      ".css": "css",
      ".html": "html",
      ".htm": "html",
      ".xml": "xml",
      ".json": "json",
      ".yaml": "yaml",
      ".yml": "yaml",
    };

    if (codeExtensions[fileExt]) {
      return `\`\`\`${codeExtensions[fileExt]}\n${text}\n\`\`\``;
    }

    // For CSV, try to convert to table
    if (fileExt === ".csv") {
      const lines = text.trim().split("\n");
      if (lines.length > 0) {
        const rows = lines.map(line => line.split(",").map(cell => cell.trim()));
        const header = rows[0];
        const separator = header.map(() => "---");
        const tableRows = [
          `| ${header.join(" | ")} |`,
          `| ${separator.join(" | ")} |`,
          ...rows.slice(1).map(row => `| ${row.join(" | ")} |`)
        ];
        return tableRows.join("\n");
      }
    }

    // For plain text, preserve structure and add basic formatting
    let markdown = text;
    
    // Convert lines that look like titles (short lines followed by empty lines)
    const lines = markdown.split("\n");
    const processedLines = lines.map((line, i) => {
      const trimmed = line.trim();
      const nextLine = lines[i + 1]?.trim();
      
      // If line is short, uppercase, and followed by empty line, make it a heading
      if (trimmed.length > 0 && trimmed.length < 50 && trimmed === trimmed.toUpperCase() && !nextLine) {
        return `## ${trimmed}`;
      }
      
      return line;
    });

    return processedLines.join("\n");
  };

  // Handle file reading
  const handleFile = async (file: File) => {
    if (!isTextFile(file)) {
      toast.error("Format non supporté. Utilisez un fichier texte (.txt, .md, .csv, etc.)");
      return;
    }

    try {
      const text = await file.text();
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      
      const markdown = convertToMarkdown(text, ext);
      setContent(markdown);
      setFileName(baseName);
      toast.success(`Fichier "${file.name}" importé`);
    } catch (error) {
      toast.error("Erreur lors de la lecture du fichier");
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFile(files[0]);
    }
  };

  // File input handler
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Insert text at cursor position
  const insertText = useCallback((before: string, after: string = "", placeholder: string = "") => {
    const textarea = document.getElementById("markdown-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content]);

  // Insert at line start
  const insertAtLineStart = useCallback((prefix: string) => {
    const textarea = document.getElementById("markdown-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const newText = content.substring(0, lineStart) + prefix + content.substring(lineStart);
    
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  }, [content]);

  const toolbarButtons = [
    { icon: Bold, action: () => insertText("**", "**", "texte gras"), title: "Gras" },
    { icon: Italic, action: () => insertText("*", "*", "texte italique"), title: "Italique" },
    { icon: Strikethrough, action: () => insertText("~~", "~~", "texte barré"), title: "Barré" },
    { separator: true },
    { icon: Heading1, action: () => insertAtLineStart("# "), title: "Titre 1" },
    { icon: Heading2, action: () => insertAtLineStart("## "), title: "Titre 2" },
    { icon: Heading3, action: () => insertAtLineStart("### "), title: "Titre 3" },
    { separator: true },
    { icon: List, action: () => insertAtLineStart("- "), title: "Liste à puces" },
    { icon: ListOrdered, action: () => insertAtLineStart("1. "), title: "Liste numérotée" },
    { icon: CheckSquare, action: () => insertAtLineStart("- [ ] "), title: "Case à cocher" },
    { separator: true },
    { icon: Quote, action: () => insertAtLineStart("> "), title: "Citation" },
    { icon: Code, action: () => insertText("`", "`", "code"), title: "Code inline" },
    { icon: Link, action: () => insertText("[", "](url)", "texte du lien"), title: "Lien" },
    { icon: Image, action: () => insertText("![", "](url)", "alt text"), title: "Image" },
    { separator: true },
    { icon: Table, action: () => insertText("\n| Colonne 1 | Colonne 2 |\n|-----------|------------|\n| Cellule 1 | Cellule 2 |\n", ""), title: "Tableau" },
    { icon: Minus, action: () => insertText("\n---\n", ""), title: "Ligne horizontale" },
  ];

  const handleExport = () => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName || "document"}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Fichier exporté avec succès");
  };

  const handleExportPdf = async () => {
    const toastId = toast.loading("Génération du PDF en cours...");
    let container: HTMLDivElement | null = null;
    try {
      container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "210mm";
      container.style.padding = "20px";
      container.style.background = "white";
      container.style.color = "#1a1a1a";
      container.className = cn(
        "prose prose-sm max-w-none",
        "prose-headings:text-foreground prose-p:text-foreground/90",
        "prose-a:text-primary prose-strong:text-foreground",
        "prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:rounded",
        "prose-pre:bg-muted prose-pre:border prose-pre:border-border/50",
        "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
        "prose-hr:border-border"
      );
      container.innerHTML = getHtmlContent();
      document.body.appendChild(container);
      await html2pdf()
        .set({
          filename: `${fileName || "document"}.pdf`,
          margin: 10,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(container)
        .save();
      toast.success("PDF exporté avec succès", { id: toastId });
    } catch (error) {
      toast.error("Échec de l'export PDF. Document peut-être trop long.", { id: toastId });
    } finally {
      if (container?.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };

  const handleExportDocx = async () => {
    const toastId = toast.loading("Génération du DOCX en cours...");
    try {
      const vfile = await docxProcessor.process(content);
      const blob = (await vfile.result) as Blob;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName || "document"}.docx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("DOCX exporté avec succès", { id: toastId });
    } catch (error) {
      toast.error("Échec de l'export DOCX", { id: toastId });
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    toast.success("Markdown copié");
  };

  const handleClear = () => {
    setContent("");
    toast.success("Contenu effacé");
  };

  const getHtmlContent = () => {
    return marked(content, { breaks: true, gfm: true }) as string;
  };

  return (
    <ToolLayout tool={tool}>
      <div 
        className="space-y-4"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.markdown,.text,.log,.csv,.json,.xml,.html,.htm,.css,.js,.ts,.jsx,.tsx,.py,.php,.sql,.sh,.bash,.yaml,.yml,.ini,.conf,.env"
          onChange={handleFileInput}
          className="hidden"
        />

        {/* Drag overlay */}
        {isDragging && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="border-2 border-dashed border-primary rounded-xl p-12 bg-primary/10">
              <Upload className="w-16 h-16 text-primary mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">Déposez votre fichier ici</p>
              <p className="text-sm text-muted-foreground">Fichiers texte supportés: .txt, .md, .csv, .json, etc.</p>
            </div>
          </div>
        )}

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <Input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Nom du fichier"
              className="max-w-[200px]"
            />
            <span className="text-muted-foreground text-sm">.md</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Importer</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Copier</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Effacer</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Exporter
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport}>
                  <FileText className="w-4 h-4 mr-2" />
                  Exporter en .md
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPdf}>
                  <File className="w-4 h-4 mr-2" />
                  Exporter en PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportDocx}>
                  <FileType className="w-4 h-4 mr-2" />
                  Exporter en DOCX
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="lg:hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
            <TabsList className="w-full">
              <TabsTrigger value="edit" className="flex-1">
                <Edit3 className="w-4 h-4 mr-2" />
                Édition
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                Aperçu
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="mt-4">
              {/* Toolbar */}
              <div className="flex flex-wrap gap-1 p-2 bg-muted/30 rounded-t-lg border border-b-0 border-border/50">
                {toolbarButtons.map((btn, index) =>
                  btn.separator ? (
                    <div key={index} className="w-px h-6 bg-border mx-1" />
                  ) : (
                    <Button
                      key={index}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={btn.action}
                      title={btn.title}
                    >
                      <btn.icon className="w-4 h-4" />
                    </Button>
                  )
                )}
              </div>
              <Textarea
                id="markdown-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm rounded-t-none resize-none"
                placeholder="Écrivez votre markdown ici ou glissez-déposez un fichier..."
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <div
                className="prose prose-invert max-w-none p-4 bg-muted/20 rounded-lg border border-border/50 min-h-[400px]"
                dangerouslySetInnerHTML={{ __html: getHtmlContent() }}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Split View */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-4">
          {/* Editor */}
          <div>
            <div className="flex flex-wrap gap-1 p-2 bg-muted/30 rounded-t-lg border border-b-0 border-border/50">
              {toolbarButtons.map((btn, index) =>
                btn.separator ? (
                  <div key={index} className="w-px h-6 bg-border mx-1" />
                ) : (
                  <Button
                    key={index}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={btn.action}
                    title={btn.title}
                  >
                    <btn.icon className="w-4 h-4" />
                  </Button>
                )
              )}
            </div>
            <Textarea
              id="markdown-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[500px] font-mono text-sm rounded-t-none resize-none"
              placeholder="Écrivez votre markdown ici ou glissez-déposez un fichier..."
            />
          </div>

          {/* Preview */}
          <div>
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-t-lg border border-b-0 border-border/50 h-[44px]">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Aperçu</span>
            </div>
            <div
              className={cn(
                "prose prose-invert max-w-none p-4 bg-muted/20 rounded-b-lg border border-border/50 min-h-[500px] overflow-auto",
                "prose-headings:text-foreground prose-p:text-foreground/90",
                "prose-a:text-primary prose-strong:text-foreground",
                "prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:rounded",
                "prose-pre:bg-muted prose-pre:border prose-pre:border-border/50",
                "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
                "prose-hr:border-border"
              )}
              dangerouslySetInnerHTML={{ __html: getHtmlContent() }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{content.length} caractères</span>
          <span>{content.split(/\s+/).filter(Boolean).length} mots</span>
          <span>{content.split("\n").length} lignes</span>
        </div>
      </div>
    </ToolLayout>
  );
};

export default MarkdownEditor;
