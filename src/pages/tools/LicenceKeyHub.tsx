import { useState, useMemo } from "react";
import { Key, Plus, Search, Bell, Filter, ShieldCheck, Clock3, Layers3 } from "lucide-react";
import { tools } from "@/data/tools";
import ToolLayout from "@/components/ToolLayout";
import { useLicences } from "@/hooks/useLicences";
import { Licence, LicenceType, licenceTypeLabels, licenceTypeColors } from "@/types/licence";
import { getLicenceStatus } from "@/components/licence/LicenceStatusBadge";
import LicenceCard from "@/components/licence/LicenceCard";
import LicenceModal from "@/components/licence/LicenceModal";
import NotificationModal from "@/components/licence/NotificationModal";
import { cn } from "@/lib/utils";

const LicenceKeyHub = () => {
  const tool = tools.find((t) => t.id === "licence-key-hub")!;
  const { licences, ntfyConfig, addLicence, updateLicence, deleteLicence, updateNtfyConfig } = useLicences();
  
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<LicenceType | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNtfyModalOpen, setIsNtfyModalOpen] = useState(false);
  const [editingLicence, setEditingLicence] = useState<Licence | null>(null);

  const filteredLicences = useMemo(() => {
    return licences.filter((l) => {
      const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || l.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [licences, search, typeFilter]);

  const licencesToRenew = useMemo(() => {
    return licences.filter((l) => {
      const status = getLicenceStatus(l);
      return status === "expired" || status === "warning";
    });
  }, [licences]);

  const activeLicences = licences.filter((licence) => getLicenceStatus(licence) !== "expired").length;
  const lifetimeLicences = licences.filter((licence) => licence.isLifetime).length;

  const handleSave = (licenceData: Omit<Licence, "id" | "createdAt">) => {
    if (editingLicence) {
      updateLicence(editingLicence.id, licenceData);
    } else {
      addLicence(licenceData);
    }
    setEditingLicence(null);
  };

  const handleEdit = (licence: Licence) => {
    setEditingLicence(licence);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingLicence(null);
    setIsModalOpen(true);
  };

  return (
    <ToolLayout tool={tool}>
      <div className="tool-workspace max-w-5xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <p className="tool-kicker"><Key className="w-3.5 h-3.5" /> Coffre de projets</p>
            <h2 className="text-2xl font-bold text-foreground mb-1">Vos licences, prêtes à l’emploi</h2>
            <p className="text-muted-foreground text-sm">Un accès rapide aux clés, sièges et renouvellements de votre stack.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNtfyModalOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-all"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
              {licencesToRenew.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
                  {licencesToRenew.length}
                </span>
              )}
            </button>
            <button
              onClick={openNewModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ajouter</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="insight-card"><ShieldCheck className="insight-icon text-emerald-400" /><div><strong>{activeLicences}</strong><span>actives</span></div></div>
          <div className="insight-card"><Clock3 className="insight-icon text-accent" /><div><strong>{licencesToRenew.length}</strong><span>à surveiller</span></div></div>
          <div className="insight-card"><Layers3 className="insight-icon text-primary" /><div><strong>{lifetimeLicences}</strong><span>à vie</span></div></div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher une licence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <button
              onClick={() => setTypeFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                typeFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              Tous
            </button>
            {(Object.keys(licenceTypeLabels) as LicenceType[]).map((type) => {
              const colors = licenceTypeColors[type];
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors",
                    typeFilter === type
                      ? cn(colors.bg, colors.text, colors.border)
                      : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground"
                  )}
                >
                  {licenceTypeLabels[type]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Licences List */}
        <div className="space-y-3">
          {filteredLicences.length > 0 ? (
            filteredLicences.map((licence) => (
              <LicenceCard
                key={licence.id}
                licence={licence}
                onEdit={handleEdit}
                onDelete={deleteLicence}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <Key className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {search || typeFilter !== "all"
                  ? "Aucune licence trouvée"
                  : "Aucune licence enregistrée"}
              </p>
              {!search && typeFilter === "all" && (
                <button
                  onClick={openNewModal}
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  Ajouter votre première licence
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <LicenceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLicence(null);
        }}
        onSave={handleSave}
        editLicence={editingLicence}
      />

      <NotificationModal
        isOpen={isNtfyModalOpen}
        onClose={() => setIsNtfyModalOpen(false)}
        config={ntfyConfig}
        onSave={updateNtfyConfig}
        licences={licences}
      />
    </ToolLayout>
  );
};

export default LicenceKeyHub;
