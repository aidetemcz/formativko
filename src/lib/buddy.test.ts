import { describe, expect, it } from "vitest";
import { contextFromPage, hrefForHit, snapshotChanges, type LessonSnapshot } from "./buddy";

const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

const lesson: LessonSnapshot = {
  title: "Zlomky",
  description: "",
  month: "říjen",
  hours: 1,
  planned_activities: "",
  goal: { teacher: "Cíl", pupil: "Dnes se učím" },
  criteria: [{ id: "c1", teacher: "K1", pupil: "Ž1", scale: { J: "j", C: "c", T: "t", U: "u" } }],
};

describe("contextFromPage", () => {
  it("names the page the teacher came from", () => {
    expect(contextFromPage(`/lekce/${ID}`, "Zlomky 2 | Formativko")).toEqual({ kind: "lesson", id: ID, label: "Zlomky 2" });
    expect(contextFromPage(`/zaci/${ID}`, "Adam Bílý | Formativko")?.kind).toBe("student");
    expect(contextFromPage(`/lekce/${ID}/zaznam`, "Záznam | Formativko")?.kind).toBe("lesson");
    expect(contextFromPage("/dukazy", "Důkazy | Formativko")).toBeNull();
  });
});

describe("hrefForHit", () => {
  it("opens the right page", () => {
    expect(hrefForHit({ kind: "plan", id: "p", title: "", subtitle: null, link_id: null })).toBe("/plany/p");
    expect(hrefForHit({ kind: "evaluation", id: "e", title: "", subtitle: null, link_id: "g" })).toBe("/hodnoceni/g");
    expect(hrefForHit({ kind: "proof", id: "d", title: "", subtitle: null, link_id: "s" })).toBe("/student-profiles/s/proof/d");
  });
});

describe("snapshotChanges", () => {
  it("writes only what changed", () => {
    expect(snapshotChanges(lesson, { ...lesson, month: "listopad" })).toEqual({ info: { month: "listopad" }, goal: undefined, criteria: undefined });
    const criteria = [{ ...lesson.criteria[0], pupil: "Nové" }];
    expect(snapshotChanges(lesson, { ...lesson, criteria }).criteria).toEqual(criteria);
    expect(snapshotChanges(lesson, { ...lesson, goal: { teacher: "Nový", pupil: "Dnes" } }).goal).toEqual({ teacher: "Nový", pupil: "Dnes" });
  });
});
