import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { KBCategory, KBCreateEntryInput, KBEntry, KBEntryListResponse, KBTag, KBUpdateEntryInput } from "@/types/knowledgeBase";

export interface KBEntryListFilters {
  query?: string;
  categoryId?: string | null;
  tagIds?: string[];
  status?: "active" | "archived";
  favorite?: boolean;
  sort?: "updated_desc" | "created_desc" | "created_asc" | "title_asc" | "title_desc";
  page?: number;
  pageSize?: number;
}

export function useKnowledgeBase() {
  const { isAuthenticated } = useAuth();
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [tags, setTags] = useState<KBTag[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshCategories = useCallback(async () => {
    const data = await api.get<{ categories: KBCategory[] }>("/kb/categories");
    setCategories(data.categories || []);
  }, []);

  const refreshTags = useCallback(async () => {
    const data = await api.get<{ tags: KBTag[] }>("/kb/tags");
    setTags(data.tags || []);
  }, []);

  const refreshEntries = useCallback(async (filters?: KBEntryListFilters) => {
    const params = new URLSearchParams();
    if (filters?.query) params.set("query", filters.query);
    if (filters?.categoryId) params.set("categoryId", filters.categoryId);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.favorite !== undefined) params.set("favorite", String(filters.favorite));
    if (filters?.sort) params.set("sort", filters.sort);
    if (filters?.page) params.set("page", String(filters.page));
    if (filters?.pageSize) params.set("pageSize", String(filters.pageSize));
    if (filters?.tagIds?.length) params.set("tagIds", filters.tagIds.join(","));

    const qs = params.toString();
    const url = qs ? `/kb/entries?${qs}` : "/kb/entries";
    const data = await api.get<KBEntryListResponse>(url);
    setEntries(data.entries || []);
    return data;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoaded(true);
      return;
    }

    Promise.all([refreshCategories(), refreshTags(), refreshEntries()])
      .catch((e) => {
        console.error("Erreur chargement Knowledge Base:", e);
        setEntries([]);
        setCategories([]);
        setTags([]);
      })
      .finally(() => setIsLoaded(true));
  }, [isAuthenticated, refreshCategories, refreshEntries, refreshTags]);

  const createCategory = useCallback(async (name: string, position?: number) => {
    const { id } = await api.post<{ id: string }>("/kb/categories", { name, position });
    await refreshCategories();
    return id;
  }, [refreshCategories]);

  const updateCategory = useCallback(async (id: string, updates: Partial<{ name: string; position: number }>) => {
    await api.put(`/kb/categories/${id}`, updates);
    await refreshCategories();
  }, [refreshCategories]);

  const deleteCategory = useCallback(async (id: string) => {
    await api.delete(`/kb/categories/${id}`);
    await refreshCategories();
  }, [refreshCategories]);

  const createTag = useCallback(async (name: string) => {
    const { id } = await api.post<{ id: string }>("/kb/tags", { name });
    await refreshTags();
    return id;
  }, [refreshTags]);

  const deleteTag = useCallback(async (id: string) => {
    await api.delete(`/kb/tags/${id}`);
    await refreshTags();
  }, [refreshTags]);

  const createEntry = useCallback(async (input: KBCreateEntryInput) => {
    const { id } = await api.post<{ id: string }>("/kb/entries", input);
    return id;
  }, []);

  const updateEntry = useCallback(async (id: string, updates: KBUpdateEntryInput) => {
    await api.put(`/kb/entries/${id}`, updates);
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    await api.delete(`/kb/entries/${id}`);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const markOpened = useCallback(async (id: string) => {
    await api.post(`/kb/entries/${id}/opened`);
  }, []);

  return {
    entries,
    categories,
    tags,
    isLoaded,
    refreshEntries,
    refreshCategories,
    refreshTags,
    createCategory,
    updateCategory,
    deleteCategory,
    createTag,
    deleteTag,
    createEntry,
    updateEntry,
    deleteEntry,
    markOpened,
  };
}

