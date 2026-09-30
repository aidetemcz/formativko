import type { SupabaseClient } from "@supabase/supabase-js";
import { PSEUDONYM_PROMPT_RULE, pseudonymize, type PseudonymPerson } from "../../src/lib/pseudonym.js";
import { SCHOOL_MONTHS, monthsInPeriod, schoolPeriods } from "../../src/constants/schoolYear.js";
import { KNOWLEDGE, type KnowledgeFile } from "./knowledge.generated.js";
import { structuredCompletion, type ToolDefinition } from "./openai.js";
import {
  CRITERIA_SCHEMA,
  GOAL_SCHEMA,
  criteriaPrompt,
  goalPrompt,
  gradeFromClassName,
  type CriteriaOutput,
  type GoalOutput,
} from "./prompts.js";
import { STYLE_GUIDE } from "./style-guide.js";

/**
 * TinyBuddy (zadání kap. 5): the system prompt, the tools the model may call
 * and what each tool does. Reading tools answer from the teacher's own data;
 * the propose_* tools save nothing — they return a proposal the app shows as
 * a preview, and the teacher's click saves it through the usual hooks, so RLS
 * keeps guarding every write.
 *
 * Everything a tool returns to the model goes through `pseudonymize` first.
 */

export interface BuddyContext {
  kind: "lesson" | "plan" | "class" | "student";
  id: string;
  label: string;
}

export interface SearchHit {
  kind: string;
  id: string;
  title: string;
  subtitle: string | null;
  link_id: string | null;
}

export interface LessonSnapshot {
  title: string;
  description: string;
  month: string | null;
  hours: number | null;
  planned_activities: string;
  goal: { teacher: string; pupil: string } | null;
  criteria: { id: string | null; teacher: string; pupil: string; scale: Record<string, string> | null }[];
}

export type Proposal =
  | { id: string; type: "lesson_update"; status: "pending"; summary: string; lesson_id: string; lesson_title: string; before: LessonSnapshot; after: LessonSnapshot }
  | { id: string; type: "lesson_create"; status: "pending"; summary: string; plan_id: string; plan_name: string; after: LessonSnapshot }
  | {
      id: string;
      type: "plan_update";
      status: "pending";
      summary: string;
      plan_id: string;
      plan_name: string;
      items: { lesson_id: string; before: { title: string; month: string | null }; after: { title: string; month: string | null } }[];
    };

export interface ToolContext {
  db: SupabaseClient;
  teacherId: string;
  people: PseudonymPerson[];
  today: Date;
  onResults: (hits: SearchHit[]) => void;
  onProposal: (proposal: Proposal) => void;
}

// ─── System prompt ───────────────────────────────────────────────────────────

const CONTEXT_LABELS: Record<BuddyContext["kind"], string> = {
  lesson: "lekce",
  plan: "tematický plán",
  class: "třída",
  student: "žák",
};

export function buddySystemPrompt(context: BuddyContext | null, today: Date): string {
  const date = today.toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return `Jsi TinyBuddy, asistent učitele v aplikaci Formativko pro formativní hodnocení na základní škole. Mluvíš česky, věcně a vlídně, stručně. Učiteli vykáš.

Dnes je ${date}.

Co umíš:
- Najít cokoli, co učitel v aplikaci vytvořil: lekce (název, cíl, kritéria, popis, průběh), tematické plány, žáky, třídy, důkazy o učení a hodnocení. Používej nástroj search, klidně víckrát s různými slovy, když učitel hledá podle smyslu. Zkoušej i kratší tvary slov (např. „zlom“ pro zlomky).
- Odpovídat na otázky nad daty (list_plans, list_classes, get_plan, get_lesson, get_class_levels). Odpovídej jen z toho, co ti nástroje vrátí; nic si nedomýšlej.
- Navrhnout úpravu lekce nebo plánu, nebo novou lekci (propose_lesson_update, propose_lesson_create, propose_plan_update). Návrh se učiteli ukáže jako náhled před a po a uloží se, až když na něj učitel klikne. Nikdy netvrď, že jsi něco změnil nebo uložil. Nové a upravené cíle a kritéria vždy nech vytvořit nástroji (goal_instruction, criteria_instruction), nepiš je sám.
- Nic nemažeš. Když učitel chce něco smazat, řekni mu, kde to v aplikaci udělá sám.
- Pomoct vymyslet průběh hodiny. Průběh piš jako krátké kroky s časem. Učitel si ho pak může uložit do lekce.
- Odpovídat na metodické otázky podle metodiky (get_methodology) a vždy uvést zdroj (název souboru nebo odkaz ze zdroje).

${PSEUDONYM_PROMPT_RULE}

Úrovně žáků se zapisují na škále J (ještě neosvojeno), Č (částečně), T (téměř), Ú (úplně osvojeno). Je to popis pokroku, ne známka.
${context ? `\nUčitel otevřel Buddyho ze stránky: ${CONTEXT_LABELS[context.kind]} „${context.label}“ (id ${context.id}). Když mluví o „této“ ${CONTEXT_LABELS[context.kind]}, myslí tuto.\n` : ""}
${STYLE_GUIDE}`;
}

