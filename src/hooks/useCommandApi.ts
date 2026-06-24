import { useState, useEffect, useMemo, useCallback } from "react";
import api from "@/lib/api";
import {
  USE_API,
  isMigrationDone,
  markMigrationDone,
  loadFromLocalStorage,
  saveToLocalStorage,
} from "@/lib/apiStorage";

export interface CommandApiItem {
  id: string;
  name?: string;
  command: string;
  description?: string | null;
  category: string;
  tags?: string[];
  isFavorite?: boolean;
}

interface UseCommandApiOptions<T extends { id: string; category: string; isFavorite: boolean }> {
  apiPath: string;
  storageKey: string;
  categoriesKey: string;
  migrationKey: string;
  defaults: T[];
  defaultCategories: string[];
  toApi: (item: Omit<T, "id"> | T) => Record<string, unknown>;
  fromApi: (item: CommandApiItem) => T;
  getSearchableText: (item: T) => string;
}

export function useCommandApi<T extends { id: string; category: string; isFavorite: boolean }>(
  options: UseCommandApiOptions<T>
) {
  const {
    apiPath,
    storageKey,
    categoriesKey,
    migrationKey,
    defaults,
    defaultCategories,
    toApi,
    fromApi,
    getSearchableText,
  } = options;

  const [commands, setCommands] = useState<T[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const persistLocal = useCallback(
    (cmds: T[], cats: string[]) => {
      saveToLocalStorage(storageKey, cmds);
      saveToLocalStorage(categoriesKey, cats);
    },
    [storageKey, categoriesKey]
  );

  const migrateToApi = useCallback(
    async (localCommands: T[], localCategories: string[]) => {
      if (isMigrationDone(migrationKey)) return;
      for (const cmd of localCommands) {
        try {
          await api.post(apiPath, toApi(cmd));
        } catch (e) {
          console.error(`Migration ${apiPath}:`, e);
        }
      }
      markMigrationDone(migrationKey);
      void localCategories;
    },
    [apiPath, migrationKey, toApi]
  );

  useEffect(() => {
    const load = async () => {
      if (USE_API) {
        try {
          const data = await api.get<{ commands: CommandApiItem[]; categories: string[] }>(apiPath);
          let loaded = (data.commands || []).map(fromApi);
          let cats = data.categories?.length ? data.categories : defaultCategories;

          if (loaded.length === 0) {
            const localCmds = loadFromLocalStorage<T[]>(storageKey, defaults);
            const localCats = loadFromLocalStorage<string[]>(categoriesKey, defaultCategories);
            if (localCmds.length > 0 && !isMigrationDone(migrationKey)) {
              await migrateToApi(localCmds, localCats);
              const refreshed = await api.get<{ commands: CommandApiItem[]; categories: string[] }>(apiPath);
              loaded = (refreshed.commands || []).map(fromApi);
              cats = refreshed.categories?.length ? refreshed.categories : localCats;
            } else if (loaded.length === 0 && defaults.length > 0) {
              for (const cmd of defaults) {
                await api.post(apiPath, toApi(cmd));
              }
              const refreshed = await api.get<{ commands: CommandApiItem[]; categories: string[] }>(apiPath);
              loaded = (refreshed.commands || []).map(fromApi);
            }
          }

          setCommands(loaded);
          setCategories(cats);
        } catch (error) {
          console.error(`Erreur API ${apiPath}:`, error);
          setCommands(loadFromLocalStorage(storageKey, defaults));
          setCategories(loadFromLocalStorage(categoriesKey, defaultCategories));
        }
      } else {
        setCommands(loadFromLocalStorage(storageKey, defaults));
        setCategories(loadFromLocalStorage(categoriesKey, defaultCategories));
        if (!localStorage.getItem(storageKey)) persistLocal(defaults, defaultCategories);
      }
      setIsLoaded(true);
    };
    void load();
  }, []);

  const saveCommands = useCallback(
    (newCommands: T[]) => {
      setCommands(newCommands);
      if (!USE_API) persistLocal(newCommands, categories);
    },
    [categories, persistLocal]
  );

  const addCommand = useCallback(
    async (command: Omit<T, "id">) => {
      if (USE_API) {
        const created = await api.post<{ id: string }>(apiPath, toApi(command));
        const newCommand = { ...command, id: created.id } as T;
        setCommands((prev) => [...prev, newCommand]);
        return newCommand;
      }
      const newCommand = { ...command, id: Date.now().toString() } as T;
      saveCommands([...commands, newCommand]);
      return newCommand;
    },
    [commands, saveCommands, toApi]
  );

  const updateCommand = useCallback(
    async (id: string, updates: Partial<T>) => {
      const existing = commands.find((c) => c.id === id);
      if (!existing) return;
      const updated = { ...existing, ...updates };
      if (USE_API) {
        await api.put(`${apiPath}/${id}`, toApi(updated));
      }
      const newCommands = commands.map((c) => (c.id === id ? updated : c));
      saveCommands(newCommands);
    },
    [commands, saveCommands, toApi]
  );

  const deleteCommand = useCallback(
    async (id: string) => {
      if (USE_API) {
        await api.delete(`${apiPath}/${id}`);
      }
      saveCommands(commands.filter((c) => c.id !== id));
    },
    [commands, saveCommands]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      const cmd = commands.find((c) => c.id === id);
      if (cmd) void updateCommand(id, { isFavorite: !cmd.isFavorite } as Partial<T>);
    },
    [commands, updateCommand]
  );

  const addCategory = useCallback(
    (category: string) => {
      if (!categories.includes(category)) {
        const newCategories = [...categories, category];
        setCategories(newCategories);
        if (!USE_API) saveToLocalStorage(categoriesKey, newCategories);
      }
    },
    [categories, categoriesKey]
  );

  const filteredCommands = useMemo(() => {
    return commands.filter((cmd) => {
      const text = getSearchableText(cmd).toLowerCase();
      const matchesSearch = searchQuery === "" || text.includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === null || cmd.category === selectedCategory;
      const matchesFavorite = !showFavoritesOnly || cmd.isFavorite;
      return matchesSearch && matchesCategory && matchesFavorite;
    });
  }, [commands, searchQuery, selectedCategory, showFavoritesOnly, getSearchableText]);

  const categoriesWithCounts = useMemo(() => {
    return categories.map((cat) => ({
      name: cat,
      count: commands.filter((c) => c.category === cat).length,
    }));
  }, [categories, commands]);

  const favoritesCount = useMemo(() => commands.filter((c) => c.isFavorite).length, [commands]);

  return {
    commands: filteredCommands,
    allCommands: commands,
    categories,
    isLoaded,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showFavoritesOnly,
    setShowFavoritesOnly,
    filteredCommands,
    categoriesWithCounts,
    favoritesCount,
    addCommand,
    updateCommand,
    deleteCommand,
    toggleFavorite,
    addCategory,
  };
}
