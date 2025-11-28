import { useState, useEffect, useMemo } from "react";
import { SVGIcon, defaultIcons, defaultCategories } from "@/types/svgicon";

const STORAGE_KEY = "svg-icon-library";
const CATEGORIES_KEY = "svg-icon-categories";

export const useSVGIcons = () => {
  const [icons, setIcons] = useState<SVGIcon[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const storedIcons = localStorage.getItem(STORAGE_KEY);
    const storedCategories = localStorage.getItem(CATEGORIES_KEY);

    if (storedIcons) {
      setIcons(JSON.parse(storedIcons));
    } else {
      setIcons(defaultIcons);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultIcons));
    }

    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    } else {
      setCategories(defaultCategories);
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
    }
  }, []);

  // Save icons to localStorage
  const saveIcons = (newIcons: SVGIcon[]) => {
    setIcons(newIcons);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIcons));
  };

  // Add icon
  const addIcon = (icon: Omit<SVGIcon, "id" | "createdAt" | "updatedAt">) => {
    const newIcon: SVGIcon = {
      ...icon,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newIcons = [...icons, newIcon];
    saveIcons(newIcons);
    return newIcon;
  };

  // Update icon
  const updateIcon = (id: string, updates: Partial<SVGIcon>) => {
    const newIcons = icons.map((icon) =>
      icon.id === id
        ? { ...icon, ...updates, updatedAt: new Date().toISOString() }
        : icon
    );
    saveIcons(newIcons);
  };

  // Delete icon
  const deleteIcon = (id: string) => {
    const newIcons = icons.filter((icon) => icon.id !== id);
    saveIcons(newIcons);
  };

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    const newIcons = icons.map((icon) =>
      icon.id === id
        ? { ...icon, isFavorite: !icon.isFavorite, updatedAt: new Date().toISOString() }
        : icon
    );
    saveIcons(newIcons);
  };

  // Add category
  const addCategory = (category: string) => {
    if (!categories.includes(category)) {
      const newCategories = [...categories, category];
      setCategories(newCategories);
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(newCategories));
    }
  };

  // Filter icons
  const filteredIcons = useMemo(() => {
    return icons.filter((icon) => {
      const matchesSearch =
        searchQuery === "" ||
        icon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        icon.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        icon.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === null || icon.category === selectedCategory;

      const matchesFavorite = !showFavoritesOnly || icon.isFavorite;

      return matchesSearch && matchesCategory && matchesFavorite;
    });
  }, [icons, searchQuery, selectedCategory, showFavoritesOnly]);

  // Get categories with counts
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

  const favoritesCount = useMemo(() => {
    return icons.filter((icon) => icon.isFavorite).length;
  }, [icons]);

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
  };
};
