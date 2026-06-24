import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: forgotEmail || email });
      toast({
        title: "Email envoyé",
        description: "Si cet email existe, un lien de réinitialisation a été envoyé.",
      });
      setShowForgot(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setForgotLoading(false);
    }
  };

  if (showForgot) {
    return (
      <form onSubmit={handleForgot} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>
        <div className="space-y-2">
          <Label htmlFor="forgotEmail">Email</Label>
          <Input
            id="forgotEmail"
            type="email"
            value={forgotEmail || email}
            onChange={(e) => setForgotEmail(e.target.value)}
            required
            disabled={forgotLoading}
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setShowForgot(false)} disabled={forgotLoading}>
            Retour
          </Button>
          <Button type="submit" className="flex-1" disabled={forgotLoading}>
            {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Envoyer le lien"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mot de passe</Label>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setShowForgot(true)}
          >
            Mot de passe oublié ?
          </button>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connexion...
          </>
        ) : (
          "Se connecter"
        )}
      </Button>
    </form>
  );
}
