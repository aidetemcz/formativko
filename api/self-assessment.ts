import { createClient } from "@supabase/supabase-js";
import { webHandler } from "./_lib/handler.js";
import { BadRequest, errorResponse, field, json } from "./_lib/http.js";

/**
 * The online exit ticket pupils open from a QR code (/s/:token, zadání
 * kap. 2.3 and 4.3). There is no login and no public RLS policy: this
 * endpoint uses the service role after checking that the token exists, is
 * still open and not past its time, and it writes only for pupils of the
 * lesson's class and only on the lesson's own criteria.
 *
 * Pupils choose themselves from the class list shown as "Adam B." (rozhodnutí
 * 8.4); the full name and the nickname never leave the server.
 */
export const config = { maxDuration: 30 };

const LEVELS = ["J", "C", "T", "U"];

function admin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function openSession(token: string) {
  if (!/^[0-9a-f]{32,128}$/.test(token)) throw new BadRequest("Kód exitky není platný.");
  const db = admin();
  const { data: session } = await db
    .from("self_assessment_sessions")
    .select("id, teacher_id, lesson_id, expires_at, closed_at")
    .eq("token", token)
    .maybeSingle();
  if (!session) throw new BadRequest("Kód exitky není platný.");
  if (session.closed_at || new Date(session.expires_at) < new Date()) {
    throw new BadRequest("Tahle exitka už je uzavřená.");
  }

  const { data: lesson } = await db
    .from("lessons")
    .select("id, title, class_id, teacher_id, lesson_goals(educational_goals(title, pupil_text, evaluation_criteria(id, pupil_text, teacher_text, description, scale, position, sort_order)))")
    .eq("id", session.lesson_id)
    .eq("teacher_id", session.teacher_id)
    .single();
  if (!lesson) throw new BadRequest("Lekce k exitce už neexistuje.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goal = (lesson as any).lesson_goals?.[0]?.educational_goals;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const criteria = ((goal?.evaluation_criteria ?? []) as any[]).sort(
    (a, b) => (a.position ?? a.sort_order + 1) - (b.position ?? b.sort_order + 1),
  );

  const { data: links } = await db
    .from("class_students")
    .select("students(id, first_name, last_name, teacher_id)")
    .eq("class_id", lesson.class_id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pupils = ((links ?? []) as any[])
    .map((l) => l.students)
    .filter((s) => s && s.teacher_id === session.teacher_id)
    .sort((a, b) => a.first_name.localeCompare(b.first_name, "cs") || a.last_name.localeCompare(b.last_name, "cs"));

  return { db, session, lesson, goal, criteria, pupils };
}

export default webHandler(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return json(null);
  try {
    const body = await req.json();
    const { db, session, lesson, goal, criteria, pupils } = await openSession(field(body.token, 200));

    if (body.action === "load") {
      return json({
        lesson: { title: lesson.title, goal: goal?.pupil_text || goal?.title || "" },
        criteria: criteria.map((c) => ({
          id: c.id,
          text: c.pupil_text || c.teacher_text || c.description,
          scale: c.scale ?? null,
        })),
        pupils: pupils.map((p) => ({ id: p.id, label: p.last_name ? `${p.first_name} ${p.last_name.charAt(0)}.` : p.first_name })),
      });
    }

    if (body.action !== "submit") throw new BadRequest("Neznámý požadavek.");
    const pupil = pupils.find((p) => p.id === body.studentId);
    if (!pupil) throw new BadRequest("Vyber prosím své jméno ze seznamu.");
    const levels = (body.levels ?? {}) as Record<string, string>;
    const rows = criteria
      .filter((c) => LEVELS.includes(levels[c.id]))
      .map((c) => ({ criterion_id: c.id, level: levels[c.id] }));
    if (rows.length === 0) throw new BadRequest("Vyber prosím u kritérií, jak se ti daří.");

    const { data: ticket, error } = await db
      .from("exit_tickets")
      .insert({
        teacher_id: session.teacher_id,
        lesson_id: lesson.id,
        student_id: pupil.id,
        source: "self_qr",
        pupil_comment: field(body.comment, 1000),
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: levelErr } = await db.from("criterion_assessments").insert(
      rows.map((r) => ({
        ...r,
        teacher_id: session.teacher_id,
        student_id: pupil.id,
        source: "self_qr",
        lesson_id: lesson.id,
        exit_ticket_id: ticket.id,
      })),
    );
    if (levelErr) throw levelErr;
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e, "self-assessment");
  }
});
