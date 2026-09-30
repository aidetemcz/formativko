import { describe, expect, it } from "vitest";
import { readinessFor, PARTIAL_MIN_SHARE, taughtInPeriod } from "./readiness";
import { currentPeriod, monthsInPeriod, schoolPeriods } from "@/constants/schoolYear";

describe("readiness semafor", () => {
  const taught = ["a", "b", "c", "d"];

  it("is ready when every taught criterion has the teacher's level", () => {
    expect(readinessFor(taught, new Set(taught)).status).toBe("ready");
  });

  it("is partial from half of the criteria on, missing below", () => {
    expect(PARTIAL_MIN_SHARE).toBe(0.5);
    expect(readinessFor(taught, new Set(["a", "b"]))).toMatchObject({ status: "partial", covered: 2, missingCriterionIds: ["c", "d"] });
    expect(readinessFor(taught, new Set(["a"])).status).toBe("missing");
    expect(readinessFor(taught, new Set()).status).toBe("missing");
  });

  it("says nothing was taught rather than pretending the pupil is ready", () => {
    expect(readinessFor([], new Set(["a"])).status).toBe("nothing_taught");
  });
});

describe("school periods", () => {
  it("splits the school year into terms", () => {
    const [first, second, year] = schoolPeriods(new Date(2026, 9, 1));
    expect(first).toMatchObject({ from: "2026-09-01", to: "2027-01-31", label: "1. pololetí 2026/27" });
    expect(second).toMatchObject({ from: "2027-02-01", to: "2027-06-30" });
    expect(year.to).toBe("2027-06-30");
  });

  it("knows which term today is in", () => {
    expect(currentPeriod(new Date(2027, 2, 10)).id).toBe("2");
    expect(currentPeriod(new Date(2026, 10, 10)).id).toBe("1");
  });

  it("lists the months of a term", () => {
    expect(monthsInPeriod({ from: "2026-09-01", to: "2027-01-31" })).toEqual(["září", "říjen", "listopad", "prosinec", "leden"]);
    expect(monthsInPeriod({ from: "2027-02-01", to: "2027-06-30" })).toEqual(["únor", "březen", "duben", "květen", "červen"]);
  });
});

describe("lessons taught in a period", () => {
  const goal = (...ids: string[]) => [{ educational_goals: { evaluation_criteria: ids.map((id) => ({ id })) } }];
  const term = { from: "2026-09-01", to: "2027-01-31" };

  it("counts only lessons marked as taught, by date or else by month", () => {
    const { lessons, criterionIds } = taughtInPeriod(
      [
        { month: "říjen", date: null, status: "past", lesson_goals: goal("a", "b") },
        { month: "říjen", date: null, status: "prepared", lesson_goals: goal("c") },
        { month: "březen", date: null, status: "past", lesson_goals: goal("d") },
        { month: "březen", date: "2026-11-02", status: "past", lesson_goals: goal("e", "a") },
        { month: null, date: null, status: "past", lesson_goals: goal("f") },
      ],
      term,
    );
    expect(lessons).toHaveLength(2);
    expect(criterionIds).toEqual(["a", "b", "e"]);
  });
});
