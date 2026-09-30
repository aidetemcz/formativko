// @vitest-environment node
/**
 * TinyBuddy on the server: the model only ever sees nicknames, reading tools
 * answer from the teacher's data, proposals save nothing, and the answer
 * streams back as events.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TEACHER = "t1";
let tables: Record<string, unknown[]> = {};
let inserted: Record<string, unknown[]> = {};
let updated: Record<string, unknown[]> = {};
let rpcCalls: { fn: string; args: Record<string, unknown> }[] = [];

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: TEACHER } }, error: null }) },
    rpc: async (fn: string, args: Record<string, unknown>) => {
      rpcCalls.push({ fn, args });
      return { data: tables[`rpc:${fn}`] ?? [], error: null };
    },
    from: (table: string) => {
      const rows = () => tables[table] ?? [];
      const builder: Record<string, unknown> = {};
      for (const m of ["select", "eq", "in", "not", "order", "limit", "is"]) builder[m] = () => builder;
      builder.single = async () => ({ data: rows()[0] ?? null, error: null });
      builder.maybeSingle = async () => ({ data: rows()[0] ?? null, error: null });
      builder.then = (resolve: (v: unknown) => void) => resolve({ data: rows(), error: null });
      builder.insert = (value: unknown) => {
        (inserted[table] ??= []).push(...(Array.isArray(value) ? value : [value]));
        builder.single = async () => ({ data: { id: `${table}-new` }, error: null });
        return builder;
      };
      builder.update = (value: unknown) => {
        (updated[table] ??= []).push(value);
        return builder;
      };
      return builder;
    },
  }),
}));

const PEOPLE = [
  { id: "s1", first_name: "Adam", last_name: "Bílý", nickname: "Modrá vydra" },
  { id: "s2", first_name: "Eva", last_name: "Malá", nickname: "Šedá sova" },
];

/** Each model round: text deltas and/or tool calls, streamed like OpenAI does. */
let rounds: { text?: string; tools?: { name: string; args: unknown }[] }[] = [];
let requests: { messages: { role: string; content: unknown }[] }[] = [];

function sse(round: (typeof rounds)[number]): string {
  const chunks: unknown[] = [];
  if (round.text) for (const part of round.text.match(/.{1,7}/gs) ?? []) chunks.push({ choices: [{ delta: { content: part } }] });
  (round.tools ?? []).forEach((t, index) => {
    const args = JSON.stringify(t.args);
    chunks.push({ choices: [{ delta: { tool_calls: [{ index, id: `call${index}`, function: { name: t.name, arguments: args.slice(0, 5) } }] } }] });
    chunks.push({ choices: [{ delta: { tool_calls: [{ index, function: { arguments: args.slice(5) } }] } }] });
  });
  return chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join("") + "data: [DONE]\n\n";
}

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.SUPABASE_URL = "https://db.test";
  process.env.SUPABASE_ANON_KEY = "anon";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
  tables = { students: PEOPLE };
  inserted = {};
  updated = {};
  rpcCalls = [];
  requests = [];
  vi.stubGlobal("fetch", async (_url: string, init: { body: string }) => {
    const body = JSON.parse(init.body);
    requests.push(body);
    if (body.stream) return new Response(sse(rounds.shift() ?? { text: "" }));
    // A structured call from a proposal (goal / criteria prompts).
    const schema = body.response_format.json_schema.name;
    const answer =
      schema === "vyukove_cile"
        ? { goals: [{ teacher: "Žák popíše části rostliny.", pupil: "Dnes se učím popsat rostlinu.", competences: [] }] }
        : { criteria: [{ teacher: "Pojmenuje kořen.", pupil: "Ukážu kořen.", scale: { J: "j", C: "č", T: "t", U: "ú" }, svp_variants: [] }] };
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(answer) } }] }));
  });
});

afterEach(() => vi.unstubAllGlobals());