// ─── Tool definitions ────────────────────────────────────────────────────────

const str = { type: "string" };
const nullableStr = { type: ["string", "null"] };

function tool(name: string, description: string, properties: Record<string, unknown>): ToolDefinition {
  return {
    type: "function",
    function: {
      name,
      description,
      strict: true,
      parameters: { type: "object", properties, required: Object.keys(properties), additionalProperties: false },
    },
  };
}

export const BUDDY_TOOLS: ToolDefinition[] = [
  tool("search", "Hledá v lekcích, plánech, žácích, třídách, důkazech a hodnoceních učitele. Vrací nejvýš pár výsledků z každého druhu.", {
    query: { ...str, description: "Hledané slovo nebo krátká fráze." },
  }),
  tool("list_plans", "Seznam tematických plánů učitele s předmětem a třídou.", {}),
  tool("list_classes", "Seznam tříd učitele.", {}),
  tool("get_plan", "Tematický plán a všechny jeho lekce (měsíc, stav, zda mají cíl a kritéria).", { plan_id: str }),
  tool("get_lesson", "Detail lekce: popis, průběh hodiny, cíl pro učitele a žáka, kritéria se škálou JČTÚ.", { lesson_id: str }),
  tool(
    "get_class_levels",
    "Úrovně žáků třídy u kritérií probraných lekcí v období: kdo má úroveň od učitele, sebehodnocení a co chybí. Bez dat od/do platí aktuální pololetí.",
    { class_id: str, from: { ...nullableStr, description: "Datum od, RRRR-MM-DD." }, to: { ...nullableStr, description: "Datum do, RRRR-MM-DD." } },
  ),
  tool("get_methodology", "Najde v metodice (Vysvědčení JINAK, formulace cílů a kritérií, slovní hodnocení, SVP) pasáže k tématu.", {
    topic: str,
  }),
  tool(
    "propose_lesson_update",
    "Připraví návrh úpravy existující lekce jako náhled pro učitele. Nic neukládá. Pole, která se nemají měnit, dej null.",
    {
      lesson_id: str,
      summary: { ...str, description: "Jedna věta, co se mění." },
      title: nullableStr,
      description: nullableStr,
      month: { type: ["string", "null"], enum: [...SCHOOL_MONTHS, null] },
      hours: { type: ["number", "null"] },
      planned_activities: { ...nullableStr, description: "Průběh hodiny." },
      goal_instruction: { ...nullableStr, description: "Jak má vypadat nový cíl, např. „jednodušeji pro žáky“. Cíl pak přeformuluje metodika." },
      criteria_instruction: { ...nullableStr, description: "Jak mají vypadat nová kritéria. Kritéria a škálu pak vytvoří metodika." },
    },
  ),
  tool("propose_lesson_create", "Připraví návrh nové lekce v tematickém plánu jako náhled. Nic neukládá.", {
    plan_id: str,
    summary: str,
    title: str,
    description: str,
    month: { type: ["string", "null"], enum: [...SCHOOL_MONTHS, null] },
    hours: { type: ["number", "null"] },
    planned_activities: nullableStr,
    with_goal_and_criteria: { type: "boolean", description: "Vytvořit rovnou cíl a kritéria podle metodiky." },
  }),
  tool("propose_plan_update", "Připraví návrh přesunu lekcí do jiných měsíců nebo přejmenování jako náhled. Nic neukládá.", {
    plan_id: str,
    summary: str,
    changes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          lesson_id: str,
          month: { type: ["string", "null"], enum: [...SCHOOL_MONTHS, null] },
          title: nullableStr,
        },
        required: ["lesson_id", "month", "title"],
        additionalProperties: false,
      },
    },
  }),
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function byPosition<T extends { position: number | null; sort_order: number }>(a: T, b: T) {
  return (a.position ?? a.sort_order + 1) - (b.position ?? b.sort_order + 1);
}

