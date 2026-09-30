import { describe, expect, it } from "vitest";
import { depseudonymize, pseudonymize, type PseudonymPerson } from "./pseudonym";

const adam: PseudonymPerson = { first_name: "Adam", last_name: "Novák", nickname: "Modrá vydra" };
const jana: PseudonymPerson = { first_name: "Jana", last_name: "Svobodová", nickname: "Zelený bobr" };
const eva: PseudonymPerson = { first_name: "Eva", last_name: "Černá", nickname: "Šedá sova" };

describe("pseudonymize", () => {
  it("replaces a full name with one nickname", () => {
    expect(pseudonymize("Adam Novák dnes vysvětlil zlomky.", [adam])).toBe(
      "Modrá vydra dnes vysvětlil zlomky.",
    );
    expect(pseudonymize("Novák Adam", [adam])).toBe("Modrá vydra");
  });

  it("replaces declined forms of first and last names", () => {
    expect(pseudonymize("Pomohl jsem Adamovi a Janě.", [adam, jana])).toBe(
      "Pomohl jsem Modrá vydra a Zelený bobr.",
    );
    expect(pseudonymize("Práce Evy a Nováka", [adam, eva])).toBe("Práce Šedá sova a Modrá vydra");
  });

  it("handles feminine adjectival surnames", () => {
    expect(pseudonymize("Úkol paní Černé a s Evou Černou", [eva])).toBe(
      "Úkol paní Šedá sova a s Šedá sova",
    );
  });

  it("replaces possessive forms", () => {
    expect(pseudonymize("Nákres Adamovy rostliny a Adamův sešit", [adam])).toBe(
      "Nákres Modrá vydra rostliny a Modrá vydra sešit",
    );
    expect(pseudonymize("Evin úkol a Janina práce", [eva, jana])).toBe("Šedá sova úkol a Zelený bobr práce");
  });

  it("leaves words that only start with a name alone", () => {
    expect(pseudonymize("Adamovský chodník", [adam])).toBe("Adamovský chodník");
  });

  it("is case-insensitive and copes with empty input", () => {
    expect(pseudonymize("ADAM", [adam])).toBe("Modrá vydra");
    expect(pseudonymize(null, [adam])).toBe("");
  });
});

describe("depseudonymize", () => {
  it("turns the nickname back into the first name", () => {
    expect(depseudonymize("Modrá vydra popsala části rostliny.", adam)).toBe(
      "Adam popsala části rostliny.",
    );
  });
});
