import { Terminal, LogOut, User, Key, Settings } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
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
import { EditAccountModal } from "./auth/EditAccountModal";
import { useState } from "react";

interface HeaderProps {}

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-primary" />
              </div>
              <div className="absolute -inset-1 bg-primary/20 rounded-lg blur-lg opacity-50" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground font-mono tracking-tight">
                DevToolbox
              </h1>
              <p className="text-xs text-muted-foreground">
                Boîte à outils personnelle
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated && user && (
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
                  <DropdownMenuItem onClick={() => setShowEditAccountModal(true)}>
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
            )}
          </div>
        </div>
      </div>
      <EditAccountModal
        isOpen={showEditAccountModal}
        onClose={() => setShowEditAccountModal(false)}
      />
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </header>
  );
};

export default Header;
