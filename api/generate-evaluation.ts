import { createClient } from "@supabase/supabase-js";
import { webHandler } from "./_lib/handler.js";
import { BadRequest, errorResponse, field, json, requireUser } from "./_lib/http.js";
import { structuredCompletion } from "./_lib/openai.js";
import {
  EVALUATION_SCHEMA,
  evaluationPrompt,
  gradeFromClassName,
  type EvaluationMode,
  type EvaluationOutput,
  type EvaluationSource,
} from "./_lib/prompts.js";
import { runReview } from "./_lib/review.js";
import { depseudonymize, pseudonymize, type PseudonymPerson } from "../src/lib/pseudonym.js";

/**
 * Step 4 of the methodology: the written evaluation (metodologie/prompty/04),
 * checked straight away by the Rádce (prompt 05).
 *
 * - Two modes (zadání kap. 2.1): running feedback carries next steps; text for
 *   the school report keeps them out of the text and returns them apart.
 * - Input: the pupil's J/Č/T/Ú levels per criterion and the proofs of
 *   learning. Each sentence of the answer names what it is based on.
 * - The model never sees a pupil's real name: the prompt carries the nickname,
 *   every known name in notes and earlier texts is pseudonymised, and the
 *   nickname in the answer is turned back into the first name here. SVP
 *   details are included only when the teacher ticked them for this call.
 */
export const config = { maxDuration: 60 };

const LEVEL_LABELS: Record<string, string> = {
  J: "J (ještě neosvojeno)",
  C: "Č (částečně osvojeno)",
  T: "T (téměř osvojeno)",
  U: "Ú (úplně osvojeno)",
};

const SOURCE_LABELS: Record<string, string> = {
  teacher: "hodnocení učitele",
  self_qr: "sebehodnocení žáka (online exitka)",
  self_paper: "sebehodnocení žáka (papírová exitka)",
};

const TONES: Record<string, string> = {
  pratelsky: "přátelský, povzbuzující",
  formalni: "věcný, výstižný",
  vyvazeny: "věcný a zároveň vlídný",
};

const LENGTHS: Record<string, string> = {
  kratka: "2–3 věty",
  stredni: "4–6 vět",
  dlouha: "7–10 vět",
};

/** Old evaluation types of the generator form → the two modes of the brief. */
export function modeFor(evalType: unknown, mode: unknown): EvaluationMode {
  if (mode === "certificate" || mode === "feedback") return mode;
  return evalType === "vysvedceni" ? "certificate" : "feedback";
}

