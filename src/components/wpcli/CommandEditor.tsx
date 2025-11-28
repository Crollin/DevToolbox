import { useState, useEffect } from "react";
import { WPCLICommand, DifficultyLevel } from "@/types/wpcli";
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

const CommandEditor = ({
  command,
  categories,
  isOpen,
  onClose,
  onSave,
  onAddCategory,
}: CommandEditorProps) => {
  const [formData, setFormData] = useState({
    command: "",
    description: "",
    example: "",
    options: "",
    notes: "",
    category: categories[0] || "",
    difficulty: "débutant" as DifficultyLevel,
    isFavorite: false,
  });

  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (command) {
      setFormData({
        command: command.command,
        description: command.description,
        example: command.example,
        options: command.options,
        notes: command.notes,
        category: command.category,
        difficulty: command.difficulty,
        isFavorite: command.isFavorite,
      });
    } else {
      setFormData({
        command: "",
        description: "",
        example: "",
        options: "",
        notes: "",
        category: categories[0] || "",
        difficulty: "débutant",
        isFavorite: false,
      });
    }
  }, [command, categories, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.command.trim() || !formData.description.trim()) return;
    onSave(formData);
    onClose();
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      onAddCategory(newCategory.trim());
      setFormData((prev) => ({ ...prev, category: newCategory.trim() }));
      setNewCategory("");
    }
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
            <Label htmlFor="example">Exemple d'utilisation</Label>
            <Textarea
              id="example"
              value={formData.example}
              onChange={(e) => setFormData((prev) => ({ ...prev, example: e.target.value }))}
              placeholder="wp plugin list --status=active"
              className="font-mono text-sm min-h-[80px]"
            />
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
