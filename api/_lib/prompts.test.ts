import { describe, expect, it } from "vitest";
import {
  CRITERIA_SCHEMA,
  EVALUATION_SCHEMA,
  GOAL_SCHEMA,
  PLAN_ROWS_SCHEMA,
  planRowsPrompt,
  REVIEW_SCHEMA,
  criteriaPrompt,
  evaluationPrompt,
  goalPrompt,
  gradeFromClassName,
  reviewPrompt,
  type EvaluationInput,
} from "./prompts.js";
import { STYLE_GUIDE } from "./style-guide.js";
import { SAMPLE_CRITERIA_INPUT, SAMPLE_GOAL_INPUT, SAMPLE_GOOD_EVALUATION } from "./methodology-samples.js";

const EVALUATION_INPUT: EvaluationInput = {
  mode: "feedback",
  nickname: "Modrá vydra",
  grade: "3. ročník",
  subject: "Prvouka",
  period: "2026-09-01 – 2026-09-30",
  goal: "Žák popíše části rostliny.",
  profile: "",
  previous: "",
  levels: [{ ref: "U1", line: "Popíšu části rostliny → T (téměř osvojeno), hodnocení učitele, 2026-09-20" }],
  proofs: [{ ref: "D1", line: "Nákres rostliny (camera, 2026-09-18)" }],
  teacherInstructions: "",
  tone: "přátelský",
  length: "4–6 vět",
};

const ALL_PROMPTS = {
  goal: goalPrompt(SAMPLE_GOAL_INPUT),
  criteria: criteriaPrompt(SAMPLE_CRITERIA_INPUT),
  evaluation: evaluationPrompt(EVALUATION_INPUT),
  review: reviewPrompt({ text: SAMPLE_GOOD_EVALUATION, grade: "2. ročník", mode: "certificate" }),
};

describe("every methodology prompt", () => {
  it.each(Object.entries(ALL_PROMPTS))("%s carries the shared language rules", (_, p) => {
    expect(p.system).toContain(STYLE_GUIDE);
  });

  it.each(Object.entries(ALL_PROMPTS))("%s no longer asks the teacher first", (_, p) => {
    // The chat prompts opened by asking questions; in the app they are fields.
    expect(p.system).not.toMatch(/vyzveš|vyzvi|doptej/i);
  });
});

describe("01 · goal", () => {
  it("passes the form fields and the three knowledge files", () => {
    const { system, user } = ALL_PROMPTS.goal;
    expect(user).toContain("Výstup z RVP ZV (revidované): Žák rozlišuje");
    expect(user).toContain("Ročník: 2. ročník");
    for (const k of ["Formulace vzdělávacích cílů", "Klíčové kompetence", "Průřezová témata"]) {
      expect(system).toContain(`Podklad: ${k}`);
    }
    expect(system).toContain("Dnes se učím");
  });
});

describe("02 + 03 · criteria with JČTÚ", () => {
  it("attaches the SVP file only when needs are ticked", () => {
    expect(ALL_PROMPTS.criteria.system).not.toContain("Jedinci se speciálními");
    const withSvp = criteriaPrompt({ ...SAMPLE_CRITERIA_INPUT, svpNeeds: ["dyslexie"] });
    expect(withSvp.system).toContain("Podklad: Jedinci se speciálními vzdělávacími potřebami");
    expect(withSvp.user).toContain("Speciální vzdělávací potřeby: dyslexie");
  });

  it("carries the scale, its examples and chapter 6.3", () => {
    const { system } = ALL_PROMPTS.criteria;
    expect(system).toContain("J — Ještě neosvojeno");
    expect(system).toContain("Ú — Úplně osvojeno");
    expect(system).toContain("Poznám, kdy ve slově slyším měkkou hlásku");
    expect(system).toContain("## 6.3 Stupnice hodnocení");
  });
});

describe("04 · evaluation", () => {
  it("names the pupil only by nickname and cites sources", () => {
    const { user } = ALL_PROMPTS.evaluation;
    expect(user).toContain("přezdívkou Modrá vydra");
    expect(user).toContain("[U1] Popíšu části rostliny");
    expect(user).toContain("[D1] Nákres rostliny");
  });

  it("keeps next steps out of a school report and in running feedback", () => {
    expect(ALL_PROMPTS.evaluation.system).toContain("Režim: průběžná zpětná vazba");
    const report = evaluationPrompt({ ...EVALUATION_INPUT, mode: "certificate" });
    expect(report.system).toContain("Režim: text na vysvědčení");
    expect(report.system).toContain("recommendations_outside");
  });

  it("lets the methodology win over the tone setting", () => {
    expect(ALL_PROMPTS.evaluation.system).toContain("zásady mají přednost");
  });
});

describe("05 · Rádce", () => {
  it("flags future-oriented text only on a school report", () => {
    expect(ALL_PROMPTS.review.system).toContain("doporuč odstranění");
    const feedback = reviewPrompt({ text: "x", grade: "", mode: "feedback" });
    expect(feedback.system).toContain("Doporučení dalších kroků sem patří");
    expect(feedback.user).toContain("Ročník hodnoceného žáka: neuveden");
  });

  it("never writes the evaluation itself", () => {
    expect(ALL_PROMPTS.review.system).toContain("Nevytvářej nové slovní hodnocení");
  });
});

describe("output schemas", () => {
  // OpenAI strict mode: every object lists all its properties as required and
  // allows nothing else.
  function assertStrict(node: unknown, path = "$"): void {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (n.type === "object") {
      expect(n.additionalProperties, path).toBe(false);
      expect([...(n.required as string[])].sort(), path).toEqual(Object.keys(n.properties as object).sort());
    }
    for (const [k, v] of Object.entries(n)) assertStrict(v, `${path}.${k}`);
  }

  it.each([GOAL_SCHEMA, CRITERIA_SCHEMA, EVALUATION_SCHEMA, REVIEW_SCHEMA, PLAN_ROWS_SCHEMA])("$name is strict", (s) => {
    assertStrict(s.schema);
  });
});

describe("thematic plan → lessons", () => {
  it("splits by the chosen lesson length and keeps to the plan", () => {
    const p = planRowsPrompt({ subject: "Prvouka", grade: "3. ročník", hoursPerLesson: 2 });
    expect(p).toContain("o 2 vyučovacích hodinách");
    expect(p).toContain("nic si nevymýšlej");
    expect(p).toContain(STYLE_GUIDE);
  });
});

describe("gradeFromClassName", () => {
  it.each([
    ["7.B", "7. ročník"],
    ["3.A", "3. ročník"],
    ["Sexta", "Sexta"],
    ["", ""],
  ])("%s → %s", (input, out) => expect(gradeFromClassName(input)).toBe(out));
});
