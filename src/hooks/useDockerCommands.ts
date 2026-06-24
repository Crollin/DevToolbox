import { DockerCommand, DifficultyLevel, defaultDockerCommands, defaultDockerCategories } from "@/types/docker";
import { useCommandApi } from "./useCommandApi";

const STORAGE_KEY = "docker-commander-commands";
const CATEGORIES_KEY = "docker-commander-categories";
const MIGRATION_KEY = "migration_done_docker";

function toApi(cmd: Omit<DockerCommand, "id"> | DockerCommand) {
  return {
    name: cmd.command.slice(0, 80),
    command: cmd.command,
    description: [cmd.description, cmd.example, cmd.options, cmd.notes].filter(Boolean).join("\n\n"),
    category: cmd.category,
    tags: [cmd.difficulty],
    isFavorite: cmd.isFavorite,
  };
}

function fromApi(item: { id: string; command: string; description?: string | null; category: string; tags?: string[]; isFavorite?: boolean }): DockerCommand {
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
  };
}

export const useDockerCommands = () => useCommandApi<DockerCommand>({
    apiPath: "/docker",
    storageKey: STORAGE_KEY,
    categoriesKey: CATEGORIES_KEY,
    migrationKey: MIGRATION_KEY,
    defaults: defaultDockerCommands,
    defaultCategories: defaultDockerCategories,
    toApi,
    fromApi,
    getSearchableText: (cmd) => `${cmd.command} ${cmd.description} ${cmd.example}`,
  });
