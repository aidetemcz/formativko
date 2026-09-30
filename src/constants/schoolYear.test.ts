import { describe, expect, it } from "vitest";
import { gradeFromClassName, monthOrder, schoolMonthOf } from "./schoolYear";

describe("school year", () => {
  it("orders months from September to June, unknown last", () => {
    expect(monthOrder("září")).toBe(0);
    expect(monthOrder("Červen")).toBe(9);
    expect(monthOrder("")).toBe(10);
    expect(monthOrder(null)).toBe(10);
  });

  it("maps dates to school months", () => {
    expect(schoolMonthOf(new Date(2026, 9, 5))).toBe("říjen");
    expect(schoolMonthOf(new Date(2026, 7, 30))).toBe("září");
  });

  it("reads the grade from a class name", () => {
    expect(gradeFromClassName("7.B")).toBe("7. ročník");
    expect(gradeFromClassName("Prima")).toBe("Prima");
  });
});
