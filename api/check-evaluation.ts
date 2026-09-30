import { createClient } from "@supabase/supabase-js";
import { depseudonymize, pseudonymize, type PseudonymPerson } from "../src/lib/pseudonym.js";
import { webHandler } from "./_lib/handler.js";
import { BadRequest, errorResponse, field, json, requireUser } from "./_lib/http.js";
import { runReview } from "./_lib/review.js";
import { gradeFromClassName, type EvaluationMode } from "./_lib/prompts.js";

/**
 * The Rádce (metodologie/prompty/05): short comments on a finished text. It
 * never writes or rewrites the evaluation. generate-evaluation runs it on
 * every draft; this endpoint checks a text the teacher wrote or edited.
 */
export const config = { maxDuration: 60 };

export default webHandler(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return json(null);
  try {
    const user = await requireUser(req);
    const body = await req.json();

    const text = field(body.text, 8000);
    if (!text) throw new BadRequest("Chybí text hodnocení.");
    const mode: EvaluationMode = body.mode === "certificate" ? "certificate" : "feedback";

    // Names in the teacher's text are pseudonymised before the model sees
    // them; the pupil's nickname in the comments is turned back afterwards.
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: people } = await supabase
      .from("students")
      .select("id, first_name, last_name, nickname")
      .eq("teacher_id", user.id);
    const everyone = (people ?? []) as (PseudonymPerson & { id: string })[];
    const pupil = everyone.find((p) => p.id === body.studentId);

    const review = await runReview({
      text: pseudonymize(text, everyone),
      grade: field(body.grade, 100) || gradeFromClassName(field(body.className, 100)),
      mode,
    });
    const back = (s: string) => (pupil ? depseudonymize(s, pupil) : s);
    return json({
      comments: review.comments.map(back),
      went_well: review.went_well.map(back),
      offers: review.offers,
      style_issues: review.style_issues,
    });
  } catch (e) {
    return errorResponse(e, "check-evaluation");
  }
});
