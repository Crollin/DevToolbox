import { LogOut, User, Key, Settings, LogIn, Cloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import AppLogo from "./AppLogo";
import { SearchTrigger } from "./SearchTrigger";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ChangePasswordModal } from "./auth/ChangePasswordModal";
import { AuthModal } from "./auth/AuthModal";
import { useState } from "react";
import { USE_API } from "@/lib/apiStorage";

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <header className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
            onKeyDown={(e) => e.key === "Enter" && navigate("/")}
            role="button"
            tabIndex={0}
          >
            <AppLogo size="md" />
            <div>
              <h1 className="text-lg font-bold text-foreground font-mono tracking-tight">
                DevToolbox
              </h1>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Personal dev utility</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SearchTrigger className="mr-1" />
            {isAuthenticated && USE_API && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-500/90 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Cloud className="w-3 h-3" />
                Synchronisé
              </span>
            )}
            <ThemeToggle />
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/account")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Mon compte
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowChangePasswordModal(true)}>
                    <Key className="w-4 h-4 mr-2" />
                    Changer le mot de passe
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => setShowAuthModal(true)} className="gap-2">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Se connecter</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  );
};

export default Header;
