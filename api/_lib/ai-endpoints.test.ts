/**
 * The methodology endpoints end to end, with a fake model and a fake
 * database: what the model is sent, and what the teacher gets back.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TEACHER = "t1";

/** Rows per table the fake Supabase client returns (filters are not simulated). */
let tables: Record<string, unknown[]> = {};

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: TEACHER } }, error: null }) },
    from: (table: string) => {
      const rows = () => tables[table] ?? [];
      const builder: Record<string, unknown> = {};
      for (const m of ["select", "eq", "in", "not", "order", "limit"]) builder[m] = () => builder;
      builder.single = async () => ({ data: rows()[0] ?? null });
      builder.maybeSingle = async () => ({ data: rows()[0] ?? null });
      builder.then = (resolve: (v: unknown) => void) => resolve({ data: rows() });
      return builder;
    },
  }),
}));

/** Model answers keyed by schema name, and every request the model got. */
const answers: Record<string, unknown> = {};
let sent: { schema: string; system: string; user: string }[] = [];

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.SUPABASE_URL = "https://db.test";
  process.env.SUPABASE_ANON_KEY = "anon";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
  sent = [];
  vi.stubGlobal("fetch", async (_url: string, init: { body: string }) => {
    const body = JSON.parse(init.body);
    const schema = body.response_format.json_schema.name;
    sent.push({ schema, system: body.messages[0].content, user: body.messages[1].content });
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(answers[schema]) } }] }));
  });
});

afterEach(() => vi.unstubAllGlobals());

function fakeRes() {
  const res = {
    statusCode: 0,
    body: "",
    setHeader: () => res,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    send(text: string) {
      res.body = text;
      return res;
    },
    json(value: unknown) {
      res.body = JSON.stringify(value);
      return res;
    },
    end: () => res,
  };
  return res;
}

async function call(endpoint: string, body: unknown) {
  const { default: handler } = await import(`../${endpoint}.ts`);
  const res = fakeRes();
  await handler(
    { method: "POST", url: `/api/${endpoint}`, headers: { host: "x", authorization: "Bearer token" }, body } as never,
    res as never,
  );
  return { status: res.statusCode, body: JSON.parse(res.body) };
}

const REVIEW = { comments: ["Věta o snaze popisuje domněnku."], went_well: [], offers: ["1. Proč popisovat projevy"] };

describe("formulate-goal", () => {
  it("returns up to three goal variants for teacher and pupil", async () => {
    answers.vyukove_cile = {
      goals: [1, 2, 3, 4].map((i) => ({ teacher: `Cíl ${i}`, pupil: `Dnes se učím ${i}`, competences: [] })),
    };
    const { status, body } = await call("formulate-goal", {
      context: "Měkké hlásky",
      subject: "Český jazyk",
      className: "2.A",
    });
    expect(status).toBe(200);
    expect(body.goals).toHaveLength(3);
    expect(sent[0].user).toContain("Ročník: 2. ročník");
  });

  it("asks for a topic before calling the model", async () => {
    const { status } = await call("formulate-goal", { subject: "Matematika" });
    expect(status).toBe(400);
    expect(sent).toHaveLength(0);
  });
});

describe("generate-criteria", () => {
  const criterion = {
    teacher: "Žák rozliší Ď, Ť, Ň.",
    pupil: "Poznám Ď, Ť, Ň.",
    scale: { J: "j", C: "č", T: "t", U: "ú" },
    svp_variants: [{ need: "x", text: "y" }],
  };

  it("returns three criteria with their scales and drops unasked SVP variants", async () => {
    answers.kriteria_hodnoceni = { criteria: [criterion, criterion, criterion, criterion] };
    const { body } = await call("generate-criteria", { goal: "Rozliší měkké hlásky." });
    expect(body.criteria).toHaveLength(3);
    expect(body.criteria[0].scale).toEqual({ J: "j", C: "č", T: "t", U: "ú" });
    expect(body.criteria[0].svp_variants).toEqual([]);
  });

  it("keeps SVP variants when the teacher ticked a need", async () => {
    answers.kriteria_hodnoceni = { criteria: [criterion] };
    const { body } = await call("generate-criteria", { goal: "Rozliší měkké hlásky.", svpNeeds: ["dyslexie"] });
    expect(body.criteria[0].svp_variants).toHaveLength(1);
    expect(sent[0].system).toContain("Jedinci se speciálními");
  });
});

