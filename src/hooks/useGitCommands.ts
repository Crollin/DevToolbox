import { GitCommand, DifficultyLevel, defaultGitCommands, defaultGitCategories } from "@/types/git";
import { useCommandApi } from "./useCommandApi";

const STORAGE_KEY = "git-commander-commands";
const CATEGORIES_KEY = "git-commander-categories";
const MIGRATION_KEY = "migration_done_git";

function toApi(cmd: Omit<GitCommand, "id"> | GitCommand) {
  return {
    name: cmd.command.slice(0, 80),
    command: cmd.command,
    description: [cmd.description, cmd.example, cmd.options, cmd.notes].filter(Boolean).join("\n\n"),
    category: cmd.category,
    tags: [cmd.difficulty],
    isFavorite: cmd.isFavorite,
  };
}

function fromApi(item: { id: string; command: string; description?: string | null; category: string; tags?: string[]; isFavorite?: boolean }): GitCommand {
  const difficulty = (item.tags?.[0] as DifficultyLevel) || "intermédiaire";
  return {
    id: item.id,
    command: item.command,
    description: item.description?.split("\n\n")[0] || "",
    example: "",
    options: "",
    notes: "",
    category: item.category,
    difficulty,
    isFavorite: Boolean(item.isFavorite),
  };
}

export const useGitCommands = () => useCommandApi<GitCommand>({
    apiPath: "/git",
    storageKey: STORAGE_KEY,
    categoriesKey: CATEGORIES_KEY,
    migrationKey: MIGRATION_KEY,
    defaults: defaultGitCommands,
    defaultCategories: defaultGitCategories,
    toApi,
    fromApi,
    getSearchableText: (cmd) => `${cmd.command} ${cmd.description} ${cmd.example}`,
  });