const LESSON_SELECT =
  "id, title, description, month, hours, status, date, planned_activities, rvp_outcome, course_id, class_id, courses(id, name, classes(name), subjects(name)), lesson_goals(educational_goals(id, title, pupil_text, evaluation_criteria(id, teacher_text, pupil_text, description, scale, position, sort_order)))";

async function loadLesson(ctx: ToolContext, lessonId: string): Promise<Row> {
  const { data } = await ctx.db.from("lessons").select(LESSON_SELECT).eq("id", lessonId).eq("teacher_id", ctx.teacherId).maybeSingle();
  if (!data) throw new ToolError("Lekce nenalezena.");
  return data;
}

export function lessonSnapshot(lesson: Row): LessonSnapshot {
  const goal = lesson.lesson_goals?.[0]?.educational_goals ?? null;
  return {
    title: lesson.title,
    description: lesson.description ?? "",
    month: lesson.month ?? null,
    hours: lesson.hours ?? null,
    planned_activities: lesson.planned_activities ?? "",
    goal: goal ? { teacher: goal.title, pupil: goal.pupil_text ?? "" } : null,
    criteria: [...(goal?.evaluation_criteria ?? [])].sort(byPosition).map((c: Row) => ({
      id: c.id,
      teacher: c.teacher_text || c.description,
      pupil: c.pupil_text ?? "",
      scale: c.scale ?? null,
    })),
  };
}

export class ToolError extends Error {}

function newId(): string {
  return globalThis.crypto.randomUUID();
}

// ─── Methodology ─────────────────────────────────────────────────────────────

function words(text: string): string[] {
  return text
    .toLocaleLowerCase("cs")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 4)
    .map((w) => w.slice(0, 6));
}

/** Passages of the methodology that share the most word stems with the topic. */
export function methodologyPassages(topic: string, limit = 3): { source: string; text: string }[] {
  const terms = new Set(words(topic));
  if (terms.size === 0) return [];
  const passages: { source: string; text: string; score: number }[] = [];
  for (const file of Object.keys(KNOWLEDGE) as KnowledgeFile[]) {
    const content = KNOWLEDGE[file];
    const source = content.match(/\*Zdroj: ([^*]+)\*/)?.[1] ?? `metodologie/${file}`;
    for (const part of content.split(/\n(?=#{2,3} )/)) {
      const score = words(part).filter((w) => terms.has(w)).length;
      if (score > 0) passages.push({ source, text: part.slice(0, 2500), score });
    }
  }
  return passages
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ source, text }) => ({ source, text }));
}

// ─── Class levels ────────────────────────────────────────────────────────────

