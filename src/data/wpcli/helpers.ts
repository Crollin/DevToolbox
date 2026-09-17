import type { DifficultyLevel, WPCLICommandInput, WPCLIExample } from "@/types/wpcli";

type CmdInput = {
  command: string;
  description: string;
  category: string;
  difficulty?: DifficultyLevel;
  options?: string;
  notes?: string;
  tags?: string[];
  examples?: WPCLIExample[];
  example?: string;
  isFavorite?: boolean;
};

/** Normalise une entrée catalogue (exemple legacy → examples[]). */
export function cmd(input: CmdInput): WPCLICommandInput {
  const examples =
    input.examples?.length
      ? input.examples
      : input.example
        ? [{ title: "Exemple", code: input.example }]
        : [];

  return {
    command: input.command,
    description: input.description,
    category: input.category,
    difficulty: input.difficulty ?? "débutant",
    options: input.options ?? "",
    notes: input.notes ?? "",
    tags: input.tags ?? [],
    examples,
    example: input.example ?? examples[0]?.code ?? "",
    isFavorite: input.isFavorite ?? false,
  };
}
