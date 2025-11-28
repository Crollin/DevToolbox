import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { DockerCommand, DifficultyLevel, defaultDockerCategories } from "@/types/docker";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DockerCommandEditorProps {
  command: DockerCommand | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (command: Omit<DockerCommand, "id"> | DockerCommand) => void;
  categories: string[];
  onAddCategory: (category: string) => void;
}

const DockerCommandEditor = ({
  command,
  isOpen,
  onClose,
  onSave,
  categories,
  onAddCategory,
}: DockerCommandEditorProps) => {
  const [formData, setFormData] = useState({
    command: "",
    description: "",
    example: "",
    options: "",
    notes: "",
    category: "Images",
    difficulty: "débutant" as DifficultyLevel,
    isFavorite: false,
  });
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);

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
        category: "Images",
        difficulty: "débutant",
        isFavorite: false,
      });
    }
  }, [command, isOpen]);

  const handleSave = () => {
    if (command) {
      onSave({ ...formData, id: command.id });
    } else {
      onSave(formData);
    }
    onClose();
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setFormData({ ...formData, category: newCategory.trim() });
      setNewCategory("");
      setShowNewCategory(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">
            {command ? "Modifier la commande" : "Nouvelle commande"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Command */}
          <div className="space-y-2">
            <Label>Commande *</Label>
            <Input
              value={formData.command}
              onChange={(e) =>
                setFormData({ ...formData, command: e.target.value })
              }
              placeholder="docker run -d nginx"
              className="font-mono"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Description de ce que fait la commande..."
              className="min-h-[60px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>Catégorie *</Label>
              {showNewCategory ? (
                <div className="flex gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Nouvelle catégorie"
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddCategory}>
                    OK
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowNewCategory(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="flex-1">
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNewCategory(true)}
                  >
                    +
                  </Button>
                </div>
              )}
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label>Difficulté</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value: DifficultyLevel) =>
                  setFormData({ ...formData, difficulty: value })
                }
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

          {/* Example */}
          <div className="space-y-2">
            <Label>Exemple</Label>
            <Input
              value={formData.example}
              onChange={(e) =>
                setFormData({ ...formData, example: e.target.value })
              }
              placeholder="docker run -d -p 8080:80 nginx"
              className="font-mono text-sm"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>Options / Flags</Label>
            <Input
              value={formData.options}
              onChange={(e) =>
                setFormData({ ...formData, options: e.target.value })
              }
              placeholder="-d (detached), -p (port), -v (volume)"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Conseils, avertissements, bonnes pratiques..."
              className="min-h-[60px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.command || !formData.description}
            className="bg-sky-600 hover:bg-sky-700"
          >
            {command ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DockerCommandEditor;