async function classLevels(ctx: ToolContext, classId: string, from: string | null, to: string | null) {
  const period = from && to ? { from, to } : schoolPeriods(ctx.today).find((p) => {
    const iso = ctx.today.toISOString().slice(0, 10);
    return p.id !== "rok" && iso >= p.from && iso <= p.to;
  }) ?? schoolPeriods(ctx.today)[0];
  const months = monthsInPeriod(period) as string[];

  const { data: cls } = await ctx.db.from("classes").select("id, name").eq("id", classId).eq("teacher_id", ctx.teacherId).maybeSingle();
  if (!cls) throw new ToolError("Třída nenalezena.");
  const [{ data: lessons }, { data: links }] = await Promise.all([
    ctx.db
      .from("lessons")
      .select("id, title, date, month, status, lesson_goals(educational_goals(evaluation_criteria(id, teacher_text, description)))")
      .eq("class_id", classId)
      .eq("teacher_id", ctx.teacherId)
      .eq("status", "past"),
    ctx.db.from("class_students").select("students(id, first_name, last_name, nickname, teacher_id)").eq("class_id", classId),
  ]);
  const taught = (lessons ?? []).filter((l: Row) =>
    l.date ? l.date.slice(0, 10) >= period.from && l.date.slice(0, 10) <= period.to : months.includes((l.month ?? "").toLowerCase()),
  );
  const criteria = taught.flatMap((l: Row) =>
    (l.lesson_goals ?? []).flatMap((lg: Row) =>
      (lg.educational_goals?.evaluation_criteria ?? []).map((c: Row) => ({ id: c.id, text: c.teacher_text || c.description, lesson: l.title })),
    ),
  );
  const pupils = (links ?? []).map((l: Row) => l.students).filter((s: Row) => s && s.teacher_id === ctx.teacherId);
  const { data: levels } = criteria.length
    ? await ctx.db
        .from("current_criterion_levels")
        .select("student_id, criterion_id, source, level")
        .eq("teacher_id", ctx.teacherId)
        .in("criterion_id", criteria.map((c) => c.id))
    : { data: [] };

  return {
    class: cls.name,
    period,
    taught_lessons: taught.map((l: Row) => l.title),
    criteria: criteria.map((c) => `${c.lesson}: ${c.text}`),
    pupils: pupils.map((p: Row) => {
      const mine = (levels ?? []).filter((l: Row) => l.student_id === p.id);
      return {
        pupil: p.nickname,
        teacher_levels: criteria
          .map((c) => ({ criterion: c.text, level: mine.find((l: Row) => l.criterion_id === c.id && l.source === "teacher")?.level ?? null }))
          .filter((x) => x.level),
        self_assessment: criteria
          .map((c) => ({ criterion: c.text, level: mine.find((l: Row) => l.criterion_id === c.id && l.source !== "teacher")?.level ?? null }))
          .filter((x) => x.level),
        missing: criteria.filter((c) => !mine.some((l: Row) => l.criterion_id === c.id && l.source === "teacher")).map((c) => c.text),
      };
    }),
  };
}

// ─── Proposals ───────────────────────────────────────────────────────────────

