export type ChecklistItem = {
  index: number;
  text: string;
  checked: boolean;
};

/** Capture: indent, bullet (-|*|+|1.), optional [x]/[ ], rest */
const LIST_ITEM_RE =
  /^(\s*)([-*+]|\d+\.)\s+(?:\[([ xX])\]\s+)?(.*)$/;

type LineKind =
  | { kind: "item"; indent: string; bullet: string; checked: boolean; text: string }
  | { kind: "other"; raw: string };

function classifyLine(line: string): LineKind {
  const match = line.match(LIST_ITEM_RE);
  if (!match) return { kind: "other", raw: line };
  const [, indent, bullet, box, text] = match;
  return {
    kind: "item",
    indent,
    bullet,
    checked: box === "x" || box === "X",
    text: text ?? "",
  };
}

export function parseChecklistItems(description: string): ChecklistItem[] {
  if (!description) return [];
  const items: ChecklistItem[] = [];
  for (const line of description.split("\n")) {
    const classified = classifyLine(line);
    if (classified.kind !== "item") continue;
    items.push({
      index: items.length,
      text: classified.text,
      checked: classified.checked,
    });
  }
  return items;
}

export function getChecklistProgress(description: string): {
  done: number;
  total: number;
} {
  const items = parseChecklistItems(description);
  const done = items.filter((i) => i.checked).length;
  return { done, total: items.length };
}

/**
 * Toggle item by checklist index. On write, normalizes ALL list lines to GFM
 * checkboxes so plain bullets become `- [ ]` / `- [x]`.
 */
export function toggleChecklistItem(
  description: string,
  index: number,
  checked: boolean
): string {
  if (!description) return description;
  const lines = description.split("\n");
  let itemCursor = -1;
  let found = false;

  const nextLines = lines.map((line) => {
    const classified = classifyLine(line);
    if (classified.kind !== "item") return line;
    itemCursor += 1;
    const isTarget = itemCursor === index;
    if (isTarget) found = true;
    const nextChecked = isTarget ? checked : classified.checked;
    const mark = nextChecked ? "x" : " ";
    return `${classified.indent}${classified.bullet} [${mark}] ${classified.text}`;
  });

  if (!found) return description;
  return nextLines.join("\n");
}

export function extractNotesMarkdown(description: string): string {
  if (!description) return "";
  const kept: string[] = [];
  for (const line of description.split("\n")) {
    if (classifyLine(line).kind === "item") continue;
    kept.push(line);
  }
  return kept.join("\n").trim();
}
