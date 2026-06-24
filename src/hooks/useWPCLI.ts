import { WPCLICommand, DifficultyLevel, defaultCommands, defaultCategories } from "@/types/wpcli";
import { useCallback } from "react";
import { useCommandApi } from "./useCommandApi";

const STORAGE_KEY = "wpcli-glossary";
const CATEGORIES_KEY = "wpcli-categories";
const MIGRATION_KEY = "migration_done_wpcli";

function toApi(cmd: Omit<WPCLICommand, "id" | "createdAt" | "updatedAt"> | WPCLICommand) {
  return {
    name: cmd.command.slice(0, 80),
    command: cmd.command,
    description: [cmd.description, cmd.example, cmd.options, cmd.notes].filter(Boolean).join("\n\n"),
    category: cmd.category,
    tags: [cmd.difficulty],
    isFavorite: cmd.isFavorite,
  };
}

function fromApi(item: { id: string; command: string; description?: string | null; category: string; tags?: string[]; isFavorite?: boolean; createdAt?: string; updatedAt?: string }): WPCLICommand {
  const now = new Date().toISOString();
  return {
    id: item.id,
    command: item.command,
    description: item.description?.split("\n\n")[0] || "",
    example: "",
    options: "",
    notes: "",
    category: item.category,
    difficulty: (item.tags?.[0] as DifficultyLevel) || "intermédiaire",
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
    fromApi,
    getSearchableText: (cmd) => `${cmd.command} ${cmd.description} ${cmd.example}`,
  });

  const getCommandsByCategory = useCallback(
    (category: string) => base.allCommands.filter((cmd) => cmd.category === category),
    [base.allCommands]
  );

  const getFavorites = useCallback(
    () => base.allCommands.filter((cmd) => cmd.isFavorite),
    [base.allCommands]
  );

  return {
    ...base,
    getCommandsByCategory,
    getFavorites,
  };
};