async function newGoal(lesson: Row, instruction: string, current: LessonSnapshot) {
  const { system, user } = goalPrompt({
    subject: lesson.courses?.subjects?.name ?? "",
    grade: gradeFromClassName(lesson.courses?.classes?.name),
    rvpOutcome: lesson.rvp_outcome ?? "",
    context: [
      `${current.title}${current.description ? ` — ${current.description}` : ""}`,
      current.goal ? `Současný cíl: ${current.goal.teacher}` : "",
      instruction ? `Požadavek pedagoga: ${instruction}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    competences: "",
  });
  const result = await structuredCompletion<GoalOutput>({ system, user, schema: GOAL_SCHEMA });
  const goal = result.goals?.[0];
  if (!goal?.teacher) throw new ToolError("Cíl se nepodařilo formulovat.");
  return { teacher: goal.teacher, pupil: goal.pupil };
}

async function newCriteria(lesson: Row, goal: string, instruction: string, current: LessonSnapshot) {
  const { system, user } = criteriaPrompt({
    goal,
    grade: gradeFromClassName(lesson.courses?.classes?.name),
    subject: lesson.courses?.subjects?.name ?? "",
    notes: [
      current.criteria.length ? `Současná kritéria: ${current.criteria.map((c) => c.teacher).join(" | ")}` : "",
      instruction ? `Požadavek pedagoga: ${instruction}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    svpNeeds: [],
  });
  const result = await structuredCompletion<CriteriaOutput>({ system, user, schema: CRITERIA_SCHEMA });
  const criteria = (result.criteria ?? []).filter((c) => c.teacher?.trim()).slice(0, 3);
  if (criteria.length === 0) throw new ToolError("Kritéria se nepodařilo vytvořit.");
  // Keep the ids by position, so pupils' levels stay with their criterion.
  return criteria.map((c, i) => ({ id: current.criteria[i]?.id ?? null, teacher: c.teacher, pupil: c.pupil, scale: c.scale }));
}

function describeSnapshot(s: LessonSnapshot): string {
  return [
    `Název: ${s.title}`,
    s.month ? `Měsíc: ${s.month}` : "",
    s.goal ? `Cíl: ${s.goal.teacher} / pro žáka: ${s.goal.pupil}` : "",
    s.criteria.length ? `Kritéria: ${s.criteria.map((c) => c.teacher).join(" | ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const PREVIEW_NOTE = "Návrh je připravený a učitel ho vidí jako náhled s tlačítky Uložit a Zahodit. Zatím se nic nezměnilo.";

// ─── Running a tool ──────────────────────────────────────────────────────────

export async function runTool(name: string, rawArgs: string, ctx: ToolContext): Promise<unknown> {
  let args: Row;
  try {
    args = rawArgs ? JSON.parse(rawArgs) : {};
  } catch {
    return { error: "Neplatné argumenty nástroje." };
  }
  try {
    switch (name) {
      case "search": {
        const { data, error } = await ctx.db.rpc("search_everything", { q: String(args.query ?? ""), p_teacher: ctx.teacherId, per_kind: 5 });
        if (error) throw error;
        const hits = (data ?? []) as SearchHit[];
        ctx.onResults(hits);
        // The model sees pupils only by nickname.
        return hits.map((h) =>
          h.kind === "student" ? { kind: h.kind, id: h.id, title: h.subtitle, subtitle: null } : { kind: h.kind, id: h.id, title: h.title, subtitle: h.subtitle },
        );
      }
      case "list_plans": {
        const { data } = await ctx.db.from("courses").select("id, name, classes(id, name), subjects(name)").eq("teacher_id", ctx.teacherId).order("name");
        return (data ?? []).map((c: Row) => ({ id: c.id, name: c.name, class: c.classes?.name, class_id: c.classes?.id, subject: c.subjects?.name }));
      }
      case "list_classes": {
        const { data } = await ctx.db.from("classes").select("id, name").eq("teacher_id", ctx.teacherId).order("name");
        return data ?? [];
      }
      case "get_plan": {
        const { data: plan } = await ctx.db
          .from("courses")
          .select("id, name, classes(name), subjects(name)")
          .eq("id", args.plan_id)
          .eq("teacher_id", ctx.teacherId)
          .maybeSingle();
        if (!plan) throw new ToolError("Plán nenalezen.");
        const { data: lessons } = await ctx.db
          .from("lessons")
          .select("id, title, month, hours, status, position, lesson_goals(educational_goals(title, evaluation_criteria(id)))")
          .eq("course_id", args.plan_id)
          .eq("teacher_id", ctx.teacherId);
        return {
          ...plan,
          lessons: (lessons ?? [])
            .sort((a: Row, b: Row) => SCHOOL_MONTHS.indexOf(a.month) - SCHOOL_MONTHS.indexOf(b.month) || (a.position ?? 0) - (b.position ?? 0))
            .map((l: Row) => {
              const goal = l.lesson_goals?.[0]?.educational_goals;
              return {
                id: l.id,
                title: l.title,
                month: l.month,
                hours: l.hours,
                taught: l.status === "past",
                goal: goal?.title ?? null,
                criteria_count: goal?.evaluation_criteria?.length ?? 0,
              };
            }),
        };
      }
      case "get_lesson": {
        const lesson = await loadLesson(ctx, args.lesson_id);
        return {
          id: lesson.id,
          plan: lesson.courses?.name,
          class: lesson.courses?.classes?.name,
          subject: lesson.courses?.subjects?.name,
          taught: lesson.status === "past",
          ...lessonSnapshot(lesson),
        };
      }
      case "get_class_levels":
        return await classLevels(ctx, args.class_id, args.from ?? null, args.to ?? null);
      case "get_methodology": {
        const passages = methodologyPassages(String(args.topic ?? ""));
        return passages.length ? passages : { note: "K tématu jsem v metodice nic nenašel." };
      }
      case "propose_lesson_update": {
        const lesson = await loadLesson(ctx, args.lesson_id);
        const before = lessonSnapshot(lesson);
        const after: LessonSnapshot = { ...before, criteria: [...before.criteria] };
        for (const key of ["title", "description", "month", "planned_activities"] as const) {
          if (args[key] !== null && args[key] !== undefined) after[key] = args[key];
        }
        if (args.hours !== null && args.hours !== undefined) after.hours = args.hours;
        if (args.goal_instruction) after.goal = await newGoal(lesson, args.goal_instruction, before);
        if (args.criteria_instruction || (args.goal_instruction && before.criteria.length)) {
          const goal = after.goal?.teacher;
          if (!goal) throw new ToolError("Lekce nemá cíl, ke kterému by šla kritéria vytvořit.");
          after.criteria = await newCriteria(lesson, goal, args.criteria_instruction ?? "", before);
        }
        const proposal: Proposal = {
          id: newId(),
          type: "lesson_update",
          status: "pending",
          summary: String(args.summary ?? ""),
          lesson_id: lesson.id,
          lesson_title: lesson.title,
          before,
          after,
        };
        ctx.onProposal(proposal);
        return { result: PREVIEW_NOTE, proposal: describeSnapshot(after) };
      }
      case "propose_lesson_create": {
        const { data: plan } = await ctx.db
          .from("courses")
          .select("id, name, classes(name), subjects(name)")
          .eq("id", args.plan_id)
          .eq("teacher_id", ctx.teacherId)
          .maybeSingle();
        if (!plan) throw new ToolError("Plán nenalezen.");
        const after: LessonSnapshot = {
          title: String(args.title ?? "").trim() || "Nová lekce",
          description: args.description ?? "",
          month: args.month ?? null,
          hours: args.hours ?? null,
          planned_activities: args.planned_activities ?? "",
          goal: null,
          criteria: [],
        };
        if (args.with_goal_and_criteria) {
          const fakeLesson = { courses: plan, rvp_outcome: "" };
          after.goal = await newGoal(fakeLesson, "", after);
          after.criteria = await newCriteria(fakeLesson, after.goal.teacher, "", after);
        }
        const proposal: Proposal = {
          id: newId(),
          type: "lesson_create",
          status: "pending",
          summary: String(args.summary ?? ""),
          plan_id: plan.id,
          plan_name: plan.name,
          after,
        };
        ctx.onProposal(proposal);
        return { result: PREVIEW_NOTE, proposal: describeSnapshot(after) };
      }
      case "propose_plan_update": {
        const { data: plan } = await ctx.db.from("courses").select("id, name").eq("id", args.plan_id).eq("teacher_id", ctx.teacherId).maybeSingle();
        if (!plan) throw new ToolError("Plán nenalezen.");
        const ids = (args.changes ?? []).map((c: Row) => c.lesson_id);
        const { data: lessons } = ids.length
          ? await ctx.db.from("lessons").select("id, title, month").in("id", ids).eq("course_id", plan.id).eq("teacher_id", ctx.teacherId)
          : { data: [] };
        const items = (args.changes ?? [])
          .map((c: Row) => {
            const l = (lessons ?? []).find((x: Row) => x.id === c.lesson_id);
            if (!l) return null;
            return {
              lesson_id: l.id,
              before: { title: l.title, month: l.month ?? null },
              after: { title: c.title ?? l.title, month: c.month ?? l.month ?? null },
            };
          })
          .filter(Boolean);
        if (items.length === 0) throw new ToolError("V plánu jsem žádnou z těch lekcí nenašel.");
        const proposal: Proposal = {
          id: newId(),
          type: "plan_update",
          status: "pending",
          summary: String(args.summary ?? ""),
          plan_id: plan.id,
          plan_name: plan.name,
          items,
        };
        ctx.onProposal(proposal);
        return { result: PREVIEW_NOTE, changes: items.length };
      }
      default:
        return { error: `Neznámý nástroj ${name}.` };
    }
  } catch (e) {
    if (e instanceof ToolError) return { error: e.message };
    console.error(`Buddy tool ${name} failed:`, e);
    return { error: "Nástroj selhal." };
  }
}

/** A tool result as the model sees it: JSON with every pupil's name swapped for the nickname. */
export function toolResultForModel(result: unknown, people: PseudonymPerson[]): string {
  return pseudonymize(JSON.stringify(result), people).slice(0, 12000);
}
