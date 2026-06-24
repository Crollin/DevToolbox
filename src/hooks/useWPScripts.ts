import { useState, useEffect, useCallback } from "react";
import { WPScript, defaultScripts, defaultCategories, defaultTags } from "@/types/wpscript";
import api from "@/lib/api";
import {
  USE_API,
  isMigrationDone,
  markMigrationDone,
  loadFromLocalStorage,
  saveToLocalStorage,
} from "@/lib/apiStorage";

const STORAGE_KEY = "wpscript-library";
const MIGRATION_KEY = "migration_done_scripts";

interface WPScriptState {
  scripts: WPScript[];
  customCategories: string[];
  customTags: string[];
}

function toApiScript(script: Omit<WPScript, "id" | "createdAt" | "updatedAt"> | WPScript) {
  return {
    name: script.name,
    description: script.description,
    code: script.code,
    language: script.language,
    category: script.category,
    tags: script.tags,
    wpVersionMin: script.wpVersionMin,
    wpVersionMax: script.wpVersionMax,
    author: script.author,
    difficulty: script.difficulty,
    instructions: script.instructions,
    dependencies: script.dependencies,
    warnings: script.warnings,
  };
}

export function useWPScripts() {
  const [state, setState] = useState<WPScriptState>({
    scripts: [],
    customCategories: [],
    customTags: [],
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const persistLocal = useCallback((data: WPScriptState) => {
    saveToLocalStorage(STORAGE_KEY, data);
  }, []);

  const migrateToApi = useCallback(async (local: WPScriptState) => {
    if (isMigrationDone(MIGRATION_KEY)) return;
    for (const script of local.scripts) {
      try {
        await api.post("/scripts", toApiScript(script));
      } catch (e) {
        console.error("Migration scripts:", e);
      }
    }
    markMigrationDone(MIGRATION_KEY);
  }, []);

  const seedDefaults = useCallback(async () => {
    for (const script of defaultScripts) {
      try {
        await api.post("/scripts", toApiScript(script));
      } catch (e) {
        console.error("Seed scripts:", e);
      }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      if (USE_API) {
        try {
          const data = await api.get<{
            scripts: WPScript[];
            categories: string[];
            customTags: string[];
          }>("/scripts");
          let scripts = data.scripts || [];
          let customCategories = (data.categories || []).filter((c) => !defaultCategories.includes(c));
          let customTags = data.customTags || [];

          if (scripts.length === 0) {
            const local = loadFromLocalStorage<WPScriptState>(STORAGE_KEY, {
              scripts: defaultScripts,
              customCategories: [],
              customTags: [],
            });
            if (local.scripts.length > 0 && !isMigrationDone(MIGRATION_KEY)) {
              await migrateToApi(local);
              const refreshed = await api.get<{
                scripts: WPScript[];
                categories: string[];
                customTags: string[];
              }>("/scripts");
              scripts = refreshed.scripts || [];
              customCategories = (refreshed.categories || []).filter((c) => !defaultCategories.includes(c));
              customTags = refreshed.customTags || local.customTags;
            } else if (scripts.length === 0 && defaultScripts.length > 0) {
              await seedDefaults();
              const refreshed = await api.get<{
                scripts: WPScript[];
                categories: string[];
                customTags: string[];
              }>("/scripts");
              scripts = refreshed.scripts || [];
            }
          }

          setState({ scripts, customCategories, customTags });
        } catch (error) {
          console.error("Erreur API scripts:", error);
          setState(
            loadFromLocalStorage(STORAGE_KEY, {
              scripts: defaultScripts,
              customCategories: [],
              customTags: [],
            })
          );
        }
      } else {
        const stored = loadFromLocalStorage<WPScriptState | null>(STORAGE_KEY, null);
        if (stored) {
          setState({
            scripts: stored.scripts || defaultScripts,
            customCategories: stored.customCategories || [],
            customTags: stored.customTags || [],
          });
        } else {
          const initial = { scripts: defaultScripts, customCategories: [], customTags: [] };
          setState(initial);
          persistLocal(initial);
        }
      }
      setIsLoaded(true);
    };
    void load();
  }, [migrateToApi, persistLocal, seedDefaults]);

  useEffect(() => {
    if (!isLoaded || USE_API) return;
    persistLocal(state);
  }, [state, isLoaded, persistLocal]);

  const getAllCategories = useCallback(() => {
    return [...new Set([...defaultCategories, ...state.customCategories])];
  }, [state.customCategories]);

  const getAllTags = useCallback(() => {
    const scriptTags = state.scripts.flatMap((s) => s.tags);
    return [...new Set([...defaultTags, ...state.customTags, ...scriptTags])];
  }, [state.customTags, state.scripts]);

  const addScript = useCallback(
    async (script: Omit<WPScript, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      if (USE_API) {
        const created = await api.post<{ id: string; createdAt: string; updatedAt: string }>(
          "/scripts",
          toApiScript(script)
        );
        const newScript: WPScript = {
          ...script,
          id: created.id,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
        setState((prev) => ({ ...prev, scripts: [newScript, ...prev.scripts] }));
        return newScript;
      }
      const newScript: WPScript = {
        ...script,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({ ...prev, scripts: [newScript, ...prev.scripts] }));
      return newScript;
    },
    []
  );

  const updateScript = useCallback(
    async (id: string, updates: Partial<Omit<WPScript, "id" | "createdAt">>) => {
      const existing = state.scripts.find((s) => s.id === id);
      if (!existing) return;
      const updated: WPScript = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      if (USE_API) {
        await api.put(`/scripts/${id}`, toApiScript(updated));
      }
      setState((prev) => ({
        ...prev,
        scripts: prev.scripts.map((s) => (s.id === id ? updated : s)),
      }));
    },
    [state.scripts]
  );

  const deleteScript = useCallback(
    async (id: string) => {
      if (USE_API) {
        await api.delete(`/scripts/${id}`);
      }
      setState((prev) => ({
        ...prev,
        scripts: prev.scripts.filter((s) => s.id !== id),
      }));
    },
    []
  );

  const importScripts = useCallback(
    async (jsonData: WPScript[] | { scripts: WPScript[] }) => {
      const scriptsToImport = Array.isArray(jsonData) ? jsonData : jsonData.scripts;

      if (!Array.isArray(scriptsToImport)) {
        throw new Error("Format JSON invalide");
      }

      const newScripts: WPScript[] = [];
      for (const s of scriptsToImport) {
        let script: WPScript = {
          ...s,
          id: crypto.randomUUID(),
          createdAt: s.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (USE_API) {
          const created = await api.post<{ id: string; createdAt: string; updatedAt: string }>(
            "/scripts",
            toApiScript(script)
          );
          script = { ...script, id: created.id, createdAt: created.createdAt, updatedAt: created.updatedAt };
        }
        newScripts.push(script);
      }

      setState((prev) => ({
        ...prev,
        scripts: [...newScripts, ...prev.scripts],
      }));

      return newScripts.length;
    },
    []
  );

  const exportScripts = useCallback(
    (scriptIds?: string[]) => {
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
    },
    [state.scripts]
  );

  const addCategory = useCallback((category: string) => {
    setState((prev) => ({
      ...prev,
      customCategories: [...new Set([...prev.customCategories, category])],
    }));
  }, []);

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
