import { useState, useEffect, useCallback } from "react";
import { WPCLICommand, defaultCategories, defaultCommands } from "@/types/wpcli";

const STORAGE_KEY = "wpcli-glossary";
const CATEGORIES_KEY = "wpcli-categories";

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useWPCLI = () => {
  const [commands, setCommands] = useState<WPCLICommand[]>([]);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [isLoaded, setIsLoaded] = useState(false);

  // Synchronize default commands with existing data
  const syncDefaultCommands = useCallback((existingCommands: WPCLICommand[]) => {
    const now = new Date().toISOString();
    const existingCommandKeys = new Set(existingCommands.map(cmd => cmd.command));
    const newCommands: WPCLICommand[] = [];

    // Find missing default commands
    defaultCommands.forEach(defaultCmd => {
      if (!existingCommandKeys.has(defaultCmd.command)) {
        newCommands.push({
          ...defaultCmd,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    // Add new commands if any
    if (newCommands.length > 0) {
      const updatedCommands = [...newCommands, ...existingCommands];
      setCommands(updatedCommands);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCommands));
      return true;
    }

    return false;
  }, []);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedCategories = localStorage.getItem(CATEGORIES_KEY);

    if (stored) {
      try {
        const parsedCommands = JSON.parse(stored) as WPCLICommand[];
        setCommands(parsedCommands);
        // Synchronize with default commands to add any missing ones
        syncDefaultCommands(parsedCommands);
      } catch {
        initializeDefaults();
      }
    } else {
      initializeDefaults();
    }

    if (storedCategories) {
      try {
        const parsedCategories = JSON.parse(storedCategories) as string[];
        // Merge with default categories to ensure all are present
        const mergedCategories = [...new Set([...defaultCategories, ...parsedCategories])];
        setCategories(mergedCategories);
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(mergedCategories));
      } catch {
        setCategories(defaultCategories);
      }
    } else {
      setCategories(defaultCategories);
    }

    setIsLoaded(true);
  }, [syncDefaultCommands]);

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
