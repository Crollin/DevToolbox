import { useState, useEffect, useMemo, useCallback } from "react";
import { SVGIcon, defaultIcons, defaultCategories } from "@/types/svgicon";
import api from "@/lib/api";
import {
  USE_API,
  isMigrationDone,
  markMigrationDone,
  loadFromLocalStorage,
  saveToLocalStorage,
} from "@/lib/apiStorage";

const STORAGE_KEY = "svg-icon-library";
const CATEGORIES_KEY = "svg-icon-categories";
const MIGRATION_KEY = "migration_done_icons";

function toApiIcon(icon: Omit<SVGIcon, "id" | "createdAt" | "updatedAt"> | SVGIcon) {
  return {
    name: icon.name,
    svg: icon.svg,
    tags: icon.tags,
    category: icon.category,
    isFavorite: icon.isFavorite,
  };
}

export const useSVGIcons = () => {
  const [icons, setIcons] = useState<SVGIcon[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const persistLocal = useCallback((loadedIcons: SVGIcon[], cats: string[]) => {
    saveToLocalStorage(STORAGE_KEY, loadedIcons);
    saveToLocalStorage(CATEGORIES_KEY, cats);
  }, []);

  const migrateToApi = useCallback(async (localIcons: SVGIcon[]) => {
    if (isMigrationDone(MIGRATION_KEY)) return;
    for (const icon of localIcons) {
      try {
        await api.post("/icons", toApiIcon(icon));
      } catch (e) {
        console.error("Migration icons:", e);
      }
    }
    markMigrationDone(MIGRATION_KEY);
  }, []);

  const seedDefaults = useCallback(async () => {
    for (const icon of defaultIcons) {
      try {
        await api.post("/icons", toApiIcon(icon));
      } catch (e) {
        console.error("Seed icons:", e);
      }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      if (USE_API) {
        try {
          const data = await api.get<{ icons: SVGIcon[] }>("/icons");
          let loaded = data.icons || [];
          const storedCats = loadFromLocalStorage<string[]>(CATEGORIES_KEY, defaultCategories);

          if (loaded.length === 0) {
            const localIcons = loadFromLocalStorage<SVGIcon[]>(STORAGE_KEY, []);
            if (localIcons.length > 0 && !isMigrationDone(MIGRATION_KEY)) {
              await migrateToApi(localIcons);
              const refreshed = await api.get<{ icons: SVGIcon[] }>("/icons");
              loaded = refreshed.icons || [];
            } else if (loaded.length === 0) {
              await seedDefaults();
              const refreshed = await api.get<{ icons: SVGIcon[] }>("/icons");
              loaded = refreshed.icons || [];
            }
          }

          setIcons(loaded);
          setCategories(storedCats.length ? storedCats : defaultCategories);
        } catch (error) {
          console.error("Erreur API icons:", error);
          setIcons(loadFromLocalStorage(STORAGE_KEY, defaultIcons));
          setCategories(loadFromLocalStorage(CATEGORIES_KEY, defaultCategories));
        }
      } else {
        const storedIcons = loadFromLocalStorage<SVGIcon[] | null>(STORAGE_KEY, null);
        const storedCats = loadFromLocalStorage<string[]>(CATEGORIES_KEY, defaultCategories);
        if (storedIcons) {
          setIcons(storedIcons);
        } else {
          setIcons(defaultIcons);
          persistLocal(defaultIcons, defaultCategories);
        }
        setCategories(storedCats);
      }
      setIsLoaded(true);
    };
    void load();
  }, [migrateToApi, persistLocal, seedDefaults]);

  useEffect(() => {
    if (!isLoaded || USE_API) return;
    persistLocal(icons, categories);
  }, [icons, categories, isLoaded, persistLocal]);

  const saveIcons = useCallback(
    (newIcons: SVGIcon[]) => {
      setIcons(newIcons);
      if (!USE_API) saveToLocalStorage(STORAGE_KEY, newIcons);
    },
    []
  );

  const addIcon = useCallback(
    async (icon: Omit<SVGIcon, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      if (USE_API) {
        const created = await api.post<{ id: string; createdAt: string; updatedAt: string }>(
          "/icons",
          toApiIcon(icon)
        );
        const newIcon: SVGIcon = {
          ...icon,
          id: created.id,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
        saveIcons([...icons, newIcon]);
        return newIcon;
      }
      const newIcon: SVGIcon = { ...icon, id: Date.now().toString(), createdAt: now, updatedAt: now };
      saveIcons([...icons, newIcon]);
      return newIcon;
    },
    [icons, saveIcons]
  );

  const updateIcon = useCallback(
    async (id: string, updates: Partial<SVGIcon>) => {
      const existing = icons.find((i) => i.id === id);
      if (!existing) return;
      const updated: SVGIcon = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      if (USE_API) {
        await api.put(`/icons/${id}`, toApiIcon(updated));
      }
      saveIcons(icons.map((icon) => (icon.id === id ? updated : icon)));
    },
    [icons, saveIcons]
  );

  const deleteIcon = useCallback(
    async (id: string) => {
      if (USE_API) {
        await api.delete(`/icons/${id}`);
      }
      saveIcons(icons.filter((icon) => icon.id !== id));
    },
    [icons, saveIcons]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const icon = icons.find((i) => i.id === id);
      if (icon) await updateIcon(id, { isFavorite: !icon.isFavorite });
    },
    [icons, updateIcon]
  );

  const addCategory = useCallback(
    (category: string) => {
      if (!categories.includes(category)) {
        const newCategories = [...categories, category];
        setCategories(newCategories);
        saveToLocalStorage(CATEGORIES_KEY, newCategories);
      }
    },
    [categories]
  );

  const resetToDefaults = useCallback(async () => {
    if (USE_API) {
      for (const icon of icons) {
        try {
          await api.delete(`/icons/${icon.id}`);
        } catch (e) {
          console.error("Reset icons delete:", e);
        }
      }
      await seedDefaults();
      const data = await api.get<{ icons: SVGIcon[] }>("/icons");
      setIcons(data.icons || defaultIcons);
    } else {
      setIcons(defaultIcons);
      setCategories(defaultCategories);
      persistLocal(defaultIcons, defaultCategories);
    }
  }, [icons, persistLocal, seedDefaults]);

  const filteredIcons = useMemo(() => {
    return icons.filter((icon) => {
      const matchesSearch =
        searchQuery === "" ||
        icon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        icon.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        icon.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === null || icon.category === selectedCategory;
      const matchesFavorite = !showFavoritesOnly || icon.isFavorite;

      return matchesSearch && matchesCategory && matchesFavorite;
    });
  }, [icons, searchQuery, selectedCategory, showFavoritesOnly]);

  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    icons.forEach((icon) => {
      counts[icon.category] = (counts[icon.category] || 0) + 1;
    });
    return categories.map((cat) => ({
      name: cat,
      count: counts[cat] || 0,
    }));
  }, [icons, categories]);

  const favoritesCount = useMemo(() => icons.filter((icon) => icon.isFavorite).length, [icons]);

  return {
    icons: filteredIcons,
    allIcons: icons,
    categories,
    categoriesWithCounts,
    favoritesCount,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showFavoritesOnly,
    setShowFavoritesOnly,
    addIcon,
    updateIcon,
    deleteIcon,
    toggleFavorite,
    addCategory,
    resetToDefaults,
  };
};
