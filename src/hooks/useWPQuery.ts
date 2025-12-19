import { useState, useEffect, useCallback } from "react";
import { SavedQuery, WPQueryConfig } from "@/types/wpquery";

const STORAGE_KEY = "wpquery-builder-saved";

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useWPQuery = () => {
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        setSavedQueries(JSON.parse(stored));
      } catch {
        setSavedQueries([]);
      }
    }

    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedQueries));
    }
  }, [savedQueries, isLoaded]);

  const saveQuery = useCallback((name: string, config: WPQueryConfig, description?: string) => {
    const now = new Date().toISOString();
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
  }, []);

  const updateQuery = useCallback((id: string, data: Partial<Omit<SavedQuery, "id" | "createdAt">>) => {
    setSavedQueries((prev) =>
      prev.map((query) =>
        query.id === id
          ? { ...query, ...data, updatedAt: new Date().toISOString() }
          : query
      )
    );
  }, []);

  const deleteQuery = useCallback((id: string) => {
    setSavedQueries((prev) => prev.filter((query) => query.id !== id));
  }, []);

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








