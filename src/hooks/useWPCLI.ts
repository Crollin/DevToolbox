import { WPCLICommand, DifficultyLevel, WPCLIExample, defaultCategories } from "@/types/wpcli";
import { defaultCommands } from "@/data/wpcli";
import { useCallback } from "react";
import { useCommandApi } from "./useCommandApi";

const STORAGE_KEY = "wpcli-glossary-v3";
const CATEGORIES_KEY = "wpcli-categories-v3";
const MIGRATION_KEY = "migration_done_wpcli_v3";

type ApiWpcli = {
  id: string;
  command: string;
  description?: string | null;
  example?: string | null;
  options?: string | null;
  notes?: string | null;
  category: string;
  difficulty?: string;
  tags?: string[] | string | null;
  examples?: WPCLIExample[] | string | null;
  isFavorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function parseJsonArray<T>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function normalizeExamples(item: ApiWpcli | WPCLICommand): WPCLIExample[] {
  const fromField = parseJsonArray<WPCLIExample>(
    "examples" in item ? item.examples : undefined,
    []
  ).filter((ex) => ex && typeof ex.code === "string");
  if (fromField.length) return fromField;
  if (item.example) return [{ title: "Exemple", code: item.example }];
  return [];
}

function toApi(cmd: Omit<WPCLICommand, "id" | "createdAt" | "updatedAt"> | WPCLICommand) {
  const examples = cmd.examples?.length
    ? cmd.examples
    : cmd.example
      ? [{ title: "Exemple", code: cmd.example }]
      : [];

  return {
    command: cmd.command,
    description: cmd.description,
    example: cmd.example || examples[0]?.code || "",
    options: cmd.options,
    notes: cmd.notes,
    category: cmd.category,
    difficulty: cmd.difficulty,
    isFavorite: cmd.isFavorite,
    tags: cmd.tags ?? [],
    examples,
  };
}

function fromApi(item: ApiWpcli): WPCLICommand {
  const now = new Date().toISOString();
  const examples = normalizeExamples(item);
  const tags = parseJsonArray<string>(item.tags, []).filter((t) => typeof t === "string");

  return {
    id: item.id,
    command: item.command,
    description: item.description || "",
    example: item.example || examples[0]?.code || "",
    examples,
    options: item.options || "",
    notes: item.notes || "",
    category: item.category,
    difficulty: (item.difficulty as DifficultyLevel) || "intermédiaire",
    tags,
    isFavorite: Boolean(item.isFavorite),
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
  };
}

export const useWPCLI = () => {
  const base = useCommandApi<WPCLICommand>({
    apiPath: "/wpcli",
    storageKey: STORAGE_KEY,
    categoriesKey: CATEGORIES_KEY,
    migrationKey: MIGRATION_KEY,
    defaults: defaultCommands.map((c, i) => ({
      ...c,
      id: `default-wpcli-${i}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    defaultCategories: defaultCategories,
    toApi,
    fromApi: fromApi as Parameters<typeof useCommandApi<WPCLICommand>>[0]["fromApi"],
    getSearchableText: (cmd) =>
      `${cmd.command} ${cmd.description} ${cmd.example} ${cmd.notes} ${cmd.tags.join(" ")} ${cmd.examples.map((e) => e.code).join(" ")}`,
  });

  const getCommandsByCategory = useCallback(
    (category: string) => base.allCommands.filter((cmd) => cmd.category === category),
    [base.allCommands]
  );

  const getFavorites = useCallback(
    () => base.allCommands.filter((cmd) => cmd.isFavorite),
    [base.allCommands]
  );

  const getAllTags = useCallback(() => {
    const set = new Set<string>();
    base.allCommands.forEach((cmd) => cmd.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [base.allCommands]);

  return {
    ...base,
    getCommandsByCategory,
    getFavorites,
    getAllTags,
  };
};
