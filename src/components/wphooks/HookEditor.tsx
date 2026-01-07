import { useState, useEffect } from "react";
import { WPHook, HookType } from "@/types/wphook";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface HookEditorProps {
  hook: WPHook | null;
  categories: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<WPHook, "id" | "createdAt" | "updatedAt">) => void;
  onAddCategory: (category: string) => void;
}

const HookEditor = ({
  hook,
  categories,
  isOpen,
  onClose,
  onSave,
  onAddCategory,
}: HookEditorProps) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "action" as HookType,
    description: "",
    category: categories[0] || "",
    tags: [] as string[],
    example: "",
    parameters: "",
    since: "",
    deprecated: "",
    isFavorite: false,
  });

  const [newTag, setNewTag] = useState("");
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (hook) {
      setFormData({
        name: hook.name,
        type: hook.type,
        description: hook.description,
        category: hook.category,
        tags: hook.tags || [],
        example: hook.example,
        parameters: hook.parameters,
        since: hook.since,
        deprecated: hook.deprecated || "",
        isFavorite: hook.isFavorite,
      });
    } else {
      setFormData({
        name: "",
        type: "action",
        description: "",
        category: categories[0] || "",
        tags: [],
        example: "",
        parameters: "",
        since: "",
        deprecated: "",
        isFavorite: false,
      });
    }
  }, [hook, categories, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) return;
    onSave(formData);
    onClose();
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      onAddCategory(newCategory.trim());
      setFormData((prev) => ({ ...prev, category: newCategory.trim() }));
      setNewCategory("");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {hook ? "Modifier le hook" : "Nouveau hook"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du hook *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="init"
              className="font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, type: v as HookType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="action">Action</SelectItem>
                  <SelectItem value="filter">Filter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add new category */}
          <div className="flex gap-2">
            <Input
              placeholder="Nouvelle catégorie..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={handleAddCategory}>
              Ajouter
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description du hook..."
              required
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Nouveau tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Ajouter
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="example">Exemple d'utilisation</Label>
            <Textarea
              id="example"
              value={formData.example}
              onChange={(e) => setFormData((prev) => ({ ...prev, example: e.target.value }))}
              placeholder="add_action('init', 'my_function');"
              className="font-mono text-sm min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parameters">Paramètres</Label>
            <Textarea
              id="parameters"
              value={formData.parameters}
              onChange={(e) => setFormData((prev) => ({ ...prev, parameters: e.target.value }))}
              placeholder="$param1 (string) : Description&#10;$param2 (int) : Description"
              className="font-mono text-sm min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="since">Depuis (version)</Label>
              <Input
                id="since"
                value={formData.since}
                onChange={(e) => setFormData((prev) => ({ ...prev, since: e.target.value }))}
                placeholder="1.0.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deprecated">Déprécié (version)</Label>
              <Input
                id="deprecated"
                value={formData.deprecated}
                onChange={(e) => setFormData((prev) => ({ ...prev, deprecated: e.target.value }))}
                placeholder="5.0.0"
              />
            </div>
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {hook ? "Enregistrer" : "Créer"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default HookEditor;









