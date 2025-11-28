import { useState, useEffect, useMemo } from "react";
import { GitCommand, defaultGitCommands, defaultGitCategories } from "@/types/git";

const STORAGE_KEY = "git-commander-commands";
const CATEGORIES_KEY = "git-commander-categories";

export const useGitCommands = () => {
  const [commands, setCommands] = useState<GitCommand[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storedCommands = localStorage.getItem(STORAGE_KEY);
    const storedCategories = localStorage.getItem(CATEGORIES_KEY);

    if (storedCommands) {
      setCommands(JSON.parse(storedCommands));
    } else {
      setCommands(defaultGitCommands);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultGitCommands));
    }

    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    } else {
      setCategories(defaultGitCategories);
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultGitCategories));
    }
  }, []);

  // Save commands to localStorage
  const saveCommands = (newCommands: GitCommand[]) => {
    setCommands(newCommands);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCommands));
  };

  // Add command
  const addCommand = (command: Omit<GitCommand, "id">) => {
    const newCommand: GitCommand = {
      ...command,
      id: Date.now().toString(),
    };
    const newCommands = [...commands, newCommand];
    saveCommands(newCommands);
    return newCommand;
  };

  // Update command
  const updateCommand = (id: string, updates: Partial<GitCommand>) => {
    const newCommands = commands.map((cmd) =>
      cmd.id === id ? { ...cmd, ...updates } : cmd
    );
    saveCommands(newCommands);
  };

  // Delete command
  const deleteCommand = (id: string) => {
    const newCommands = commands.filter((cmd) => cmd.id !== id);
    saveCommands(newCommands);
  };

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    const newCommands = commands.map((cmd) =>
      cmd.id === id ? { ...cmd, isFavorite: !cmd.isFavorite } : cmd
    );
    saveCommands(newCommands);
  };

  // Add category
  const addCategory = (category: string) => {
    if (!categories.includes(category)) {
      const newCategories = [...categories, category];
      setCategories(newCategories);
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(newCategories));
    }
  };

  // Filter commands
  const filteredCommands = useMemo(() => {
    return commands.filter((cmd) => {
      const matchesSearch =
        searchQuery === "" ||
        cmd.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.example.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === null || cmd.category === selectedCategory;

      const matchesFavorite = !showFavoritesOnly || cmd.isFavorite;

      return matchesSearch && matchesCategory && matchesFavorite;
    });
  }, [commands, searchQuery, selectedCategory, showFavoritesOnly]);

  // Get categories with counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    commands.forEach((cmd) => {
      counts[cmd.category] = (counts[cmd.category] || 0) + 1;
    });
    return categories.map((cat) => ({
      name: cat,
      count: counts[cat] || 0,
    }));
  }, [commands, categories]);

  const favoritesCount = useMemo(() => {
    return commands.filter((cmd) => cmd.isFavorite).length;
  }, [commands]);

  return {
    commands: filteredCommands,
    allCommands: commands,
    categories,
    categoriesWithCounts,
    favoritesCount,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showFavoritesOnly,
    setShowFavoritesOnly,
    addCommand,
    updateCommand,
    deleteCommand,
    toggleFavorite,
    addCategory,
  };
};
