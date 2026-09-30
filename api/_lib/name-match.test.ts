import { describe, expect, it } from "vitest";
import { matchPupil } from "./name-match.js";

const pupils = [
  { id: "a", first_name: "Adam", last_name: "Bílý" },
  { id: "b", first_name: "Adam", last_name: "Novák" },
  { id: "e", first_name: "Eva", last_name: "Černá" },
];

describe("matching a name read from an exit ticket", () => {
  it.each([
    ["Adam Bílý", "a"],
    ["BILY ADAM", "a"],
    ["eva černá", "e"],
    ["Adam N.", "b"],
  ])("%s → %s", (read, id) => expect(matchPupil(read, pupils)).toBe(id));

  it("gives up when the name is ambiguous or unknown", () => {
    expect(matchPupil("Adam", pupils)).toBeNull();
    expect(matchPupil("Petr Svoboda", pupils)).toBeNull();
    expect(matchPupil("", pupils)).toBeNull();
  });
});