export default webHandler(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return json(null);

  try {
    const user = await requireUser(req);
    const body = await req.json();
    const { studentId, evalType, dateFrom, dateTo, goalId, includeSvp } = body;
    if (!studentId) throw new BadRequest("Chybí žák.");
    const mode = modeFor(evalType, body.mode);

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // The service-role client bypasses RLS, so every query below that can
    // reach another teacher's rows is filtered by teacher_id explicitly.
    const { data: student } = await supabase
      .from("students")
      .select("first_name, last_name, nickname, svp, interests, communication_preferences, learning_styles, svp_details, notes")
      .eq("id", studentId)
      .eq("teacher_id", user.id)
      .single();
    if (!student) throw new Error("Student not found");

    const [{ data: people }, { data: proofLinks }, { data: previousEvals }, { data: goal }] = await Promise.all([
      supabase.from("students").select("first_name, last_name, nickname").eq("teacher_id", user.id),
      supabase
        .from("proof_students")
        .select("proof_id, proofs_of_learning(id, title, type, date, note, lesson_id)")
        .eq("student_id", studentId),
      supabase
        .from("evaluations")
        .select("text, period, created_at")
        .eq("student_id", studentId)
        .eq("teacher_id", user.id)
        .not("text", "is", null)
        .order("created_at", { ascending: false })
        .limit(2),
      goalId
        ? supabase
            .from("educational_goals")
            .select("id, title, description, subjects(name)")
            .eq("id", goalId)
            .eq("teacher_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const pupil: PseudonymPerson = {
      first_name: student.first_name,
      last_name: student.last_name,
      nickname: student.nickname,
    };
    const everyone: PseudonymPerson[] = [pupil, ...((people ?? []) as PseudonymPerson[])];
    const anon = (text: string | null | undefined) => pseudonymize(text, everyone);

    const inPeriod = (date: string | null | undefined) => {
      const day = (date ?? "").slice(0, 10);
      if (dateFrom && day < dateFrom) return false;
      if (dateTo && day > dateTo) return false;
      return true;
    };

    // --- Proofs in the period ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proofsInPeriod = (proofLinks ?? []).map((pl: any) => pl.proofs_of_learning).filter(Boolean).filter((p: any) => inPeriod(p.date));

    // --- Lessons of the proofs; with a subject chosen, only that subject's proofs count ---
    const subjectId = field(body.subjectId, 100) || null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lessonIds = [...new Set(proofsInPeriod.map((p: any) => p.lesson_id).filter(Boolean))];
    const { data: lessons } = lessonIds.length
      ? await supabase
          .from("lessons")
          .select("id, title, observation_focus, subject_id")
          .in("id", lessonIds)
          .eq("teacher_id", user.id)
      : { data: [] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lessonById = new Map((lessons ?? []).map((l: any) => [l.id, l]));
    const proofs = subjectId
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        proofsInPeriod.filter((p: any) => lessonById.get(p.lesson_id)?.subject_id === subjectId)
      : proofsInPeriod;

    // --- Current levels per criterion (teacher and self-assessment) ---
    const { data: levelRows } = await supabase
      .from("current_criterion_levels")
      .select("id, criterion_id, source, level, assessed_at")
      .eq("student_id", studentId)
      .eq("teacher_id", user.id);
    const levelsInPeriod = (levelRows ?? []).filter((l) => inPeriod(l.assessed_at));

    const criterionIds = [...new Set(levelsInPeriod.map((l) => l.criterion_id))];
    const { data: criteria } = criterionIds.length
      ? await supabase
          .from("evaluation_criteria")
          .select("id, teacher_text, description, goal_id, educational_goals!inner(title, teacher_id, subject_id)")
          .in("id", criterionIds)
          .eq("educational_goals.teacher_id", user.id)
      : { data: [] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const criterionById = new Map((criteria ?? []).map((c: any) => [c.id, c]));
    const levels = levelsInPeriod.filter((l) => {
      const c = criterionById.get(l.criterion_id);
      if (!c) return false;
      if (goal && c.goal_id !== goal.id) return false;
      return !subjectId || c.educational_goals?.subject_id === subjectId;
    });

    if (proofs.length === 0 && levels.length === 0) {
      return json({ text: "", noProofs: true, proofCount: 0, sourceProofs: [], sentences: [] });
    }

    // --- Sources the model cites: D1… for proofs, U1… for levels ---
    const refs = new Map<string, { proofId?: string; assessmentId?: string }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proofSources: EvaluationSource[] = proofs.map((p: any, i: number) => {
      const ref = `D${i + 1}`;
      refs.set(ref, { proofId: p.id });
      let line = `${anon(p.title)} (${p.type}, ${p.date})`;
      if (p.note) line += `: ${anon(p.note)}`;
      const lesson = lessonById.get(p.lesson_id);
      if (lesson) line += ` [Hodina: ${anon(lesson.title)}${lesson.observation_focus ? `; fokus: ${anon(lesson.observation_focus)}` : ""}]`;
      return { ref, line };
    });
    const levelSources: EvaluationSource[] = levels.map((l, i) => {
      const ref = `U${i + 1}`;
      refs.set(ref, { assessmentId: l.id });
      const c = criterionById.get(l.criterion_id);
      return {
        ref,
        line: `${anon(c.teacher_text || c.description)} (cíl: ${anon(c.educational_goals?.title)}) → ${LEVEL_LABELS[l.level] ?? l.level}, ${SOURCE_LABELS[l.source] ?? l.source}, ${String(l.assessed_at).slice(0, 10)}`,
      };
    });

    // --- Pupil profile ---
    const profile = [
      student.interests && `Zájmy a motivace: ${anon(student.interests)}`,
      student.communication_preferences && `Komunikační preference: ${student.communication_preferences}`,
      student.learning_styles && `Preferované styly učení: ${student.learning_styles}`,
      includeSvp === true && student.svp && student.svp_details && `Speciální vzdělávací potřeby: ${anon(student.svp_details)}`,
      student.notes && `Poznámky učitele: ${anon(student.notes)}`,
    ]
      .filter(Boolean)
      .join("\n");

    const className = field(body.className, 100);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = goal as any;
    const input = {
      mode,
      nickname: pupil.nickname,
      grade: gradeFromClassName(className),
      subject: g?.subjects?.name ?? field(body.subject, 100),
      period: `${dateFrom || "neurčeno"} – ${dateTo || "neurčeno"}`,
      goal: g ? anon([g.title, g.description].filter(Boolean).join(" — ")) : "",
      profile,
      previous: (previousEvals ?? []).map((e) => `Období ${e.period}: ${anon(e.text)}`).join("\n"),
      levels: levelSources,
      proofs: proofSources,
      teacherInstructions: anon(field(body.preferences)),
      tone: TONES[body.tone] ?? TONES.pratelsky,
      length: LENGTHS[body.length] ?? LENGTHS.stredni,
    };

    const { system, user: userPrompt } = evaluationPrompt(input);
    const result = await structuredCompletion<EvaluationOutput>({ system, user: userPrompt, schema: EVALUATION_SCHEMA });

    const rawSentences = (result.sentences ?? []).filter((s) => s.text?.trim());
    const rawText = rawSentences.map((s) => s.text.trim()).join(" ");

    // The Rádce reads the draft while it still carries the nickname.
    const review = await runReview({ text: rawText, grade: input.grade, mode }).catch((e) => {
      console.error("Rádce failed, returning the draft without comments:", e);
      return null;
    });

    const back = (s: string) => depseudonymize(s, pupil);
    const sentences = rawSentences.map((s) => {
      const cited = (s.sources ?? []).map((r) => refs.get(r.trim())).filter(Boolean);
      return {
        text: back(s.text.trim()),
        proofIds: cited.map((c) => c!.proofId).filter(Boolean),
        assessmentIds: cited.map((c) => c!.assessmentId).filter(Boolean),
      };
    });

    return json({
      text: back(rawText),
      mode,
      noProofs: false,
      proofCount: proofs.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sourceProofs: proofs.map((p: any) => ({ id: p.id, title: p.title, type: p.type, date: p.date })),
      sentences,
      recommendationsOutside: mode === "certificate" ? (result.recommendations_outside ?? []).map(back) : [],
      review: review && {
        comments: review.comments.map(back),
        went_well: review.went_well.map(back),
        offers: review.offers,
        style_issues: review.style_issues,
      },
    });
  } catch (e) {
    return errorResponse(e, "generate-evaluation");
  }
});
