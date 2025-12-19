import { useState, useEffect, useCallback } from "react";
import { WPHook, defaultCategories, defaultHooks } from "@/types/wphook";

const STORAGE_KEY = "wphook-reference";
const CATEGORIES_KEY = "wphook-categories";

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useWPHooks = () => {
  const [hooks, setHooks] = useState<WPHook[]>([]);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedCategories = localStorage.getItem(CATEGORIES_KEY);

    if (stored) {
      try {
        setHooks(JSON.parse(stored));
      } catch {
        initializeDefaults();
      }
    } else {
      initializeDefaults();
    }

    if (storedCategories) {
      try {
        setCategories(JSON.parse(storedCategories));
      } catch {
        setCategories(defaultCategories);
      }
    }

    setIsLoaded(true);
  }, []);

  const initializeDefaults = () => {
    const now = new Date().toISOString();
    const initialized = defaultHooks.map((hook) => ({
      ...hook,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }));
    setHooks(initialized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialized));
  };

  // Save to localStorage
  useEffect(() => {
    if (isLoaded && hooks.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hooks));
    }
  }, [hooks, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    }
  }, [categories, isLoaded]);

  const addHook = useCallback((data: Omit<WPHook, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newHook: WPHook = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setHooks((prev) => [newHook, ...prev]);
    return newHook;
  }, []);

  const updateHook = useCallback((id: string, data: Partial<Omit<WPHook, "id" | "createdAt">>) => {
    setHooks((prev) =>
      prev.map((hook) =>
        hook.id === id
          ? { ...hook, ...data, updatedAt: new Date().toISOString() }
          : hook
      )
    );
  }, []);

  const deleteHook = useCallback((id: string) => {
    setHooks((prev) => prev.filter((hook) => hook.id !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setHooks((prev) =>
      prev.map((hook) =>
        hook.id === id
          ? { ...hook, isFavorite: !hook.isFavorite, updatedAt: new Date().toISOString() }
          : hook
      )
    );
  }, []);

  const addCategory = useCallback((category: string) => {
    if (!categories.includes(category)) {
      setCategories((prev) => [...prev, category]);
    }
  }, [categories]);

  const getHooksByCategory = useCallback(
    (category: string) => hooks.filter((hook) => hook.category === category),
    [hooks]
  );

  const getHooksByType = useCallback(
    (type: "action" | "filter") => hooks.filter((hook) => hook.type === type),
    [hooks]
  );

  const getFavorites = useCallback(
    () => hooks.filter((hook) => hook.isFavorite),
    [hooks]
  );

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








