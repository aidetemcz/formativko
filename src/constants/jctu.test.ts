import { describe, expect, it } from "vitest";
import { compareJctu, isJctuCode, JCTU_CODES, pupilSentence } from "./jctu";

describe("JČTÚ scale", () => {
  it("orders J < Č < T < Ú", () => {
    expect(JCTU_CODES).toEqual(["J", "C", "T", "U"]);
    expect(compareJctu("J", "U")).toBeLessThan(0);
    expect(compareJctu("T", "C")).toBeGreaterThan(0);
  });

  it("accepts only the stored ASCII codes", () => {
    expect(isJctuCode("C")).toBe(true);
    expect(isJctuCode("Č")).toBe(false);
    expect(isJctuCode(null)).toBe(false);
  });

  it("prefers the criterion's own sentence", () => {
    expect(pupilSentence("T", { T: "Popíšu skoro všechny části." })).toBe("Popíšu skoro všechny části.");
    expect(pupilSentence("T", null)).toMatch(/Skoro/);
    expect(pupilSentence("J", { J: "  " })).toMatch(/Ještě/);
  });
});
