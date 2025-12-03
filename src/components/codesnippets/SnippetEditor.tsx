import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { CodeSnippet, SnippetLanguage, SnippetScope, SnippetPriority, languageLabels, scopeLabels } from "@/types/codesnippet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SnippetEditorProps {
  snippet: CodeSnippet | null;
  folders: string[];
  tags: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (snippet: Omit<CodeSnippet, "id" | "createdAt" | "updatedAt">) => void;
  onAddFolder: (folder: string) => void;
  onAddTag: (tag: string) => void;
}

const defaultSnippet: Omit<CodeSnippet, "id" | "createdAt" | "updatedAt"> = {
  title: "",
  description: "",
  code: "",
  language: "php",
  scope: "global",
  priority: 10,
  tags: [],
  folder: "",
  isFavorite: false,
};

const SnippetEditor = ({
  snippet,
  folders,
  tags,
  isOpen,
  onClose,
  onSave,
  onAddFolder,
  onAddTag,
}: SnippetEditorProps) => {
  const [formData, setFormData] = useState(defaultSnippet);
  const [newFolder, setNewFolder] = useState("");
  const [newTag, setNewTag] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);

  useEffect(() => {
    if (snippet) {
      setFormData({
        title: snippet.title,
        description: snippet.description,
        code: snippet.code,
        language: snippet.language,
        scope: snippet.scope,
        priority: snippet.priority,
        tags: snippet.tags,
        folder: snippet.folder || "__none__",
        isFavorite: snippet.isFavorite || false,
      });
    } else {
      setFormData(defaultSnippet);
    }
  }, [snippet, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.code.trim()) return;
    // Convertir "__none__" en chaîne vide pour le dossier
    const dataToSave = {
      ...formData,
      folder: formData.folder === "__none__" ? "" : formData.folder,
    };
    onSave(dataToSave);
    onClose();
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleAddFolder = () => {
    if (newFolder.trim()) {
      onAddFolder(newFolder.trim());
      setFormData((prev) => ({ ...prev, folder: newFolder.trim() }));
      setNewFolder("");
      setShowNewFolder(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      toggleTag(newTag.trim());
      setNewTag("");
      setShowNewTag(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden p-0">
        <SheetHeader className="px-4 sm:px-6 py-4 border-b border-border">
          <SheetTitle>{snippet ? "Modifier le snippet" : "Nouveau snippet"}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Nom du snippet"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Description du snippet"
                className="min-h-[60px]"
              />
            </div>

            {/* Language & Scope */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label>Langage</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, language: value as SnippetLanguage }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(languageLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Scope</Label>
                <Select
                  value={formData.scope}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, scope: value as SnippetScope }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(scopeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Priority & Folder */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label>Priorité (1-10)</Label>
                <Select
                  value={formData.priority.toString()}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, priority: parseInt(value) as SnippetPriority }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dossier</Label>
                {showNewFolder ? (
                  <div className="flex gap-2">
                    <Input
                      value={newFolder}
                      onChange={(e) => setNewFolder(e.target.value)}
                      placeholder="Nouveau dossier"
                      className="flex-1"
                    />
                    <Button type="button" size="icon" onClick={handleAddFolder}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => setShowNewFolder(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Select
                      value={formData.folder || "__none__"}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, folder: value === "__none__" ? "" : value }))
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Aucun" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Aucun</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder} value={folder}>
                            {folder}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" size="icon" variant="outline" onClick={() => setShowNewFolder(true)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Textarea
                id="code"
                value={formData.code}
                onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="Collez votre code ici..."
                className="min-h-[150px] sm:min-h-[200px] font-mono text-sm"
                required
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                {tags.slice(0, 12).map((tag) => (
                  <Badge
                    key={tag}
                    variant={formData.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              {showNewTag ? (
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Nouveau tag"
                    className="flex-1"
                  />
                  <Button type="button" size="icon" onClick={handleAddTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" onClick={() => setShowNewTag(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNewTag(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter un tag
                </Button>
              )}
            </div>


            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1">
                {snippet ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default SnippetEditor;
