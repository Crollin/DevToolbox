import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { WPCLICommand, WPCLIExample, DifficultyLevel } from "@/types/wpcli";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

interface CommandEditorProps {
  command: WPCLICommand | null;
  categories: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<WPCLICommand, "id" | "createdAt" | "updatedAt">) => void;
  onAddCategory: (category: string) => void;
}

const emptyForm = (categories: string[]) => ({
  command: "",
  description: "",
  example: "",
  examples: [] as WPCLIExample[],
  options: "",
  notes: "",
  category: categories[0] || "",
  difficulty: "débutant" as DifficultyLevel,
  tags: [] as string[],
  isFavorite: false,
});

const CommandEditor = ({
  command,
  categories,
  isOpen,
  onClose,
  onSave,
  onAddCategory,
}: CommandEditorProps) => {
  const [formData, setFormData] = useState(() => emptyForm(categories));
  const [tagsInput, setTagsInput] = useState("");
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (command) {
      const examples =
        command.examples?.length > 0
          ? command.examples
          : command.example
            ? [{ title: "Exemple", code: command.example }]
            : [];
      setFormData({
        command: command.command,
        description: command.description,
        example: command.example,
        examples,
        options: command.options,
        notes: command.notes,
        category: command.category,
        difficulty: command.difficulty,
        tags: command.tags || [],
        isFavorite: command.isFavorite,
      });
      setTagsInput((command.tags || []).join(", "));
    } else {
      setFormData(emptyForm(categories));
      setTagsInput("");
    }
  }, [command, categories, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.command.trim() || !formData.description.trim()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const examples = formData.examples.filter((ex) => ex.code.trim());
    const example = formData.example || examples[0]?.code || "";

    onSave({
      ...formData,
      tags,
      examples,
      example,
    });
    onClose();
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      onAddCategory(newCategory.trim());
      setFormData((prev) => ({ ...prev, category: newCategory.trim() }));
      setNewCategory("");
    }
  };

  const updateExample = (index: number, patch: Partial<WPCLIExample>) => {
    setFormData((prev) => ({
      ...prev,
      examples: prev.examples.map((ex, i) => (i === index ? { ...ex, ...patch } : ex)),
    }));
  };

  const addExample = () => {
    setFormData((prev) => ({
      ...prev,
      examples: [...prev.examples, { title: `Exemple ${prev.examples.length + 1}`, code: "" }],
    }));
  };

  const removeExample = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {command ? "Modifier la commande" : "Nouvelle commande"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cmd">Commande *</Label>
            <Input
              id="cmd"
              value={formData.command}
              onChange={(e) => setFormData((prev) => ({ ...prev, command: e.target.value }))}
              placeholder="wp plugin list"
              className="font-mono"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Ce que fait cette commande..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label>Difficulté</Label>
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
            <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="dry-run, casse, migration"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Exemples</Label>
              <Button type="button" variant="outline" size="sm" onClick={addExample}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Ajouter
              </Button>
            </div>
            {formData.examples.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Ajoutez un ou plusieurs exemples nommés (dry-run, casse, etc.).
              </p>
            )}
            {formData.examples.map((ex, index) => (
              <div key={index} className="space-y-2 rounded-md border border-border p-3">
                <div className="flex gap-2">
                  <Input
                    value={ex.title}
                    onChange={(e) => updateExample(index, { title: e.target.value })}
                    placeholder="Titre (ex. Dry-run)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => removeExample(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  value={ex.code}
                  onChange={(e) => updateExample(index, { code: e.target.value })}
                  placeholder="wp search-replace 'a' 'b' --dry-run"
                  className="font-mono text-sm min-h-[72px]"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="options">Options / Flags</Label>
            <Textarea
              id="options"
              value={formData.options}
              onChange={(e) => setFormData((prev) => ({ ...prev, options: e.target.value }))}
              placeholder="--status : Filtre par statut&#10;--format : Format de sortie"
              className="font-mono text-sm min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Astuces, avertissements..."
              className="min-h-[60px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {command ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CommandEditor;
