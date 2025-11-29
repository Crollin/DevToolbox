import { useState, useCallback } from "react";
import { marked } from "marked";
import { tools } from "@/data/tools";
import ToolLayout from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
      <div className="space-y-4">
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
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Copier</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Effacer</span>
            </Button>
            <Button size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" />
              Exporter
            </Button>
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
                placeholder="Écrivez votre markdown ici..."
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
              placeholder="Écrivez votre markdown ici..."
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
