import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEME_OPTIONS = [
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
  { value: "system", label: "Système" },
] as const;

export function EditAccountModal({ isOpen, onClose }: EditAccountModalProps) {
  const { user, updateProfile } = useAuth();
  const { setTheme } = useTheme();
  const [name, setName] = useState("");
  const [themeValue, setThemeValue] = useState<string>("system");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name);
      setThemeValue(user.preferences?.theme || "system");
      setError("");
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Le nom ne peut pas être vide");
      return;
    }

    setIsLoading(true);

    try {
      const updates: { name?: string; preferences?: { theme: "light" | "dark" | "system" } } = {};
      if (trimmedName !== user?.name) {
        updates.name = trimmedName;
      }
      if (themeValue !== (user?.preferences?.theme || "system")) {
        updates.preferences = { theme: themeValue as "light" | "dark" | "system" };
      }

      if (Object.keys(updates).length === 0) {
        onClose();
        setIsLoading(false);
        return;
      }

      await updateProfile(updates);

      if (updates.preferences?.theme) {
        setTheme(updates.preferences.theme);
      }

      toast({
        title: "Profil mis à jour",
        description: "Vos modifications ont été enregistrées.",
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour du profil");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mon compte</DialogTitle>
          <DialogDescription>
            Modifiez votre nom et vos préférences d'affichage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              type="text"
              placeholder="Votre nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Thème</Label>
            <Select value={themeValue} onValueChange={setThemeValue} disabled={isLoading}>
              <SelectTrigger id="theme">
                <SelectValue placeholder="Choisir un thème" />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
