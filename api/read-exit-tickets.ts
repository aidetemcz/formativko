import { createClient } from "@supabase/supabase-js";
import { webHandler } from "./_lib/handler.js";
import { BadRequest, errorResponse, field, json, requireUser } from "./_lib/http.js";
import { matchPupil, type NamedPupil } from "./_lib/name-match.js";
import { structuredCompletion } from "./_lib/openai.js";
import { READ_EXIT_TICKET_SCHEMA, readExitTicketPrompt, type ReadExitTicketOutput } from "./_lib/prompts.js";
import { isOwnSignedStorageUrl } from "./_lib/storage-url.js";

/**
 * One photo of a filled-in paper exit ticket → the pupil, the ticked steps and
 * the pupil's comment (zadání kap. 3, bod 5). Nothing is saved here: the
 * teacher confirms or corrects every row, and only then does the app store
 * the ticket with source "self_paper".
 *
 * The photo shows the pupil's name, which cannot be helped; the class list is
 * never sent — the name the model reads is matched to a pupil on the server.
 */
export const config = { maxDuration: 60 };

export default webHandler(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return json(null);
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const lessonId = field(body.lessonId, 100);
    const fileUrl = field(body.fileUrl, 2000);
    if (!isOwnSignedStorageUrl(fileUrl, process.env.SUPABASE_URL, "proof-files", user.id)) {
      throw new BadRequest("Neplatný odkaz na fotku exitky.");
    }

    const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: lesson } = await db
      .from("lessons")
      .select("id, class_id, lesson_goals(educational_goals(evaluation_criteria(id, pupil_text, teacher_text, description, position, sort_order)))")
      .eq("id", lessonId)
      .eq("teacher_id", user.id)
      .maybeSingle();
    if (!lesson) throw new BadRequest("Lekce nenalezena.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const criteria = (((lesson as any).lesson_goals?.[0]?.educational_goals?.evaluation_criteria ?? []) as any[]).sort(
      (a, b) => (a.position ?? a.sort_order + 1) - (b.position ?? b.sort_order + 1),
    );
    if (criteria.length === 0) throw new BadRequest("Lekce nemá kritéria.");

    const result = await structuredCompletion<ReadExitTicketOutput>({
      system: readExitTicketPrompt(criteria.map((c) => c.pupil_text || c.teacher_text || c.description)),
      user: [
        { type: "text", text: "Přečti tuto exitku." },
        { type: "image_url", image_url: { url: fileUrl } },
      ],
      schema: READ_EXIT_TICKET_SCHEMA,
      temperature: 0,
    });

    const { data: links } = await db
      .from("class_students")
      .select("students(id, first_name, last_name, teacher_id)")
      .eq("class_id", lesson.class_id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pupils = ((links ?? []) as any[]).map((l) => l.students).filter((s) => s?.teacher_id === user.id) as NamedPupil[];

    const levels: Record<string, string | null> = {};
    criteria.forEach((c, i) => {
      const read = result.criteria?.find((r) => r.number === i + 1)?.level;
      levels[c.id] = read ? read : null;
    });

    return json({
      studentId: matchPupil(result.name ?? "", pupils),
      readName: (result.name ?? "").trim(),
      levels,
      pupilComment: (result.pupil_comment ?? "").trim(),
      unclear: (result.unclear ?? "").trim(),
    });
  } catch (e) {
    return errorResponse(e, "read-exit-tickets");
  }
});
