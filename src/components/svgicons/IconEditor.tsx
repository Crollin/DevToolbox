import { useState, useEffect } from "react";
import { X, Eye } from "lucide-react";
import { SVGIcon, defaultCategories } from "@/types/svgicon";
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
import { Slider } from "@/components/ui/slider";

interface IconEditorProps {
  icon: SVGIcon | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (icon: Omit<SVGIcon, "id" | "createdAt" | "updatedAt"> | Partial<SVGIcon>) => void;
  categories: string[];
  onAddCategory: (category: string) => void;
}

const IconEditor = ({
  icon,
  isOpen,
  onClose,
  onSave,
  categories,
  onAddCategory,
}: IconEditorProps) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "Interface",
    tags: "",
    svgCode: "",
    source: "",
    size: 24,
    color: "#000000",
    notes: "",
    isFavorite: false,
  });
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);

  useEffect(() => {
    if (icon) {
      setFormData({
        name: icon.name,
        category: icon.category,
        tags: icon.tags.join(", "),
        svgCode: icon.svgCode,
        source: icon.source,
        size: icon.size,
        color: icon.color === "currentColor" ? "#000000" : icon.color,
        notes: icon.notes,
        isFavorite: icon.isFavorite,
      });
    } else {
      setFormData({
        name: "",
        category: "Interface",
        tags: "",
        svgCode: "",
        source: "",
        size: 24,
        color: "#000000",
        notes: "",
        isFavorite: false,
      });
    }
  }, [icon, isOpen]);

  const handleSave = () => {
    const iconData = {
      name: formData.name,
      category: formData.category,
      tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      svgCode: formData.svgCode,
      source: formData.source,
      size: formData.size,
      color: formData.color,
      notes: formData.notes,
      isFavorite: formData.isFavorite,
    };

    if (icon) {
      onSave({ ...iconData, id: icon.id });
    } else {
      onSave(iconData);
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

  const getPreviewSvg = () => {
    if (!formData.svgCode) return "";
    let svg = formData.svgCode;
    svg = svg.replace(/width="[^"]*"/, `width="${formData.size}"`);
    svg = svg.replace(/height="[^"]*"/, `height="${formData.size}"`);
    svg = svg.replace(/stroke="[^"]*"/, `stroke="${formData.color}"`);
    return svg;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">
            {icon ? "Modifier l'icône" : "Nouvelle icône"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Preview */}
          {formData.svgCode && (
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center w-20 h-20 bg-background rounded-lg border border-border">
                <div
                  dangerouslySetInnerHTML={{ __html: getPreviewSvg() }}
                  style={{ color: formData.color }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Eye className="w-4 h-4" />
                  Aperçu en temps réel
                </div>
                <div className="text-xs text-muted-foreground">
                  Taille: {formData.size}px | Couleur: {formData.color}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Accueil"
              />
            </div>

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
          </div>

          {/* SVG Code */}
          <div className="space-y-2">
            <Label>Code SVG *</Label>
            <Textarea
              value={formData.svgCode}
              onChange={(e) =>
                setFormData({ ...formData, svgCode: e.target.value })
              }
              placeholder='<svg xmlns="http://www.w3.org/2000/svg" ...></svg>'
              className="font-mono text-xs min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Size */}
            <div className="space-y-2">
              <Label>Taille ({formData.size}px)</Label>
              <Slider
                value={[formData.size]}
                onValueChange={([value]) =>
                  setFormData({ ...formData, size: value })
                }
                min={12}
                max={128}
                step={1}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags (séparés par virgule)</Label>
              <Input
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="home, maison, accueil"
              />
            </div>

            {/* Source */}
            <div className="space-y-2">
              <Label>Source / Pack</Label>
              <Input
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                placeholder="Ex: Lucide, Heroicons..."
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Notes ou commentaires sur cette icône..."
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
            disabled={!formData.name || !formData.svgCode}
          >
            {icon ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IconEditor;
