import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { sortLessons, criterionRow, type LessonDetail } from "@/hooks/usePlanLessons";
import { groupByMonth, levelMap, templateFrom } from "@/lib/lessons";
import { ExitTicket } from "@/pages/LessonPrint";

const lesson = {
  id: "l1",
  title: "Části rostliny",
  goal: { id: "g1", title: "Žák popíše části rostliny.", pupil_text: "Dnes se učím popsat části rostliny." },
  criteria: [
    {
      id: "c1",
      teacher_text: "Pojmenuje kořen, stonek, list a květ.",
      description: "Pojmenuje kořen, stonek, list a květ.",
      pupil_text: "Pojmenuji části rostliny.",
      scale: { J: "Části ještě pletu.", C: "Pojmenuji dvě části.", T: "Pojmenuji skoro všechny.", U: "" },
      svp_variants: [],
      position: 1,
      sort_order: 0,
    },
  ],
} as unknown as LessonDetail;

describe("lessons in a plan", () => {
  it("sort by school month, then position", () => {
    const sorted = sortLessons([
      { title: "B", month: "říjen", position: 2 },
      { title: "A", month: "září", position: 5 },
      { title: "C", month: "říjen", position: 1 },
      { title: "D", month: null, position: 1 },
    ]);
    expect(sorted.map((l) => l.title)).toEqual(["A", "C", "B", "D"]);
  });

  it("group by month with lessons without one last", () => {
    const groups = groupByMonth([{ month: "říjen" }, { month: null }, { month: "září" }]);
    expect(groups.map((g) => g.month)).toEqual(["září", "říjen", "Bez měsíce"]);
  });

  it("save a criterion with both versions, its scale and legacy level names", () => {
    const row = criterionRow({ teacher: "T", pupil: "P", scale: { J: "j", C: "c", T: "t", U: "u" }, svp_variants: [] }, 1);
    expect(row).toMatchObject({ description: "T", teacher_text: "T", pupil_text: "P", position: 2, sort_order: 1 });
    expect((row.level_descriptors as { level: string }[]).map((l) => l.level)).toEqual([
      "Ještě neosvojeno",
      "Částečně osvojeno",
      "Téměř osvojeno",
      "Úplně osvojeno",
    ]);
  });

  it("keep the teacher's level and the newest self-assessment apart", () => {
    const map = levelMap([
      { student_id: "s", criterion_id: "c", source: "teacher", level: "T", assessed_at: "2026-09-10" },
      { student_id: "s", criterion_id: "c", source: "self_paper", level: "C", assessed_at: "2026-09-12" },
      { student_id: "s", criterion_id: "c", source: "self_qr", level: "U", assessed_at: "2026-09-11" },
    ]);
    expect(map.get("s:c")).toMatchObject({ teacher: "T", self: "C" });
  });
});

describe("exit ticket", () => {
  const template = templateFrom(lesson);

  it("takes the goal and criteria in the pupil's words, general sentences where missing", () => {
    expect(template.goal).toBe("Dnes se učím popsat části rostliny.");
    expect(template.criteria[0].pupil).toBe("Pojmenuji části rostliny.");
    expect(template.criteria[0].scale.U).toBe("Úplně to umím sám/sama.");
  });

  it("prints the pupil's name so a photo can be matched without guessing", () => {
    render(<ExitTicket template={template} pupil={{ id: "s1", first_name: "Adam", last_name: "Bílý" }} heading="Prvouka · 3.A" />);
    expect(screen.getByText("Adam Bílý")).toBeInTheDocument();
    for (const letter of ["J", "Č", "T", "Ú"]) expect(screen.getByText(letter)).toBeInTheDocument();
    expect(screen.getByText("3. Můj komentář")).toBeInTheDocument();
    expect(screen.getByText("4. Komentář učitele")).toBeInTheDocument();
  });

  it("leaves a line for the name on a blank ticket", () => {
    render(<ExitTicket template={template} pupil={null} heading="" />);
    expect(screen.getByText(/Jméno:/)).toBeInTheDocument();
  });
});
