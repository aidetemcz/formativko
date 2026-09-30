import { describe, expect, it } from "vitest";
import { subjectChipClasses, subjectColorKey } from "./subjectColors";

describe("subjectColorKey", () => {
  it.each([
    ["Čeština", "cestina"],
    ["Český jazyk a literatura", "cestina"],
    ["Matematika", "matematika"],
    ["M", "matematika"],
    ["Prvouka", "prvouka"],
    ["Anglický jazyk", "anglictina"],
    ["Hudební výchova", "hudebni"],
    ["Výtvarná výchova", "vytvarna"],
    ["Tělesná výchova", "telesna"],
    ["Informatika", "informatika"],
    ["Dějepis", "other"],
    ["", "other"],
  ])("%s → %s", (name, key) => {
    expect(subjectColorKey(name)).toBe(key);
  });

  it("returns token classes, never raw colours", () => {
    expect(subjectChipClasses("Matematika")).toBe("bg-subject-matematika text-subject-matematika-foreground");
  });
});