describe("generate-evaluation", () => {
  beforeEach(() => {
    tables = {
      students: [
        { id: "s1", first_name: "Adam", last_name: "Novák", nickname: "Modrá vydra", svp: true, svp_details: "Adam má dyslexii", notes: "Adam pracuje s Evou Černou.", interests: "", communication_preferences: "", learning_styles: "" },
        { first_name: "Eva", last_name: "Černá", nickname: "Šedá sova" },
      ],
      proof_students: [
        { proof_id: "p1", proofs_of_learning: { id: "p1", title: "Nákres Adamovy rostliny", type: "camera", date: "2026-09-18", note: "Adam popsal kořen.", lesson_id: null } },
      ],
      evaluations: [],
      current_criterion_levels: [{ id: "a1", criterion_id: "c1", source: "teacher", level: "T", assessed_at: "2026-09-20T10:00:00Z" }],
      evaluation_criteria: [{ id: "c1", teacher_text: "Popíše části rostliny.", description: "", goal_id: "g1", educational_goals: { title: "Rostliny" } }],
      lessons: [],
    };
    answers.slovni_hodnoceni = {
      sentences: [
        { text: "Modrá vydra, části rostliny už popíšeš téměř samostatně.", sources: ["U1", "D1"] },
        { text: "Zkus příště pojmenovat i květ.", sources: [] },
      ],
      recommendations_outside: ["Procvičovat pojmenování květu."],
    };
    answers.radce = REVIEW;
  });

  it("never sends a real name to the model", async () => {
    const { status } = await call("generate-evaluation", { studentId: "s1", evalType: "prubezna", className: "3.A" });
    expect(status).toBe(200);
    // Pupil data travels in the user message; the system prompt is the fixed
    // methodology (which quotes its own authors, "Eva Nečasová" among them).
    const everything = sent.map((s) => s.user).join("\n");
    expect(everything).not.toMatch(/Adam|Novák|Eva|Černou/);
    expect(everything).toContain("Modrá vydra");
    expect(everything).toContain("Šedá sova");
    // SVP details only when ticked.
    expect(everything).not.toContain("dyslexii");
  });

  it("returns the text with the first name, its sources and the Rádce's comments", async () => {
    const { body } = await call("generate-evaluation", { studentId: "s1", evalType: "prubezna" });
    expect(body.text).toBe("Adam, části rostliny už popíšeš téměř samostatně. Zkus příště pojmenovat i květ.");
    expect(body.sentences[0]).toEqual({
      text: "Adam, části rostliny už popíšeš téměř samostatně.",
      proofIds: ["p1"],
      assessmentIds: ["a1"],
    });
    expect(body.review.comments).toEqual(REVIEW.comments);
    // Running feedback keeps its next steps in the text.
    expect(body.recommendationsOutside).toEqual([]);
    // The Rádce read the draft before the name came back.
    expect(sent.find((s) => s.schema === "radce")!.user).toContain("Modrá vydra, části rostliny");
  });

  it("moves next steps out of a school report", async () => {
    const { body } = await call("generate-evaluation", { studentId: "s1", evalType: "vysvedceni" });
    expect(body.mode).toBe("certificate");
    expect(body.recommendationsOutside).toEqual(["Procvičovat pojmenování květu."]);
    expect(sent[0].system).toContain("Režim: text na vysvědčení");
  });

  it("includes SVP details when the teacher ticked them", async () => {
    await call("generate-evaluation", { studentId: "s1", includeSvp: true });
    expect(sent[0].user).toContain("Speciální vzdělávací potřeby: Modrá vydra má dyslexii");
  });

  it("answers without the model when there is nothing to write from", async () => {
    tables.proof_students = [];
    tables.current_criterion_levels = [];
    const { body } = await call("generate-evaluation", { studentId: "s1" });
    expect(body.noProofs).toBe(true);
    expect(sent).toHaveLength(0);
  });
});

describe("check-evaluation", () => {
  it("pseudonymises the teacher's text and returns at most four comments", async () => {
    tables = { students: [{ id: "s1", first_name: "Adam", last_name: "Novák", nickname: "Modrá vydra" }] };
    answers.radce = { comments: ["a", "b", "c", "d", "e"], went_well: [], offers: [] };
    const { body } = await call("check-evaluation", {
      text: "Adame, umíš násobilku a mám radost.",
      studentId: "s1",
      mode: "certificate",
    });
    expect(sent[0].user).not.toContain("Adam");
    expect(body.comments).toHaveLength(4);
    expect(body.style_issues.map((i: { rule: string }) => i.rule)).toEqual(["umis", "emoce"]);
  });
});

describe("plan-rows", () => {
  it("reads pasted text into lessons and cleans up what the model returns", async () => {
    answers.radky_planu = {
      rows: [
        { month: "září", title: "Části rostliny", description: "Pozorujeme.", hours: 1, rvp_outcome: "" },
        { month: "Září!", title: "Semínko", description: "", hours: 0, rvp_outcome: "" },
        { month: "říjen", title: "  ", description: "", hours: 1, rvp_outcome: "" },
      ],
    };
    const { status, body } = await call("plan-rows", { text: "září: části rostliny, semínko", hoursPerLesson: 1 });
    expect(status).toBe(200);
    expect(body.rows).toEqual([
      { month: "září", title: "Části rostliny", description: "Pozorujeme.", hours: 1, rvp_outcome: "" },
      { month: "", title: "Semínko", description: "", hours: 1, rvp_outcome: "" },
    ]);
    expect(JSON.stringify(sent[0].user)).toContain("září: části rostliny");
  });

  it("refuses a file that is not in the teacher's own storage", async () => {
    const { status, body } = await call("plan-rows", { fileUrl: "https://evil.example/plan.pdf" });
    expect(status).toBe(400);
    expect(body.error).toMatch(/Neplatný odkaz/);
    expect(sent).toHaveLength(0);
  });

  it("asks for a plan when there is none", async () => {
    const { status } = await call("plan-rows", {});
    expect(status).toBe(400);
  });
});
