import { describe, expect, it } from "vitest";
import { describeAuthError } from "./authErrors";

describe("describeAuthError", () => {
  it("explains a refused sign-up in Czech", () => {
    expect(describeAuthError("Database error saving new user", true)).toMatch(/pozvané/);
  });

  it("passes other messages through", () => {
    expect(describeAuthError("Invalid login credentials", false)).toBe("Invalid login credentials");
    expect(describeAuthError("Database error saving new user", false)).toBe("Database error saving new user");
  });
});
