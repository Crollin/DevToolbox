import { useState, useEffect, useCallback } from "react";
import { ColorPalette, PaletteColor, ColorRole, HarmonyType } from "@/types/palette";
import { generateShades, generateHarmonyPalette, generateId, randomHex } from "@/lib/colorUtils";
import { predefinedPalettes, PredefinedPalette } from "@/data/predefinedPalettes";
import { toast } from "@/components/ui/sonner";

const STORAGE_KEY = "color-palettes";

const defaultRoles: ColorRole[] = ["primary", "secondary", "accent", "background", "foreground"];

const createDefaultPalette = (): ColorPalette => {
  const baseHex = randomHex();
  const harmonyColors = generateHarmonyPalette(baseHex, "analogous");
  
  const colors: PaletteColor[] = harmonyColors.map((hex, i) => ({
    id: generateId(),
    name: defaultRoles[i] || "Couleur " + (i + 1),
    hex,
    role: defaultRoles[i] || "custom",
    locked: false,
    shades: generateShades(hex),
  }));

  return {
    id: generateId(),
    name: "Nouvelle palette",
    description: "",
    harmony: "analogous",
    colors,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const useColorPalettes = () => {
  const [palettes, setPalettes] = useState<ColorPalette[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load palettes:", e);
    }
    return [createDefaultPalette()];
  });

  const [activePaletteId, setActivePaletteId] = useState<string>(() => {
    return palettes[0]?.id || "";
  });

  const activePalette = palettes.find((p) => p.id === activePaletteId) || palettes[0];

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes));
  }, [palettes]);

  // Create new palette
  const createPalette = useCallback((name?: string) => {
    const newPalette = createDefaultPalette();
    if (name) newPalette.name = name;
    setPalettes((prev) => [...prev, newPalette]);
    setActivePaletteId(newPalette.id);
    return newPalette;
  }, []);

  // Delete palette
  const deletePalette = useCallback((id: string) => {
    setPalettes((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length === 0) {
        const newDefault = createDefaultPalette();
        setActivePaletteId(newDefault.id);
        return [newDefault];
      }
      if (id === activePaletteId) {
        setActivePaletteId(filtered[0].id);
      }
      return filtered;
    });
  }, [activePaletteId]);

  // Duplicate palette
  const duplicatePalette = useCallback((id: string) => {
    const source = palettes.find((p) => p.id === id);
    if (!source) return;
    
    const duplicate: ColorPalette = {
      ...source,
      id: generateId(),
      name: source.name + " (copie)",
      colors: source.colors.map((c) => ({ ...c, id: generateId() })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setPalettes((prev) => [...prev, duplicate]);
    setActivePaletteId(duplicate.id);
  }, [palettes]);

  // Update palette metadata
  const updatePalette = useCallback((id: string, updates: Partial<Pick<ColorPalette, "name" | "description" | "harmony">>) => {
    setPalettes((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    );
  }, []);

  // Add color to palette
  const addColor = useCallback((paletteId: string, hex?: string) => {
    const color: PaletteColor = {
      id: generateId(),
      name: "Nouvelle couleur",
      hex: hex || randomHex(),
      role: "custom",
      locked: false,
      shades: generateShades(hex || randomHex()),
    };

    setPalettes((prev) =>
      prev.map((p) =>
        p.id === paletteId
          ? { ...p, colors: [...p.colors, color], updatedAt: new Date().toISOString() }
          : p
      )
    );
  }, []);

  // Remove color from palette
  const removeColor = useCallback((paletteId: string, colorId: string) => {
    setPalettes((prev) =>
      prev.map((p) =>
        p.id === paletteId
          ? { ...p, colors: p.colors.filter((c) => c.id !== colorId), updatedAt: new Date().toISOString() }
          : p
      )
    );
  }, []);

  // Update color
  const updateColor = useCallback((paletteId: string, colorId: string, updates: Partial<PaletteColor>) => {
    setPalettes((prev) =>
      prev.map((p) =>
        p.id === paletteId
          ? {
              ...p,
              colors: p.colors.map((c) => {
                if (c.id !== colorId) return c;
                const updated = { ...c, ...updates };
                // Regenerate shades if hex changed
                if (updates.hex && updates.hex !== c.hex) {
                  updated.shades = generateShades(updates.hex);
                }
                return updated;
              }),
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
  }, []);

  // Toggle lock
  const toggleLock = useCallback((paletteId: string, colorId: string) => {
    setPalettes((prev) =>
      prev.map((p) =>
        p.id === paletteId
          ? {
              ...p,
              colors: p.colors.map((c) =>
                c.id === colorId ? { ...c, locked: !c.locked } : c
              ),
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
  }, []);

  // Generate new colors based on harmony
  const generatePalette = useCallback((paletteId: string, harmony: HarmonyType) => {
    setPalettes((prev) =>
      prev.map((p) => {
        if (p.id !== paletteId) return p;

        const lockedColor = p.colors.find((c) => c.locked);
        const baseHex = lockedColor?.hex || randomHex();
        const newColors = generateHarmonyPalette(baseHex, harmony);

        const updatedColors = p.colors.map((c, i) => {
          if (c.locked) return c;
          const newHex = newColors[i] || randomHex();
          return {
            ...c,
            hex: newHex,
            shades: generateShades(newHex),
          };
        });

        // Add extra colors if needed
        while (updatedColors.length < newColors.length) {
          const hex = newColors[updatedColors.length];
          updatedColors.push({
            id: generateId(),
            name: "Couleur " + (updatedColors.length + 1),
            hex,
            role: "custom",
            locked: false,
            shades: generateShades(hex),
          });
        }

        return {
          ...p,
          harmony,
          colors: updatedColors,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  // Import palette from JSON
  const importPalette = useCallback((data: ColorPalette | ColorPalette[]) => {
    const palettesToImport = Array.isArray(data) ? data : [data];
    
    const imported = palettesToImport.map((p) => ({
      ...p,
      id: generateId(),
      colors: p.colors.map((c) => ({
        ...c,
        id: generateId(),
        shades: c.shades?.length ? c.shades : generateShades(c.hex),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setPalettes((prev) => [...prev, ...imported]);
    if (imported.length > 0) {
      setActivePaletteId(imported[0].id);
    }
    return imported.length;
  }, []);

  // Load predefined palette
  const loadPredefinedPalette = useCallback((predefinedId: string) => {
    const predefined = predefinedPalettes.find((p) => p.id === predefinedId);
    if (!predefined) {
      toast.error("Palette prédéfinie introuvable");
      return null;
    }

    const colors: PaletteColor[] = predefined.colors.map((color) => ({
      id: generateId(),
      name: color.name,
      hex: color.hex,
      role: color.role,
      locked: false,
      shades: generateShades(color.hex),
    }));

    const newPalette: ColorPalette = {
      id: generateId(),
      name: predefined.name,
      description: predefined.description,
      harmony: "custom",
      colors,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPalettes((prev) => [...prev, newPalette]);
    setActivePaletteId(newPalette.id);
    toast.success(`Palette "${predefined.name}" chargée avec succès`);
    return newPalette;
  }, []);

  return {
    palettes,
    activePalette,
    activePaletteId,
    setActivePaletteId,
    createPalette,
    deletePalette,
    duplicatePalette,
    updatePalette,
    addColor,
    removeColor,
    updateColor,
    toggleLock,
    generatePalette,
    importPalette,
    loadPredefinedPalette,
  };
};
