import { ArrowLeft, User, Settings, Key, LogOut, LogIn } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tool, categoryLabels, categoryColors } from "@/data/tools";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";
import { SearchTrigger } from "./SearchTrigger";
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

interface ToolLayoutProps {
  tool: Tool;
  children: React.ReactNode;
}

const ToolLayout = ({ tool, children }: ToolLayoutProps) => {
  const navigate = useNavigate();
  const colors = categoryColors[tool.category];
  const { user, isAuthenticated, logout } = useAuth();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Retour</span>
              </button>

              <div className="h-6 w-px bg-border shrink-0" />

              <div className="flex items-center gap-3 min-w-0">
                <span className={cn("category-badge border shrink-0", colors.bg, colors.text, colors.border)}>
                  {categoryLabels[tool.category]}
                </span>
                <h1 className="font-mono font-medium text-foreground tracking-tight truncate">
                  {tool.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <SearchTrigger />
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
      </header>
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Tool Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default ToolLayout;
