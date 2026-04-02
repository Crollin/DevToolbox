export type KBEntryStatus = "active" | "archived";

export interface KBTag {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KBCategory {
  id: string;
  name: string;
  position: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface KBEntry {
  id: string;
  categoryId: string | null;
  url: string | null;
  title: string;
  summary: string | null;
  content: string | null;
  isFavorite: boolean;
  status: KBEntryStatus;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string | null;
  tags: KBTag[];
}

export interface KBEntryListResponse {
  page: number;
  pageSize: number;
  total: number;
  entries: KBEntry[];
  searchMode: "fts" | "like" | "none";
}

export interface KBCreateEntryInput {
  title: string;
  url?: string | null;
  summary?: string | null;
  content?: string | null;
  categoryId?: string | null;
  tags?: string[];
  isFavorite?: boolean;
  status?: KBEntryStatus;
}

export type KBUpdateEntryInput = Partial<KBCreateEntryInput>;

