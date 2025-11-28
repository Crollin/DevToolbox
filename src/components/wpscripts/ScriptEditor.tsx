import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { WPScript, ScriptLanguage, DifficultyLevel } from "@/types/wpscript";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ScriptEditorProps {
  script?: WPScript | null;
  categories: string[];
  tags: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (script: Omit<WPScript, "id" | "createdAt" | "updatedAt">) => void;
  onAddCategory: (category: string) => void;
  onAddTag: (tag: string) => void;
}

const ScriptEditor = ({
  script,
  categories,
  tags,
  isOpen,
  onClose,
  onSave,
  onAddCategory,
  onAddTag,
}: ScriptEditorProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    language: "php" as ScriptLanguage,
    category: "",
    tags: [] as string[],
    wpVersionMin: "",
    wpVersionMax: "",
    author: "Admin",
    difficulty: "débutant" as DifficultyLevel,
    instructions: "",
    dependencies: [] as string[],
    warnings: [] as string[],
  });

  const [newTag, setNewTag] = useState("");
  const [newDep, setNewDep] = useState("");
  const [newWarning, setNewWarning] = useState("");
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (script) {
      setFormData({
        name: script.name,
        description: script.description,
        code: script.code,
        language: script.language,
        category: script.category,
        tags: script.tags,
        wpVersionMin: script.wpVersionMin || "",
        wpVersionMax: script.wpVersionMax || "",
        author: script.author,
        difficulty: script.difficulty,
        instructions: script.instructions || "",
        dependencies: script.dependencies || [],
        warnings: script.warnings || [],
      });
    } else {
      setFormData({
        name: "",
        description: "",
        code: "",
        language: "php",
        category: categories[0] || "",
        tags: [],
        wpVersionMin: "",
        wpVersionMax: "",
        author: "Admin",
        difficulty: "débutant",
        instructions: "",
        dependencies: [],
        warnings: [],
      });
    }
  }, [script, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      dependencies: formData.dependencies.filter(Boolean),
      warnings: formData.warnings.filter(Boolean),
    });
    onClose();
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const addDependency = () => {
    if (newDep && !formData.dependencies.includes(newDep)) {
      setFormData((prev) => ({ ...prev, dependencies: [...prev.dependencies, newDep] }));
    }
    setNewDep("");
  };

  const removeDependency = (dep: string) => {
    setFormData((prev) => ({ ...prev, dependencies: prev.dependencies.filter((d) => d !== dep) }));
  };

  const addWarning = () => {
    if (newWarning) {
      setFormData((prev) => ({ ...prev, warnings: [...prev.warnings, newWarning] }));
    }
    setNewWarning("");
  };

  const removeWarning = (index: number) => {
    setFormData((prev) => ({ ...prev, warnings: prev.warnings.filter((_, i) => i !== index) }));
  };

  const handleAddNewCategory = () => {
    if (newCategory) {
      onAddCategory(newCategory);
      setFormData((prev) => ({ ...prev, category: newCategory }));
      setNewCategory("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{script ? "Modifier le script" : "Nouveau script"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nom du script *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
                required
              />
            </div>

            <div>
              <Label>Langage *</Label>
              <Select
                value={formData.language}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, language: v as ScriptLanguage }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="php">PHP</SelectItem>
                  <SelectItem value="sh">Shell (sh)</SelectItem>
                  <SelectItem value="bash">Bash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Difficulté *</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, difficulty: v as DifficultyLevel }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="débutant">Débutant</SelectItem>
                  <SelectItem value="intermédiaire">Intermédiaire</SelectItem>
                  <SelectItem value="avancé">Avancé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Code Editor */}
          <div>
            <Label htmlFor="code">Code *</Label>
            <Textarea
              id="code"
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
              className="font-mono text-sm bg-background min-h-[200px]"
              placeholder={formData.language === "php" ? "<?php\n// Votre code ici" : "#!/bin/bash\n# Votre script ici"}
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label>Catégorie *</Label>
            <div className="flex gap-2">
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Input
                  placeholder="Nouvelle..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-32"
                />
                <Button type="button" size="icon" variant="outline" onClick={handleAddNewCategory}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full bg-primary/20 text-primary text-sm flex items-center gap-1"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Select value="" onValueChange={addTag}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Ajouter un tag existant..." />
                </SelectTrigger>
                <SelectContent>
                  {tags
                    .filter((t) => !formData.tags.includes(t))
                    .map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Nouveau tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newTag) {
                      onAddTag(newTag);
                      addTag(newTag);
                    }
                  }
                }}
                className="w-32"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => {
                  if (newTag) {
                    onAddTag(newTag);
                    addTag(newTag);
                  }
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* WordPress Version */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Version WP minimum</Label>
              <Input
                value={formData.wpVersionMin}
                onChange={(e) => setFormData((prev) => ({ ...prev, wpVersionMin: e.target.value }))}
                placeholder="ex: 5.0"
              />
            </div>
            <div>
              <Label>Version WP maximum</Label>
              <Input
                value={formData.wpVersionMax}
                onChange={(e) => setFormData((prev) => ({ ...prev, wpVersionMax: e.target.value }))}
                placeholder="ex: 6.4"
              />
            </div>
          </div>

          {/* Author */}
          <div>
            <Label>Auteur</Label>
            <Input
              value={formData.author}
              onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
            />
          </div>

          {/* Instructions */}
          <div>
            <Label>Instructions d'utilisation</Label>
            <Textarea
              value={formData.instructions}
              onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))}
              rows={3}
              placeholder="Comment utiliser ce script..."
            />
          </div>

          {/* Dependencies */}
          <div>
            <Label>Dépendances</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.dependencies.map((dep) => (
                <span
                  key={dep}
                  className="px-2 py-1 rounded bg-muted text-muted-foreground text-sm flex items-center gap-1"
                >
                  {dep}
                  <button type="button" onClick={() => removeDependency(dep)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une dépendance..."
                value={newDep}
                onChange={(e) => setNewDep(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDependency();
                  }
                }}
              />
              <Button type="button" size="icon" variant="outline" onClick={addDependency}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Warnings */}
          <div>
            <Label>Avertissements</Label>
            <div className="space-y-2 mb-2">
              {formData.warnings.map((warning, i) => (
                <div
                  key={i}
                  className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm flex items-start gap-2"
                >
                  <span className="flex-1">{warning}</span>
                  <button type="button" onClick={() => removeWarning(i)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter un avertissement..."
                value={newWarning}
                onChange={(e) => setNewWarning(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addWarning();
                  }
                }}
              />
              <Button type="button" size="icon" variant="outline" onClick={addWarning}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">{script ? "Mettre à jour" : "Créer le script"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScriptEditor;