function fakeRes() {
  const res = {
    statusCode: 0,
    body: "",
    headers: {} as Record<string, string>,
    setHeader: (k: string, v: string) => {
      res.headers[k.toLowerCase()] = v;
      return res;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    write(chunk: Buffer) {
      res.body += chunk.toString();
      return true;
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

async function chat(body: unknown) {
  const { default: handler } = await import("../buddy-chat.js");
  const res = fakeRes();
  await handler({ method: "POST", url: "/api/buddy-chat", headers: { host: "x", authorization: "Bearer t" }, body } as never, res as never);
  const events = res.body
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
  return { res, events };
}

describe("buddy-chat", () => {
  it("streams the answer, runs tools and never shows the model a name", async () => {
    tables["rpc:search_everything"] = [
      { kind: "student", id: "s1", title: "Adam Bílý", subtitle: "Modrá vydra", link_id: null },
      { kind: "lesson", id: "l1", title: "Zlomky 2", subtitle: "7.B · říjen", link_id: null },
    ];
    rounds = [{ tools: [{ name: "search", args: { query: "zlomky" } }] }, { text: "Našel jsem lekci Zlomky 2 a Modrá vydra ji má." }];

    const { res, events } = await chat({ message: "Najdi zlomky pro Adama Bílého", context: null });

    expect(res.headers["content-type"]).toContain("application/x-ndjson");
    expect(events[0]).toEqual({ type: "conversation", id: "buddy_conversations-new" });
    expect(events.find((e) => e.type === "results").items).toHaveLength(2);
    expect(events.filter((e) => e.type === "text").map((e) => e.delta).join("")).toBe("Našel jsem lekci Zlomky 2 a Modrá vydra ji má.");
    expect(events[events.length - 1].type).toBe("done");
    expect(rpcCalls[0]).toEqual({ fn: "search_everything", args: { q: "zlomky", p_teacher: TEACHER, per_kind: 5 } });

    const seen = JSON.stringify(requests.map((r) => r.messages));
    expect(seen).not.toMatch(/Adam|Bílý|Bílého/);
    expect(seen).toContain("Modrá vydra");
    // The conversation is stored pseudonymised, with the hits for the links.
    expect(JSON.stringify((inserted.buddy_messages as { content: string }[]).map((m) => m.content))).not.toMatch(/Adam/);
    const answer = inserted.buddy_messages.find((m) => (m as { role: string }).role === "assistant") as { data: { results: unknown[] } };
    expect(answer.data.results).toHaveLength(2);
  });

  it("proposes a lesson change through the methodology prompts and saves nothing", async () => {
    tables.lessons = [
      {
        id: "l1",
        title: "Rostliny",
        description: "",
        month: "září",
        hours: 1,
        planned_activities: "",
        rvp_outcome: "",
        courses: { name: "Prvouka 2.A", classes: { name: "2.A" }, subjects: { name: "Prvouka" } },
        lesson_goals: [
          {
            educational_goals: {
              id: "g1",
              title: "Starý cíl",
              pupil_text: "",
              evaluation_criteria: [{ id: "c1", teacher_text: "Staré kritérium", pupil_text: "", scale: null, position: 1, sort_order: 0 }],
            },
          },
        ],
      },
    ];
    rounds = [
      {
        tools: [
          {
            name: "propose_lesson_update",
            args: {
              lesson_id: "l1",
              summary: "Jednodušší kritéria",
              title: null,
              description: null,
              month: "říjen",
              hours: null,
              planned_activities: null,
              goal_instruction: null,
              criteria_instruction: "jednodušeji pro žáky",
            },
          },
        ],
      },
      { text: "Návrh je připravený." },
    ];

    tables.buddy_conversations = [{ id: "conv1", context: {} }];
    const { events } = await chat({ message: "Přepiš kritéria jednodušeji", conversationId: "conv1" });

    const proposal = events.find((e) => e.type === "proposal").proposal;
    expect(proposal.type).toBe("lesson_update");
    expect(proposal.before.month).toBe("září");
    expect(proposal.after.month).toBe("říjen");
    // Criteria come from prompts 02–03 and keep the old criterion's id.
    expect(proposal.after.criteria).toEqual([{ id: "c1", teacher: "Pojmenuje kořen.", pupil: "Ukážu kořen.", scale: { J: "j", C: "č", T: "t", U: "ú" } }]);
    expect(requests.some((r) => (r as unknown as { response_format?: { json_schema: { name: string } } }).response_format?.json_schema.name === "kriteria_hodnoceni")).toBe(true);
    // Nothing but the conversation was written.
    expect(Object.keys(inserted)).toEqual(["buddy_messages"]);
    expect(Object.keys(updated)).toEqual(["buddy_conversations"]);
  });

  it("asks for a message", async () => {
    const { res } = await chat({ message: "  " });
    expect(res.statusCode).toBe(400);
  });
});

describe("methodology", () => {
  it("finds passages with their source", async () => {
    const { methodologyPassages } = await import("./buddy.js");
    const found = methodologyPassages("jak formulovat kritéria hodnocení");
    expect(found.length).toBeGreaterThan(0);
    expect(found[0].source).toBeTruthy();
    expect(methodologyPassages("")).toEqual([]);
  });
});
