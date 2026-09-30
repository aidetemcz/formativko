import { describe, expect, it } from "vitest";
import { filterEvidence, type EvidenceItem } from "./evidence";

const lesson = { id: "l1", title: "Části rostliny", class_id: "k1", subject_id: "sub1", classes: { name: "3.A" }, subjects: { name: "Prvouka" } };
const adam = { id: "s1", first_name: "Adam", last_name: "Bílý" };
const eva = { id: "s2", first_name: "Eva", last_name: "Malá" };
const item = (key: string, patch: Partial<EvidenceItem>): EvidenceItem => ({
  key,
  id: key,
  kind: "text",
  date: "2026-09-10",
  pupils: [adam],
  lesson: null,
  title: "",
  note: "",
  file: null,
  level: null,
  ...patch,
});

const items = [
  item("a", { lesson, kind: "level", level: { code: "T", criterion: "Ukážu kořen", source: "teacher" }, date: "2026-09-12" }),
  item("b", { pupils: [eva], note: "Eva popsala list." }),
  item("c", { kind: "camera", title: "Nákres", date: "2026-09-20" }),
];
const classOf = new Map([
  ["s1", ["k1"]],
  ["s2", ["k2"]],
]);

describe("filterEvidence", () => {
  it("sorts newest first", () => {
    expect(filterEvidence(items, {}, classOf).map((i) => i.key)).toEqual(["c", "a", "b"]);
  });

  it("puts a proof without a lesson into its pupils' classes", () => {
    expect(filterEvidence(items, { classId: "k1" }, classOf).map((i) => i.key)).toEqual(["c", "a"]);
    expect(filterEvidence(items, { classId: "k2" }, classOf).map((i) => i.key)).toEqual(["b"]);
  });

  it("filters by subject, kind, pupil and text", () => {
    expect(filterEvidence(items, { subjectId: "sub1" }, classOf).map((i) => i.key)).toEqual(["a"]);
    expect(filterEvidence(items, { kind: "camera" }, classOf).map((i) => i.key)).toEqual(["c"]);
    expect(filterEvidence(items, { studentId: "s2" }, classOf).map((i) => i.key)).toEqual(["b"]);
    expect(filterEvidence(items, { search: "kořen" }, classOf).map((i) => i.key)).toEqual(["a"]);
    expect(filterEvidence(items, { search: "malá" }, classOf).map((i) => i.key)).toEqual(["b"]);
  });
});
