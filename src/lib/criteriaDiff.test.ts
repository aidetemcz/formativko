import { describe, expect, it } from "vitest";
import { planCriteriaUpdate } from "./criteriaDiff";

describe("planCriteriaUpdate", () => {
  it("updates criteria that keep their place", () => {
    expect(planCriteriaUpdate(["a", "b"], ["x", "y"])).toEqual({
      updates: [{ id: "a", value: "x" }, { id: "b", value: "y" }],
      inserts: [],
      deleteIds: [],
    });
  });

  it("inserts added criteria", () => {
    expect(planCriteriaUpdate(["a"], ["x", "y"])).toEqual({
      updates: [{ id: "a", value: "x" }],
      inserts: ["y"],
      deleteIds: [],
    });
  });

  it("deletes only criteria dropped from the end", () => {
    expect(planCriteriaUpdate(["a", "b", "c"], ["x"])).toEqual({
      updates: [{ id: "a", value: "x" }],
      inserts: [],
      deleteIds: ["b", "c"],
    });
  });
});
