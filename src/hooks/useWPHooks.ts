import { useState, useEffect, useCallback } from "react";
import { WPHook, defaultCategories, defaultHooks } from "@/types/wphook";
import api from "@/lib/api";
import {
  USE_API,
  isMigrationDone,
  markMigrationDone,
  loadFromLocalStorage,
  saveToLocalStorage,
} from "@/lib/apiStorage";

const STORAGE_KEY = "wphook-reference";
const CATEGORIES_KEY = "wphook-categories";
const MIGRATION_KEY = "migration_done_wphooks";

const generateId = () => Math.random().toString(36).substring(2, 11);

function toApiHook(hook: Omit<WPHook, "id" | "createdAt" | "updatedAt"> | WPHook) {
  return {
    name: hook.name,
    type: hook.type,
    description: hook.description,
    category: hook.category,
    tags: hook.tags,
    example: hook.example,
    parameters: hook.parameters,
    since: hook.since,
    deprecated: hook.deprecated,
    isFavorite: hook.isFavorite,
  };
}

function buildDefaultHooks(): WPHook[] {
  const now = new Date().toISOString();
  return defaultHooks.map((hook) => ({
    ...hook,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }));
}

export const useWPHooks = () => {
  const [hooks, setHooks] = useState<WPHook[]>([]);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [isLoaded, setIsLoaded] = useState(false);

  const persistLocal = useCallback((loadedHooks: WPHook[], cats: string[]) => {
    saveToLocalStorage(STORAGE_KEY, loadedHooks);
    saveToLocalStorage(CATEGORIES_KEY, cats);
  }, []);

  const migrateToApi = useCallback(async (localHooks: WPHook[], localCategories: string[]) => {
    if (isMigrationDone(MIGRATION_KEY)) return;
    for (const hook of localHooks) {
      try {
        await api.post("/hooks", toApiHook(hook));
      } catch (e) {
        console.error("Migration hooks:", e);
      }
    }
    for (const cat of localCategories) {
      if (!defaultCategories.includes(cat)) {
        try {
          await api.post("/hooks/categories", { name: cat });
        } catch (e) {
          console.error("Migration hook categories:", e);
        }
      }
    }
    markMigrationDone(MIGRATION_KEY);
  }, []);

  const seedDefaults = useCallback(async () => {
    const defaults = buildDefaultHooks();
    for (const hook of defaults) {
      try {
        await api.post("/hooks", toApiHook(hook));
      } catch (e) {
        console.error("Seed hooks:", e);
      }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      if (USE_API) {
        try {
          const data = await api.get<{ hooks: WPHook[]; categories: string[] }>("/hooks");
          let loaded = data.hooks || [];
          let cats = data.categories?.length ? data.categories : defaultCategories;

          if (loaded.length === 0) {
            const localHooks = loadFromLocalStorage<WPHook[]>(STORAGE_KEY, []);
            const localCats = loadFromLocalStorage<string[]>(CATEGORIES_KEY, defaultCategories);
            if (localHooks.length > 0 && !isMigrationDone(MIGRATION_KEY)) {
              await migrateToApi(localHooks, localCats);
              const refreshed = await api.get<{ hooks: WPHook[]; categories: string[] }>("/hooks");
              loaded = refreshed.hooks || [];
              cats = refreshed.categories?.length ? refreshed.categories : localCats;
            } else if (loaded.length === 0) {
              await seedDefaults();
              const refreshed = await api.get<{ hooks: WPHook[]; categories: string[] }>("/hooks");
              loaded = refreshed.hooks || [];
            }
          }

          setHooks(loaded);
          setCategories(cats);
        } catch (error) {
          console.error("Erreur API hooks:", error);
          setHooks(loadFromLocalStorage(STORAGE_KEY, buildDefaultHooks()));
          setCategories(loadFromLocalStorage(CATEGORIES_KEY, defaultCategories));
        }
      } else {
        const storedHooks = loadFromLocalStorage<WPHook[] | null>(STORAGE_KEY, null);
        const storedCats = loadFromLocalStorage<string[]>(CATEGORIES_KEY, defaultCategories);
        if (storedHooks && storedHooks.length > 0) {
          setHooks(storedHooks);
        } else {
          const defaults = buildDefaultHooks();
          setHooks(defaults);
          persistLocal(defaults, defaultCategories);
        }
        setCategories(storedCats);
      }
      setIsLoaded(true);
    };
    void load();
  }, [migrateToApi, persistLocal, seedDefaults]);

  useEffect(() => {
    if (!isLoaded || USE_API) return;
    if (hooks.length > 0) persistLocal(hooks, categories);
  }, [hooks, categories, isLoaded, persistLocal]);

  const addHook = useCallback(
    async (data: Omit<WPHook, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      if (USE_API) {
        const created = await api.post<{ id: string; createdAt: string; updatedAt: string }>(
          "/hooks",
          toApiHook(data)
        );
        const newHook: WPHook = {
          ...data,
          id: created.id,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
        setHooks((prev) => [newHook, ...prev]);
        return newHook;
      }
      const newHook: WPHook = { ...data, id: generateId(), createdAt: now, updatedAt: now };
      setHooks((prev) => [newHook, ...prev]);
      return newHook;
    },
    []
  );

  const updateHook = useCallback(
    async (id: string, data: Partial<Omit<WPHook, "id" | "createdAt">>) => {
      const existing = hooks.find((h) => h.id === id);
      if (!existing) return;
      const updated: WPHook = { ...existing, ...data, updatedAt: new Date().toISOString() };
      if (USE_API) {
        await api.put(`/hooks/${id}`, toApiHook(updated));
      }
      setHooks((prev) => prev.map((hook) => (hook.id === id ? updated : hook)));
    },
    [hooks]
  );

  const deleteHook = useCallback(
    async (id: string) => {
      if (USE_API) {
        await api.delete(`/hooks/${id}`);
      }
      setHooks((prev) => prev.filter((hook) => hook.id !== id));
    },
    []
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const hook = hooks.find((h) => h.id === id);
      if (hook) await updateHook(id, { isFavorite: !hook.isFavorite });
    },
    [hooks, updateHook]
  );

  const addCategory = useCallback(
    async (category: string) => {
      if (!categories.includes(category)) {
        if (USE_API) {
          try {
            await api.post("/hooks/categories", { name: category });
          } catch (e) {
            console.error("Erreur ajout catégorie hook:", e);
          }
        }
        setCategories((prev) => [...prev, category]);
      }
    },
    [categories]
  );

  const getHooksByCategory = useCallback(
    (category: string) => hooks.filter((hook) => hook.category === category),
    [hooks]
  );

  const getHooksByType = useCallback(
    (type: "action" | "filter") => hooks.filter((hook) => hook.type === type),
    [hooks]
  );

  const getFavorites = useCallback(() => hooks.filter((hook) => hook.isFavorite), [hooks]);

  return {
    hooks,
    categories,
    isLoaded,
    addHook,
    updateHook,
    deleteHook,
    toggleFavorite,
    addCategory,
    getHooksByCategory,
    getHooksByType,
    getFavorites,
  };
};
