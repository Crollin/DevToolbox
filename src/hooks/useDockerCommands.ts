import { useState, useEffect, useMemo } from "react";
import { DockerCommand, defaultDockerCommands, defaultDockerCategories } from "@/types/docker";

const STORAGE_KEY = "docker-commander-commands";
const CATEGORIES_KEY = "docker-commander-categories";

export const useDockerCommands = () => {
  const [commands, setCommands] = useState<DockerCommand[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    const storedCommands = localStorage.getItem(STORAGE_KEY);
    const storedCategories = localStorage.getItem(CATEGORIES_KEY);

    if (storedCommands) {
      setCommands(JSON.parse(storedCommands));
    } else {
      setCommands(defaultDockerCommands);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDockerCommands));
    }

    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    } else {
      setCategories(defaultDockerCategories);
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultDockerCategories));
    }
  }, []);

  const saveCommands = (newCommands: DockerCommand[]) => {
    setCommands(newCommands);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCommands));
  };

  const addCommand = (command: Omit<DockerCommand, "id">) => {
    const newCommand: DockerCommand = {
      ...command,
      id: Date.now().toString(),
    };
    const newCommands = [...commands, newCommand];
    saveCommands(newCommands);
    return newCommand;
  };

  const updateCommand = (id: string, updates: Partial<DockerCommand>) => {
    const newCommands = commands.map((cmd) =>
      cmd.id === id ? { ...cmd, ...updates } : cmd
    );
    saveCommands(newCommands);
  };

  const deleteCommand = (id: string) => {
    const newCommands = commands.filter((cmd) => cmd.id !== id);
    saveCommands(newCommands);
  };

  const toggleFavorite = (id: string) => {
    const newCommands = commands.map((cmd) =>
      cmd.id === id ? { ...cmd, isFavorite: !cmd.isFavorite } : cmd
    );
    saveCommands(newCommands);
  };

  const addCategory = (category: string) => {
    if (!categories.includes(category)) {
      const newCategories = [...categories, category];
      setCategories(newCategories);
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(newCategories));
    }
  };

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
