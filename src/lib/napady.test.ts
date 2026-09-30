import { describe, expect, it } from "vitest";
import { buildNapadyQuestions, type NapadyLesson } from "./napady";

const PERIOD = { from: "2026-09-01", to: "2027-01-31" };
const crit = (id: string, position: number) => ({
  id,
  teacher_text: `Kritérium ${id}`,
  pupil_text: null,
  description: "",
  scale: null,
  position,
  sort_order: position - 1,
});
const lesson = (id: string, status: string, date: string | null, month: string | null = null): NapadyLesson => ({
  id,
  title: `Lekce ${id}`,
  status,
  date,
  month,
  class_id: "k1",
  classes: { name: "3.A" },
  subjects: { name: "Prvouka" },
  lesson_goals: [{ educational_goals: { title: "Cíl", evaluation_criteria: [crit(`${id}c2`, 2), crit(`${id}c1`, 1)] } }],
});
const pupils = new Map([
  [
    "k1",
    [
      { id: "s2", first_name: "Eva", last_name: "Malá" },
      { id: "s1", first_name: "Adam", last_name: "Bílý" },
    ],
  ],
]);

describe("buildNapadyQuestions", () => {
  it("asks about taught lessons only, pupils by surname, criteria in order", () => {
    const qs = buildNapadyQuestions(
      [lesson("a", "past", "2026-09-10"), lesson("b", "prepared", "2026-09-12"), lesson("c", "past", null, "červen")],
      pupils,
      [],
      [],
      PERIOD,
    );
    expect(qs.map((q) => q.key)).toEqual(["s1|ac1", "s1|ac2", "s2|ac1", "s2|ac2"]);
    expect(qs[0].criterion.text).toBe("Kritérium ac1");
  });

  it("skips what the teacher already assessed and shows the pupil's own view", () => {
    const qs = buildNapadyQuestions(
      [lesson("a", "past", "2026-09-10")],
      pupils,
      [
        { student_id: "s1", criterion_id: "ac1", source: "teacher", level: "T" },
        { student_id: "s1", criterion_id: "ac2", source: "self_qr", level: "U" },
      ],
      [{ id: "p1", title: "Nákres", type: "camera", date: "2026-09-10", lesson_id: "a", studentIds: ["s1"] }],
      PERIOD,
    );
    expect(qs.map((q) => q.key)).toEqual(["s1|ac2", "s2|ac1", "s2|ac2"]);
    expect(qs[0].selfLevel).toBe("U");
    expect(qs[0].lastProof?.title).toBe("Nákres");
    expect(qs[1].lastProof).toBeNull();
  });
});
