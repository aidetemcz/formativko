import { describe, expect, it } from "vitest";
import { boldParts, textBlocks } from "./buddyText";

describe("textBlocks", () => {
  it("reads paragraphs, lists and headings", () => {
    expect(textBlocks("Tady je plán:\n\n### Průběh\n1. Motivace\n2. Práce\n- pozn.\n\nKonec\nřádku")).toEqual([
      { type: "p", text: "Tady je plán:" },
      { type: "h", text: "Průběh" },
      { type: "ol", items: ["Motivace", "Práce"] },
      { type: "ul", items: ["pozn."] },
      { type: "p", text: "Konec řádku" },
    ]);
  });

  it("splits bold parts", () => {
    expect(boldParts("a **b** c")).toEqual(["a ", "b", " c"]);
  });
});
