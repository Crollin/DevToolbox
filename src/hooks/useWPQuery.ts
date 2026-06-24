import { useState, useEffect, useCallback } from "react";
import { SavedQuery, WPQueryConfig } from "@/types/wpquery";
import api from "@/lib/api";
import {
  USE_API,
  isMigrationDone,
  markMigrationDone,
  loadFromLocalStorage,
  saveToLocalStorage,
} from "@/lib/apiStorage";

const STORAGE_KEY = "wpquery-builder-saved";
const MIGRATION_KEY = "migration_done_wpquery";

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useWPQuery = () => {
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const migrateToApi = useCallback(async (localQueries: SavedQuery[]) => {
    if (isMigrationDone(MIGRATION_KEY)) return;
    for (const query of localQueries) {
      try {
        await api.post("/queries", {
          name: query.name,
          description: query.description,
          config: query.config,
        });
      } catch (e) {
        console.error("Migration queries:", e);
      }
    }
    markMigrationDone(MIGRATION_KEY);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (USE_API) {
        try {
          const data = await api.get<{ savedQueries: SavedQuery[] }>("/queries");
          let loaded = data.savedQueries || [];

          if (loaded.length === 0) {
            const localQueries = loadFromLocalStorage<SavedQuery[]>(STORAGE_KEY, []);
            if (localQueries.length > 0 && !isMigrationDone(MIGRATION_KEY)) {
              await migrateToApi(localQueries);
              const refreshed = await api.get<{ savedQueries: SavedQuery[] }>("/queries");
              loaded = refreshed.savedQueries || [];
            }
          }

          setSavedQueries(loaded);
        } catch (error) {
          console.error("Erreur API queries:", error);
          setSavedQueries(loadFromLocalStorage(STORAGE_KEY, []));
        }
      } else {
        setSavedQueries(loadFromLocalStorage(STORAGE_KEY, []));
      }
      setIsLoaded(true);
    };
    void load();
  }, [migrateToApi]);

  useEffect(() => {
    if (!isLoaded || USE_API) return;
    saveToLocalStorage(STORAGE_KEY, savedQueries);
  }, [savedQueries, isLoaded]);

  const saveQuery = useCallback(
    async (name: string, config: WPQueryConfig, description?: string) => {
      const now = new Date().toISOString();
      if (USE_API) {
        const created = await api.post<{ id: string; createdAt: string; updatedAt: string }>(
          "/queries",
          { name, description, config }
        );
        const newQuery: SavedQuery = {
          id: created.id,
          name,
          description,
          config,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
        setSavedQueries((prev) => [newQuery, ...prev]);
        return newQuery;
      }
      const newQuery: SavedQuery = {
        id: generateId(),
        name,
        description,
        config,
        createdAt: now,
        updatedAt: now,
      };
      setSavedQueries((prev) => [newQuery, ...prev]);
      return newQuery;
    },
    []
  );

  const updateQuery = useCallback(
    async (id: string, data: Partial<Omit<SavedQuery, "id" | "createdAt">>) => {
      const existing = savedQueries.find((q) => q.id === id);
      if (!existing) return;
      const updated: SavedQuery = { ...existing, ...data, updatedAt: new Date().toISOString() };
      if (USE_API) {
        await api.put(`/queries/${id}`, {
          name: updated.name,
          description: updated.description,
          config: updated.config,
        });
      }
      setSavedQueries((prev) => prev.map((query) => (query.id === id ? updated : query)));
    },
    [savedQueries]
  );

  const deleteQuery = useCallback(
    async (id: string) => {
      if (USE_API) {
        await api.delete(`/queries/${id}`);
      }
      setSavedQueries((prev) => prev.filter((query) => query.id !== id));
    },
    []
  );

  const getQuery = useCallback(
    (id: string) => savedQueries.find((q) => q.id === id),
    [savedQueries]
  );

  return {
    savedQueries,
    isLoaded,
    saveQuery,
    updateQuery,
    deleteQuery,
    getQuery,
  };
};
