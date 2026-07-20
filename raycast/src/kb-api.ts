import { request } from "./api";

export interface KnowledgeEntry {
  id: string;
  title: string;
  url?: string | null;
  summary?: string | null;
  content?: string | null;
  status: "active" | "archived";
  isFavorite: boolean;
  tags: Array<{ id: string; name: string }>;
  updatedAt: string;
}

export function listKnowledgeEntries(query?: string) {
  const params = new URLSearchParams({
    page: "1",
    pageSize: "50",
    sort: "updated_desc",
  });
  if (query?.trim()) params.set("query", query.trim());
  return request<{ entries: KnowledgeEntry[] }>(
    `/kb/entries?${params.toString()}`,
  ).then((data) => data.entries);
}

export function markKnowledgeEntryOpened(id: string) {
  return request(`/kb/entries/${encodeURIComponent(id)}/opened`, {
    method: "POST",
  });
}
