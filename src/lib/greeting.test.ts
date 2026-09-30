import { describe, expect, it } from "vitest";
import { greeting, vocative } from "./greeting";

describe("greeting", () => {
  it("follows the time of day", () => {
    expect(greeting(7)).toBe("Dobré ráno");
    expect(greeting(13)).toBe("Dobrý den");
    expect(greeting(20)).toBe("Dobrý večer");
    expect(greeting(2)).toBe("Dobrý večer");
  });
});

describe("vocative", () => {
  it("turns -a into -o and leaves other names alone", () => {
    expect(vocative("Jana")).toBe("Jano");
    expect(vocative("Eva")).toBe("Evo");
    expect(vocative("Tomáš")).toBe("Tomáš");
    expect(vocative("")).toBe("");
  });
});
