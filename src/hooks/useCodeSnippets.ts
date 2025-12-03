import { useState, useEffect, useCallback } from "react";
import { 
  CodeSnippet, 
  WPCodeBoxSnippet, 
  WPCodeBoxExport, 
  defaultSnippets, 
  defaultSnippetCategories, 
  defaultSnippetTags,
  SnippetLanguage,
  SnippetScope,
  SnippetPriority
} from "@/types/codesnippet";
import api from "@/lib/api";

const STORAGE_KEY = "code-snippet-library";
const USE_API = import.meta.env.VITE_USE_API !== "false"; // Par défaut true en production

interface CodeSnippetState {
  snippets: CodeSnippet[];
  folders: string[];
  customTags: string[];
}

// Convert WPCodeBox language type to our format
function convertLanguage(type?: string): SnippetLanguage {
  const mapping: Record<string, SnippetLanguage> = {
    php: "php",
    css: "css",
    scss: "scss",
    js: "javascript",
    javascript: "javascript",
    html: "html",
    sql: "sql",
    bash: "bash",
    shell: "bash",
    python: "python",
    json: "json",
  };
  return mapping[type?.toLowerCase() || "php"] || "php";
}

// Convert our language to WPCodeBox format
function toWPCodeBoxType(language: SnippetLanguage): string {
  const mapping: Record<SnippetLanguage, string> = {
    php: "php",
    javascript: "js",
    css: "css",
    scss: "css", // WPCodeBox doesn't support SCSS, export as CSS
    html: "html",
    sql: "sql",
    bash: "bash",
    python: "python",
    json: "json",
  };
  return mapping[language];
}

// Convert WPCodeBox scope to our format
function convertScope(scope?: string): SnippetScope {
  const mapping: Record<string, SnippetScope> = {
    global: "global",
    admin: "admin",
    frontend: "frontend",
    "admin-only": "admin",
    "front-end": "frontend",
    "single-use": "single-use",
    "run-once": "single-use",
  };
  return mapping[scope?.toLowerCase() || "global"] || "global";
}

