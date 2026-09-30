import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderKnowledge } from "../../scripts/build-knowledge.mjs";
import { knowledge, knowledgeSection } from "./knowledge.js";

describe("embedded methodology", () => {
  it("matches metodologie/ (run `npm run gen:knowledge` after editing it)", () => {
    expect(readFileSync("api/_lib/knowledge.generated.ts", "utf8")).toBe(renderKnowledge());
  });

  it("cuts a chapter out of a file", () => {
    const s = knowledgeSection("vysvedceni-jinak/06-hodnoceni-v-teoretickych-predmetech.md", "6.3");
    expect(s.startsWith("## 6.3")).toBe(true);
    expect(s).toContain("Čtyřstupňová stupnice");
    expect(s).not.toContain("## 6.2");
  });

  it("fails loudly on a missing chapter", () => {
    expect(() => knowledgeSection("data/jak-psat-slovni-hodnoceni.md", "9.9")).toThrow();
    expect(knowledge("data/klicove-kompetence.md").length).toBeGreaterThan(1000);
  });
});
