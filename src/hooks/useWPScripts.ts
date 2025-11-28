import { useState, useEffect, useCallback } from "react";
import { WPScript, defaultScripts, defaultCategories, defaultTags } from "@/types/wpscript";

const STORAGE_KEY = "wpscript-library";

interface WPScriptState {
  scripts: WPScript[];
  customCategories: string[];
  customTags: string[];
}

export function useWPScripts() {
  const [state, setState] = useState<WPScriptState>({
    scripts: [],
    customCategories: [],
    customTags: [],
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState({
          scripts: parsed.scripts || defaultScripts,
          customCategories: parsed.customCategories || [],
          customTags: parsed.customTags || [],
        });
      } catch {
        setState({
          scripts: defaultScripts,
          customCategories: [],
          customTags: [],
        });
      }
    } else {
      setState({
        scripts: defaultScripts,
        customCategories: [],
        customTags: [],
      });
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  // Get all categories (default + custom)
  const getAllCategories = useCallback(() => {
    return [...new Set([...defaultCategories, ...state.customCategories])];
  }, [state.customCategories]);

  // Get all tags (default + custom + from scripts)
  const getAllTags = useCallback(() => {
    const scriptTags = state.scripts.flatMap((s) => s.tags);
    return [...new Set([...defaultTags, ...state.customTags, ...scriptTags])];
  }, [state.customTags, state.scripts]);

  // Add script
  const addScript = useCallback((script: Omit<WPScript, "id" | "createdAt" | "updatedAt">) => {
    const newScript: WPScript = {
      ...script,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      scripts: [newScript, ...prev.scripts],
    }));
    return newScript;
  }, []);

  // Update script
  const updateScript = useCallback((id: string, updates: Partial<Omit<WPScript, "id" | "createdAt">>) => {
    setState((prev) => ({
      ...prev,
      scripts: prev.scripts.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      ),
    }));
  }, []);

  // Delete script
  const deleteScript = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      scripts: prev.scripts.filter((s) => s.id !== id),
    }));
  }, []);

  // Import scripts from JSON
  const importScripts = useCallback((jsonData: WPScript[] | { scripts: WPScript[] }) => {
    const scriptsToImport = Array.isArray(jsonData) ? jsonData : jsonData.scripts;
    
    if (!Array.isArray(scriptsToImport)) {
      throw new Error("Format JSON invalide");
    }

    const newScripts = scriptsToImport.map((s) => ({
      ...s,
      id: crypto.randomUUID(),
      createdAt: s.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setState((prev) => ({
      ...prev,
      scripts: [...newScripts, ...prev.scripts],
    }));

    return newScripts.length;
  }, []);

  // Export scripts to JSON
  const exportScripts = useCallback((scriptIds?: string[]) => {
    const toExport = scriptIds
      ? state.scripts.filter((s) => scriptIds.includes(s.id))
      : state.scripts;

    const blob = new Blob([JSON.stringify({ scripts: toExport }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wp-scripts-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.scripts]);

  // Add custom category
  const addCategory = useCallback((category: string) => {
    setState((prev) => ({
      ...prev,
      customCategories: [...new Set([...prev.customCategories, category])],
    }));
  }, []);

  // Add custom tag
  const addTag = useCallback((tag: string) => {
    setState((prev) => ({
      ...prev,
      customTags: [...new Set([...prev.customTags, tag])],
    }));
  }, []);

  return {
    scripts: state.scripts,
    isLoaded,
    getAllCategories,
    getAllTags,
    addScript,
    updateScript,
    deleteScript,
    importScripts,
    exportScripts,
    addCategory,
    addTag,
  };
}
