import { useState, useEffect, useCallback } from "react";
import { WPCLICommand, defaultCategories, defaultCommands } from "@/types/wpcli";

const STORAGE_KEY = "wpcli-glossary";
const CATEGORIES_KEY = "wpcli-categories";

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useWPCLI = () => {
  const [commands, setCommands] = useState<WPCLICommand[]>([]);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedCategories = localStorage.getItem(CATEGORIES_KEY);

    if (stored) {
      try {
        setCommands(JSON.parse(stored));
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
    const initialized = defaultCommands.map((cmd) => ({
      ...cmd,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }));
    setCommands(initialized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialized));
  };

  // Save to localStorage
  useEffect(() => {
    if (isLoaded && commands.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(commands));
    }
  }, [commands, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    }
  }, [categories, isLoaded]);

  const addCommand = useCallback((data: Omit<WPCLICommand, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newCommand: WPCLICommand = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setCommands((prev) => [newCommand, ...prev]);
    return newCommand;
  }, []);

  const updateCommand = useCallback((id: string, data: Partial<Omit<WPCLICommand, "id" | "createdAt">>) => {
    setCommands((prev) =>
      prev.map((cmd) =>
        cmd.id === id
          ? { ...cmd, ...data, updatedAt: new Date().toISOString() }
          : cmd
      )
    );
  }, []);

  const deleteCommand = useCallback((id: string) => {
    setCommands((prev) => prev.filter((cmd) => cmd.id !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setCommands((prev) =>
      prev.map((cmd) =>
        cmd.id === id
          ? { ...cmd, isFavorite: !cmd.isFavorite, updatedAt: new Date().toISOString() }
          : cmd
      )
    );
  }, []);

  const addCategory = useCallback((category: string) => {
    if (!categories.includes(category)) {
      setCategories((prev) => [...prev, category]);
    }
  }, [categories]);

  const getCommandsByCategory = useCallback(
    (category: string) => commands.filter((cmd) => cmd.category === category),
    [commands]
  );

  const getFavorites = useCallback(
    () => commands.filter((cmd) => cmd.isFavorite),
    [commands]
  );

  return {
    commands,
    categories,
    isLoaded,
    addCommand,
    updateCommand,
    deleteCommand,
    toggleFavorite,
    addCategory,
    getCommandsByCategory,
    getFavorites,
  };
};
