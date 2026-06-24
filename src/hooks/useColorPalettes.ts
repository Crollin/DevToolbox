import { useState, useEffect, useCallback } from "react";
import { ColorPalette, PaletteColor, ColorRole, HarmonyType } from "@/types/palette";
import { generateShades, generateHarmonyPalette, generateId, randomHex } from "@/lib/colorUtils";
import { predefinedPalettes } from "@/data/predefinedPalettes";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api";
import {
  USE_API,
  isMigrationDone,
  markMigrationDone,
  loadFromLocalStorage,
  saveToLocalStorage,
} from "@/lib/apiStorage";

const STORAGE_KEY = "color-palettes";
const ACTIVE_KEY = "color-palettes-active";
const MIGRATION_KEY = "migration_done_palettes";

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

function toApiPalette(palette: ColorPalette) {
  return {
    name: palette.name,
    description: palette.description,
    harmony: palette.harmony,
    colors: palette.colors,
  };
}

export const useColorPalettes = () => {
  const [palettes, setPalettes] = useState<ColorPalette[]>([createDefaultPalette()]);
  const [activePaletteId, setActivePaletteId] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  const activePalette = palettes.find((p) => p.id === activePaletteId) || palettes[0];

  const persistLocal = useCallback((items: ColorPalette[]) => {
    saveToLocalStorage(STORAGE_KEY, items);
  }, []);

  const migrateToApi = useCallback(async (localPalettes: ColorPalette[]) => {
    if (isMigrationDone(MIGRATION_KEY)) return;
    for (const palette of localPalettes) {
      try {
        await api.post("/palettes", toApiPalette(palette));
      } catch (e) {
        console.error("Migration palettes:", e);
      }
    }
    markMigrationDone(MIGRATION_KEY);
  }, []);

  const apiCreatePalette = useCallback(async (palette: ColorPalette): Promise<ColorPalette> => {
    const created = await api.post<{ id: string; createdAt: string; updatedAt: string }>(
      "/palettes",
      toApiPalette(palette)
    );
    return { ...palette, id: created.id, createdAt: created.createdAt, updatedAt: created.updatedAt };
  }, []);

  const apiUpdatePalette = useCallback(async (palette: ColorPalette) => {
    await api.put(`/palettes/${palette.id}`, toApiPalette(palette));
  }, []);

  const apiDeletePalette = useCallback(async (id: string) => {
    await api.delete(`/palettes/${id}`);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (USE_API) {
        try {
          const data = await api.get<{ palettes: ColorPalette[] }>("/palettes");
          let loaded = data.palettes || [];

          if (loaded.length === 0) {
            const localPalettes = loadFromLocalStorage<ColorPalette[]>(STORAGE_KEY, []);
            if (localPalettes.length > 0 && !isMigrationDone(MIGRATION_KEY)) {
              await migrateToApi(localPalettes);
              const refreshed = await api.get<{ palettes: ColorPalette[] }>("/palettes");
              loaded = refreshed.palettes || [];
            } else if (loaded.length === 0) {
              const defaultPalette = createDefaultPalette();
              const created = await apiCreatePalette(defaultPalette);
              loaded = [created];
            }
          }

          setPalettes(loaded);
          const storedActive = localStorage.getItem(ACTIVE_KEY);
          const activeId =
            storedActive && loaded.some((p) => p.id === storedActive) ? storedActive : loaded[0]?.id || "";
          setActivePaletteId(activeId);
        } catch (error) {
          console.error("Erreur API palettes:", error);
          const fallback = loadFromLocalStorage<ColorPalette[]>(STORAGE_KEY, [createDefaultPalette()]);
          setPalettes(fallback);
          setActivePaletteId(fallback[0]?.id || "");
        }
      } else {
        const stored = loadFromLocalStorage<ColorPalette[] | null>(STORAGE_KEY, null);
        if (stored && stored.length > 0) {
          setPalettes(stored);
          const storedActive = localStorage.getItem(ACTIVE_KEY);
          setActivePaletteId(
            storedActive && stored.some((p) => p.id === storedActive) ? storedActive : stored[0].id
          );
        } else {
          const defaultPalette = createDefaultPalette();
          setPalettes([defaultPalette]);
          setActivePaletteId(defaultPalette.id);
          persistLocal([defaultPalette]);
        }
      }
      setIsLoaded(true);
    };
    void load();
  }, [apiCreatePalette, migrateToApi, persistLocal]);

  useEffect(() => {
    if (!isLoaded || USE_API) return;
    persistLocal(palettes);
  }, [palettes, isLoaded, persistLocal]);

  useEffect(() => {
    if (activePaletteId) localStorage.setItem(ACTIVE_KEY, activePaletteId);
  }, [activePaletteId]);

  const createPalette = useCallback(
    async (name?: string) => {
      let newPalette = createDefaultPalette();
      if (name) newPalette = { ...newPalette, name };
      if (USE_API) {
        newPalette = await apiCreatePalette(newPalette);
      }
      setPalettes((prev) => [...prev, newPalette]);
      setActivePaletteId(newPalette.id);
      return newPalette;
    },
    [apiCreatePalette]
  );

  const deletePalette = useCallback(
    async (id: string) => {
      if (USE_API) {
        await apiDeletePalette(id);
      }
      const remaining = palettes.filter((p) => p.id !== id);
      if (remaining.length === 0) {
        let newDefault = createDefaultPalette();
        if (USE_API) {
          newDefault = await apiCreatePalette(newDefault);
        }
        setPalettes([newDefault]);
        setActivePaletteId(newDefault.id);
        return;
      }
      if (id === activePaletteId) {
        setActivePaletteId(remaining[0].id);
      }
      setPalettes(remaining);
    },
    [activePaletteId, apiCreatePalette, apiDeletePalette, palettes]
  );

  const duplicatePalette = useCallback(
    async (id: string) => {
      const source = palettes.find((p) => p.id === id);
      if (!source) return;

      let duplicate: ColorPalette = {
        ...source,
        id: generateId(),
        name: source.name + " (copie)",
        colors: source.colors.map((c) => ({ ...c, id: generateId() })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (USE_API) {
        duplicate = await apiCreatePalette(duplicate);
      }

      setPalettes((prev) => [...prev, duplicate]);
      setActivePaletteId(duplicate.id);
    },
    [apiCreatePalette, palettes]
  );

  const updatePalette = useCallback(
    async (id: string, updates: Partial<Pick<ColorPalette, "name" | "description" | "harmony">>) => {
      setPalettes((prev) => {
        const next = prev.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        );
        if (USE_API) {
          const updated = next.find((p) => p.id === id);
          if (updated) void apiUpdatePalette(updated);
        }
        return next;
      });
    },
    [apiUpdatePalette]
  );

  const syncPaletteColors = useCallback(
    async (paletteId: string, updater: (palette: ColorPalette) => ColorPalette) => {
      setPalettes((prev) => {
        const next = prev.map((p) => (p.id === paletteId ? updater(p) : p));
        if (USE_API) {
          const updated = next.find((p) => p.id === paletteId);
          if (updated) void apiUpdatePalette(updated);
        }
        return next;
      });
    },
    [apiUpdatePalette]
  );

  const addColor = useCallback(
    (paletteId: string, hex?: string) => {
      const color: PaletteColor = {
        id: generateId(),
        name: "Nouvelle couleur",
        hex: hex || randomHex(),
        role: "custom",
        locked: false,
        shades: generateShades(hex || randomHex()),
      };
      void syncPaletteColors(paletteId, (p) => ({
        ...p,
        colors: [...p.colors, color],
        updatedAt: new Date().toISOString(),
      }));
    },
    [syncPaletteColors]
  );

  const removeColor = useCallback(
    (paletteId: string, colorId: string) => {
      void syncPaletteColors(paletteId, (p) => ({
        ...p,
        colors: p.colors.filter((c) => c.id !== colorId),
        updatedAt: new Date().toISOString(),
      }));
    },
    [syncPaletteColors]
  );

  const updateColor = useCallback(
    (paletteId: string, colorId: string, updates: Partial<PaletteColor>) => {
      void syncPaletteColors(paletteId, (p) => ({
        ...p,
        colors: p.colors.map((c) => {
          if (c.id !== colorId) return c;
          const updated = { ...c, ...updates };
          if (updates.hex && updates.hex !== c.hex) {
            updated.shades = generateShades(updates.hex);
          }
          return updated;
        }),
        updatedAt: new Date().toISOString(),
      }));
    },
    [syncPaletteColors]
  );

  const toggleLock = useCallback(
    (paletteId: string, colorId: string) => {
      void syncPaletteColors(paletteId, (p) => ({
        ...p,
        colors: p.colors.map((c) => (c.id === colorId ? { ...c, locked: !c.locked } : c)),
        updatedAt: new Date().toISOString(),
      }));
    },
    [syncPaletteColors]
  );

  const generatePalette = useCallback(
    (paletteId: string, harmony: HarmonyType) => {
      void syncPaletteColors(paletteId, (p) => {
        const lockedColor = p.colors.find((c) => c.locked);
        const baseHex = lockedColor?.hex || randomHex();
        const newColors = generateHarmonyPalette(baseHex, harmony);

        const updatedColors = p.colors.map((c, i) => {
          if (c.locked) return c;
          const newHex = newColors[i] || randomHex();
          return { ...c, hex: newHex, shades: generateShades(newHex) };
        });

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

        return { ...p, harmony, colors: updatedColors, updatedAt: new Date().toISOString() };
      });
    },
    [syncPaletteColors]
  );

  const importPalette = useCallback(
    async (data: ColorPalette | ColorPalette[]) => {
      const palettesToImport = Array.isArray(data) ? data : [data];

      const imported: ColorPalette[] = [];
      for (const p of palettesToImport) {
        let palette: ColorPalette = {
          ...p,
          id: generateId(),
          colors: p.colors.map((c) => ({
            ...c,
            id: generateId(),
            shades: c.shades?.length ? c.shades : generateShades(c.hex),
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (USE_API) {
          palette = await apiCreatePalette(palette);
        }
        imported.push(palette);
      }

      setPalettes((prev) => [...prev, ...imported]);
      if (imported.length > 0) setActivePaletteId(imported[0].id);
      return imported.length;
    },
    [apiCreatePalette]
  );

  const loadPredefinedPalette = useCallback(
    async (predefinedId: string) => {
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

      let newPalette: ColorPalette = {
        id: generateId(),
        name: predefined.name,
        description: predefined.description,
        harmony: "custom",
        colors,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (USE_API) {
        newPalette = await apiCreatePalette(newPalette);
      }

      setPalettes((prev) => [...prev, newPalette]);
      setActivePaletteId(newPalette.id);
      toast.success(`Palette "${predefined.name}" chargée avec succès`);
      return newPalette;
    },
    [apiCreatePalette]
  );

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