export function useCodeSnippets() {
  const [state, setState] = useState<CodeSnippetState>({
    snippets: [],
    folders: defaultSnippetCategories,
    customTags: [],
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from API or localStorage
  useEffect(() => {
    const loadData = async () => {
      if (USE_API) {
        try {
          const data = await api.get<{ snippets: CodeSnippet[]; folders: string[]; customTags: string[] }>('/snippets');
          
          // Si aucun snippet n'existe, initialiser avec les snippets par défaut
          if (data.snippets.length === 0 && defaultSnippets.length > 0) {
            try {
              await api.post('/snippets/init', { snippets: defaultSnippets });
              // Recharger les snippets après initialisation
              const newData = await api.get<{ snippets: CodeSnippet[]; folders: string[]; customTags: string[] }>('/snippets');
              setState({
                snippets: newData.snippets || [],
                folders: newData.folders || defaultSnippetCategories,
                customTags: newData.customTags || [],
              });
            } catch (initError) {
              console.error('Erreur lors de l\'initialisation des snippets:', initError);
              // Utiliser les snippets par défaut en fallback
              setState({
                snippets: defaultSnippets,
                folders: data.folders || defaultSnippetCategories,
                customTags: data.customTags || [],
              });
            }
          } else {
            setState({
              snippets: data.snippets || [],
              folders: data.folders || defaultSnippetCategories,
              customTags: data.customTags || [],
            });
          }
        } catch (error) {
          console.error('Erreur lors du chargement depuis l\'API:', error);
          // Fallback sur localStorage
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setState({
                snippets: parsed.snippets || defaultSnippets,
                folders: parsed.folders || defaultSnippetCategories,
                customTags: parsed.customTags || [],
              });
            } catch {
              setState({
                snippets: defaultSnippets,
                folders: defaultSnippetCategories,
                customTags: [],
              });
            }
          } else {
            setState({
              snippets: defaultSnippets,
              folders: defaultSnippetCategories,
              customTags: [],
            });
          }
        }
      } else {
        // Mode localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setState({
              snippets: parsed.snippets || defaultSnippets,
              folders: parsed.folders || defaultSnippetCategories,
              customTags: parsed.customTags || [],
            });
          } catch {
            setState({
              snippets: defaultSnippets,
              folders: defaultSnippetCategories,
              customTags: [],
            });
          }
        } else {
          setState({
            snippets: defaultSnippets,
            folders: defaultSnippetCategories,
            customTags: [],
          });
        }
      }
      setIsLoaded(true);
    };

    loadData();
  }, []);

  // Save to API or localStorage
  useEffect(() => {
    if (!isLoaded) return;

    if (USE_API) {
      // Les sauvegardes se font via les fonctions add/update/delete
      // Pas besoin de sauvegarder automatiquement tout l'état
    } else {
      // Mode localStorage - sauvegarder l'état complet
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  // Get all folders
  const getAllFolders = useCallback(() => {
    const snippetFolders = state.snippets.map(s => s.folder).filter(Boolean) as string[];
    return [...new Set([...state.folders, ...snippetFolders])];
  }, [state.folders, state.snippets]);

  // Get all tags
  const getAllTags = useCallback(() => {
    const snippetTags = state.snippets.flatMap((s) => s.tags);
    return [...new Set([...defaultSnippetTags, ...state.customTags, ...snippetTags])];
  }, [state.customTags, state.snippets]);

  // Add snippet
  const addSnippet = useCallback(async (snippet: Omit<CodeSnippet, "id" | "createdAt" | "updatedAt">) => {
    if (USE_API) {
      try {
        const result = await api.post<{ id: string; createdAt: string; updatedAt: string }>('/snippets', snippet);
        const newSnippet: CodeSnippet = {
          ...snippet,
          id: result.id,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        };
        setState((prev) => ({
          ...prev,
          snippets: [newSnippet, ...prev.snippets],
        }));
        return newSnippet;
      } catch (error) {
        console.error('Erreur lors de l\'ajout du snippet:', error);
        throw error;
      }
    } else {
      const newSnippet: CodeSnippet = {
        ...snippet,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        snippets: [newSnippet, ...prev.snippets],
      }));
      return newSnippet;
    }
  }, []);

  // Update snippet
  const updateSnippet = useCallback(async (id: string, updates: Partial<Omit<CodeSnippet, "id" | "createdAt">>) => {
    if (USE_API) {
      try {
        await api.put(`/snippets/${id}`, updates);
        setState((prev) => ({
          ...prev,
          snippets: prev.snippets.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
          ),
        }));
      } catch (error) {
        console.error('Erreur lors de la mise à jour du snippet:', error);
        throw error;
      }
    } else {
      setState((prev) => ({
        ...prev,
        snippets: prev.snippets.map((s) =>
          s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
        ),
      }));
    }
  }, []);

  // Delete snippet
  const deleteSnippet = useCallback(async (id: string) => {
    if (USE_API) {
      try {
        await api.delete(`/snippets/${id}`);
        setState((prev) => ({
          ...prev,
          snippets: prev.snippets.filter((s) => s.id !== id),
        }));
      } catch (error) {
        console.error('Erreur lors de la suppression du snippet:', error);
        throw error;
      }
    } else {
      setState((prev) => ({
        ...prev,
        snippets: prev.snippets.filter((s) => s.id !== id),
      }));
    }
  }, []);

  // Toggle snippet favorite state
  const toggleFavorite = useCallback(async (id: string) => {
    const snippet = state.snippets.find((s) => s.id === id);
    if (!snippet) return;

    const newFavoriteState = !snippet.isFavorite;

    if (USE_API) {
      try {
        await api.put(`/snippets/${id}`, { isFavorite: newFavoriteState });
        setState((prev) => ({
          ...prev,
          snippets: prev.snippets.map((s) =>
            s.id === id ? { ...s, isFavorite: newFavoriteState, updatedAt: new Date().toISOString() } : s
          ),
        }));
      } catch (error) {
        console.error('Erreur lors de la mise à jour du favori:', error);
        throw error;
      }
    } else {
      setState((prev) => ({
        ...prev,
        snippets: prev.snippets.map((s) =>
          s.id === id ? { ...s, isFavorite: newFavoriteState, updatedAt: new Date().toISOString() } : s
        ),
      }));
    }
  }, [state.snippets]);

  // Import from WPCodeBox format
  const importFromWPCodeBox = useCallback((data: WPCodeBoxExport | WPCodeBoxSnippet[]): number => {
    let snippetsToImport: WPCodeBoxSnippet[] = [];
    
    if (Array.isArray(data)) {
      snippetsToImport = data;
    } else if (data.snippets) {
      snippetsToImport = data.snippets;
    }

    if (!Array.isArray(snippetsToImport) || snippetsToImport.length === 0) {
      throw new Error("Format JSON invalide ou aucun snippet trouvé");
    }

    const newSnippets: CodeSnippet[] = snippetsToImport.map((s) => ({
      id: crypto.randomUUID(),
      title: s.title || "Sans titre",
      description: s.description || "",
      code: s.code || "",
      language: convertLanguage(s.type),
      scope: convertScope(s.scope),
      priority: (Math.min(Math.max(s.priority || 10, 1), 10)) as SnippetPriority,
      tags: s.tags || [],
      folder: s.folder,
      isFavorite: false,
      createdAt: s.created || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wpCodeBoxId: s.id,
      cloudId: s.cloud_id,
    }));

    setState((prev) => ({
      ...prev,
      snippets: [...newSnippets, ...prev.snippets],
    }));

    return newSnippets.length;
  }, []);

  // Import from native format
  const importNative = useCallback((data: { snippets: CodeSnippet[] } | CodeSnippet[]): number => {
    const snippetsToImport = Array.isArray(data) ? data : data.snippets;
    
    if (!Array.isArray(snippetsToImport)) {
      throw new Error("Format JSON invalide");
    }

    const newSnippets = snippetsToImport.map((s) => ({
      ...s,
      id: crypto.randomUUID(),
      createdAt: s.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setState((prev) => ({
      ...prev,
      snippets: [...newSnippets, ...prev.snippets],
    }));

    return newSnippets.length;
  }, []);

  // Smart import - detect format automatically
  const importSnippets = useCallback((data: unknown): number => {
    // Detect WPCodeBox format
    if (typeof data === "object" && data !== null) {
      const obj = data as Record<string, unknown>;
      
      // Check for WPCodeBox structure
      if (obj.snippets && Array.isArray(obj.snippets)) {
        const firstSnippet = obj.snippets[0];
        if (firstSnippet && (firstSnippet.type !== undefined || firstSnippet.cloud_id !== undefined || firstSnippet.run_once !== undefined)) {
          return importFromWPCodeBox(data as WPCodeBoxExport);
        }
      }
      
      // Check if it's a direct array of WPCodeBox snippets
      if (Array.isArray(data)) {
        const firstSnippet = data[0];
        if (firstSnippet && (firstSnippet.type !== undefined || firstSnippet.cloud_id !== undefined)) {
          return importFromWPCodeBox(data as WPCodeBoxSnippet[]);
        }
      }
    }
    
    // Default to native format
    return importNative(data as { snippets: CodeSnippet[] } | CodeSnippet[]);
  }, [importFromWPCodeBox, importNative]);

  // Export to WPCodeBox format
  const exportToWPCodeBox = useCallback((snippetIds?: string[]) => {
    const toExport = snippetIds
      ? state.snippets.filter((s) => snippetIds.includes(s.id))
      : state.snippets;

    const wpCodeBoxSnippets: WPCodeBoxSnippet[] = toExport.map((s, index) => ({
      id: s.wpCodeBoxId || index + 1,
      title: s.title,
      code: s.code,
      description: s.description,
      type: toWPCodeBoxType(s.language),
      scope: s.scope,
      priority: s.priority,
      active: 1, // WPCodeBox format requires active, always set to 1
      tags: s.tags,
      folder: s.folder,
      cloud_id: s.cloudId,
      run_once: 0, // WPCodeBox format requires run_once, always set to 0
      modified: s.updatedAt,
      created: s.createdAt,
    }));

    const exportData: WPCodeBoxExport = {
      snippets: wpCodeBoxSnippets,
      folders: getAllFolders().map((name, index) => ({ id: index + 1, name })),
      version: "2.0",
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wpcodebox-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.snippets, getAllFolders]);

  // Export to native format
  const exportNative = useCallback((snippetIds?: string[]) => {
    const toExport = snippetIds
      ? state.snippets.filter((s) => snippetIds.includes(s.id))
      : state.snippets;

    const blob = new Blob([JSON.stringify({ snippets: toExport, folders: state.folders }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code-snippets-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.snippets, state.folders]);

  // Add folder
  const addFolder = useCallback(async (folder: string) => {
    if (USE_API) {
      try {
        await api.post('/snippets/folders', { name: folder });
        setState((prev) => ({
          ...prev,
          folders: [...new Set([...prev.folders, folder])],
        }));
      } catch (error) {
        console.error('Erreur lors de l\'ajout du dossier:', error);
        // Ajouter quand même localement en cas d'erreur
        setState((prev) => ({
          ...prev,
          folders: [...new Set([...prev.folders, folder])],
        }));
      }
    } else {
      setState((prev) => ({
        ...prev,
        folders: [...new Set([...prev.folders, folder])],
      }));
    }
  }, []);

  // Add tag
  const addTag = useCallback(async (tag: string) => {
    if (USE_API) {
      try {
        await api.post('/snippets/tags', { tag });
        setState((prev) => ({
          ...prev,
          customTags: [...new Set([...prev.customTags, tag])],
        }));
      } catch (error) {
        console.error('Erreur lors de l\'ajout du tag:', error);
        // Ajouter quand même localement en cas d'erreur
        setState((prev) => ({
          ...prev,
          customTags: [...new Set([...prev.customTags, tag])],
        }));
      }
    } else {
      setState((prev) => ({
        ...prev,
        customTags: [...new Set([...prev.customTags, tag])],
      }));
    }
  }, []);

  return {
    snippets: state.snippets,
    isLoaded,
    getAllFolders,
    getAllTags,
    addSnippet,
    updateSnippet,
    deleteSnippet,
    toggleFavorite,
    importSnippets,
    importFromWPCodeBox,
    exportToWPCodeBox,
    exportNative,
    addFolder,
    addTag,
  };
}
