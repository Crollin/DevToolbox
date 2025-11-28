import { useState } from "react";
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Check, Search } from "lucide-react";
import { tools } from "@/data/tools";
import ToolLayout from "@/components/ToolLayout";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LicenceKey {
  id: string;
  name: string;
  key: string;
  service: string;
  expiresAt?: string;
  createdAt: string;
}

const mockKeys: LicenceKey[] = [
  { id: "1", name: "Figma Pro", key: "FIGMA-XXXX-XXXX-XXXX-1234", service: "Design", createdAt: "2024-01-15" },
  { id: "2", name: "JetBrains IDE", key: "JB-ABCD-EFGH-IJKL-5678", service: "IDE", expiresAt: "2025-06-30", createdAt: "2024-06-01" },
  { id: "3", name: "Adobe CC", key: "ADOBE-1234-5678-9ABC-DEF0", service: "Creative", expiresAt: "2025-03-15", createdAt: "2024-03-15" },
];

const LicenceKeyHub = () => {
  const tool = tools.find((t) => t.id === "licence-key-hub")!;
  const [keys, setKeys] = useState<LicenceKey[]>(mockKeys);
  const [search, setSearch] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredKeys = keys.filter(
    (k) =>
      k.name.toLowerCase().includes(search.toLowerCase()) ||
      k.service.toLowerCase().includes(search.toLowerCase())
  );

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyKey = (key: LicenceKey) => {
    navigator.clipboard.writeText(key.key);
    setCopiedId(key.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Clé copiée",
      description: `La clé de ${key.name} a été copiée dans le presse-papier.`,
    });
  };

  const deleteKey = (id: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== id));
    toast({
      title: "Clé supprimée",
      description: "La clé de licence a été supprimée.",
    });
  };

  const maskKey = (key: string) => {
    const parts = key.split("-");
    return parts.map((part, i) => (i === 0 ? part : "••••")).join("-");
  };

  return (
    <ToolLayout tool={tool}>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Gestionnaire de Clés</h2>
            <p className="text-muted-foreground text-sm">
              {keys.length} clé{keys.length !== 1 ? "s" : ""} de licence enregistrée{keys.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all">
            <Plus className="w-4 h-4" />
            Ajouter une clé
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une clé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Keys List */}
        <div className="space-y-3">
          {filteredKeys.map((key) => (
            <div
              key={key.id}
              className="group p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Key className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{key.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {key.service}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-muted-foreground">
                        {visibleKeys.has(key.id) ? key.key : maskKey(key.key)}
                      </code>
                      <button
                        onClick={() => toggleVisibility(key.id)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                      >
                        {visibleKeys.has(key.id) ? (
                          <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    {key.expiresAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expire le {new Date(key.expiresAt).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyKey(key)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      copiedId === key.id
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {copiedId === key.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteKey(key.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredKeys.length === 0 && (
            <div className="text-center py-12">
              <Key className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Aucune clé trouvée</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
};

export default LicenceKeyHub;
