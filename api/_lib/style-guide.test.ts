import { describe, expect, it } from "vitest";
import { findStyleIssues, STYLE_GUIDE } from "./style-guide.js";
import { SAMPLE_FLAWED_EVALUATION, SAMPLE_GOOD_EVALUATION } from "./methodology-samples.js";

describe("language rules", () => {
  it("cover what the brief lists", () => {
    for (const part of ["popisně", "umíš", "Neuzavírej cestu", "mám radost", "2. osobě", "přezdívkou"]) {
      expect(STYLE_GUIDE).toContain(part);
    }
  });

  it("find nothing wrong with the methodology's sample evaluation", () => {
    expect(findStyleIssues(SAMPLE_GOOD_EVALUATION)).toEqual([]);
  });

  it("catch the usual slips", () => {
    const rules = findStyleIssues(SAMPLE_FLAWED_EVALUATION).map((i) => i.rule);
    expect(rules).toEqual(expect.arrayContaining(["umis", "emoce", "uzavira"]));
  });

  it("do not flag words that only contain a banned one", () => {
    expect(findStyleIssues("Porozumíš textu a rozumíš zadání.")).toEqual([]);
  });
});
