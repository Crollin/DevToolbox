import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";

const VALID_THEMES = ["light", "dark", "system"] as const;

/**
 * Synchronise le thème next-themes avec les préférences utilisateur stockées côté serveur.
 * S'exécute lorsque l'utilisateur est chargé (connexion, refresh /me).
 */
export function ThemeSyncFromUser() {
  const { user } = useAuth();
  const { setTheme } = useTheme();

  useEffect(() => {
    const theme = user?.preferences?.theme;
    if (theme && VALID_THEMES.includes(theme)) {
      setTheme(theme);
    }
  }, [user?.preferences?.theme, setTheme]);

  return null;
}
