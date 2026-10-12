import { describe, it, expect } from "vitest";
import {
  parseChecklistItems,
  getChecklistProgress,
  toggleChecklistItem,
  extractNotesMarkdown,
} from "../taskChecklist";

const HELEBOR = `- Frise temporelle —> Découvrir Helebor —> Refaire une proposition graphique
- Menus -> Faire un mega menu
Paragraphe libre hors liste.`;

describe("parseChecklistItems", () => {
  it("détecte les puces plain comme non cochées", () => {
    const items = parseChecklistItems(HELEBOR);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      index: 0,
      checked: false,
      text: "Frise temporelle —> Découvrir Helebor —> Refaire une proposition graphique",
    });
    expect(items[1].text).toBe("Menus -> Faire un mega menu");
  });

  it("respecte les checkboxes GFM existantes", () => {
    const items = parseChecklistItems("- [x] Fait\n- [ ] À faire\n- [X] Aussi fait");
    expect(items.map((i) => i.checked)).toEqual([true, false, true]);
  });

  it("supporte *, + et listes numérotées", () => {
    const items = parseChecklistItems("* A\n+ B\n1. C");
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.text)).toEqual(["A", "B", "C"]);
  });

  it("retourne [] pour description vide ou sans liste", () => {
    expect(parseChecklistItems("")).toEqual([]);
    expect(parseChecklistItems("Juste un paragraphe")).toEqual([]);
  });
});

describe("getChecklistProgress", () => {
  it("compte done/total", () => {
    expect(getChecklistProgress("- [x] A\n- [ ] B\n- [x] C")).toEqual({
      done: 2,
      total: 3,
    });
  });

  it("retourne 0/0 sans items", () => {
    expect(getChecklistProgress("rien")).toEqual({ done: 0, total: 0 });
  });
});

describe("toggleChecklistItem", () => {
  it("coche un item plain et normalise en GFM", () => {
    const next = toggleChecklistItem("- A\n- B", 0, true);
    expect(next).toBe("- [x] A\n- [ ] B");
  });

  it("décoche un item [x]", () => {
    const next = toggleChecklistItem("- [x] A\n- [ ] B", 0, false);
    expect(next).toBe("- [ ] A\n- [ ] B");
  });

  it("préserve les lignes hors liste", () => {
    const next = toggleChecklistItem("Intro\n\n- A\n\nOutro", 0, true);
    expect(next).toBe("Intro\n\n- [x] A\n\nOutro");
  });

  it("ignore un index invalide", () => {
    expect(toggleChecklistItem("- A", 5, true)).toBe("- A");
  });
});

describe("extractNotesMarkdown", () => {
  it("retire les lignes de liste et garde le reste", () => {
    expect(extractNotesMarkdown(HELEBOR)).toBe("Paragraphe libre hors liste.");
  });

  it("retourne chaîne vide si tout est liste", () => {
    expect(extractNotesMarkdown("- A\n- B")).toBe("");
  });
});
