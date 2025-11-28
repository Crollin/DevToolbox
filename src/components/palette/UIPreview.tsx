import { PaletteColor } from "@/types/palette";
import { getContrastColor } from "@/lib/colorUtils";

interface UIPreviewProps {
  colors: PaletteColor[];
}

const UIPreview = ({ colors }: UIPreviewProps) => {
  // Find colors by role or fallback
  const getColor = (role: string, fallbackIndex: number): string => {
    const found = colors.find((c) => c.role === role);
    return found?.hex || colors[fallbackIndex]?.hex || "#888888";
  };

  const primary = getColor("primary", 0);
  const secondary = getColor("secondary", 1);
  const accent = getColor("accent", 2);
  const background = getColor("background", 3);
  const foreground = getColor("foreground", 4);
  const muted = colors.find((c) => c.role === "muted")?.hex || "#666666";
  const destructive = colors.find((c) => c.role === "destructive")?.hex || "#ef4444";
  const success = colors.find((c) => c.role === "success")?.hex || "#22c55e";

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Prévisualisation UI</h3>
      
      <div
        className="rounded-xl p-4 space-y-4"
        style={{ backgroundColor: background, color: foreground }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: muted + "40" }}>
          <div className="font-bold" style={{ color: primary }}>
            Mon Projet
          </div>
          <div className="flex gap-2">
            <span className="text-sm" style={{ color: muted }}>Accueil</span>
            <span className="text-sm" style={{ color: muted }}>À propos</span>
            <span className="text-sm" style={{ color: accent }}>Contact</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Titre de section</h2>
          <p className="text-sm" style={{ color: muted }}>
            Ceci est un exemple de texte secondaire pour montrer comment vos couleurs s'appliquent.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-1.5 rounded-md text-sm font-medium"
            style={{ backgroundColor: primary, color: getContrastColor(primary) }}
          >
            Principal
          </button>
          <button
            className="px-3 py-1.5 rounded-md text-sm font-medium"
            style={{ backgroundColor: secondary, color: getContrastColor(secondary) }}
          >
            Secondaire
          </button>
          <button
            className="px-3 py-1.5 rounded-md text-sm font-medium border"
            style={{ borderColor: primary, color: primary }}
          >
            Outline
          </button>
          <button
            className="px-3 py-1.5 rounded-md text-sm font-medium"
            style={{ backgroundColor: destructive, color: getContrastColor(destructive) }}
          >
            Supprimer
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="p-3 rounded-lg border"
            style={{ borderColor: muted + "40", backgroundColor: background }}
          >
            <div className="text-sm font-medium mb-1">Carte 1</div>
            <div className="text-xs" style={{ color: muted }}>Description</div>
          </div>
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: accent + "20" }}
          >
            <div className="text-sm font-medium mb-1" style={{ color: accent }}>Carte accent</div>
            <div className="text-xs" style={{ color: muted }}>Highlight</div>
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-2">
          <div
            className="p-2 rounded text-xs"
            style={{ backgroundColor: success + "20", color: success }}
          >
            ✓ Succès : Votre action a été effectuée
          </div>
          <div
            className="p-2 rounded text-xs"
            style={{ backgroundColor: destructive + "20", color: destructive }}
          >
            ✕ Erreur : Une erreur est survenue
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Votre email..."
            className="flex-1 px-3 py-1.5 rounded-md text-sm border outline-none"
            style={{ 
              borderColor: muted + "40", 
              backgroundColor: background,
              color: foreground,
            }}
          />
          <button
            className="px-3 py-1.5 rounded-md text-sm font-medium"
            style={{ backgroundColor: primary, color: getContrastColor(primary) }}
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
};

export default UIPreview;
