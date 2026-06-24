import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function ResetPasswordHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const token = searchParams.get("reset");
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) setOpen(true);
  }, [token]);

  const handleClose = () => {
    setOpen(false);
    searchParams.delete("reset");
    setSearchParams(searchParams, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Minimum 6 caractères");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      toast({ title: "Mot de passe réinitialisé", description: "Vous pouvez vous connecter." });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau mot de passe</DialogTitle>
          <DialogDescription>Choisissez un nouveau mot de passe pour votre compte.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label>Nouveau mot de passe</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="space-y-2">
            <Label>Confirmer</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Réinitialiser"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
