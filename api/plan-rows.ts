import { webHandler } from "./_lib/handler.js";
import { errorResponse, field, json, requireUser } from "./_lib/http.js";
import { structuredCompletion } from "./_lib/openai.js";
import { planSourceParts } from "./_lib/plan-source.js";
import { PLAN_MONTHS, PLAN_ROWS_SCHEMA, gradeFromClassName, planRowsPrompt, type PlanRow } from "./_lib/prompts.js";

/**
 * A thematic plan (pasted text, PDF or photo) → lessons by month (zadání
 * kap. 4.3). Nothing is saved here: the teacher reviews the rows and the app
 * stores the ones she keeps.
 */
export const config = { maxDuration: 60 };

export default webHandler(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return json(null);
  try {
    await requireUser(req);
    const body = await req.json();
    const hoursPerLesson = body.hoursPerLesson === 2 ? 2 : 1;

    const parts = await planSourceParts(field(body.text, 50_000), field(body.fileUrl, 2000));
    const system = planRowsPrompt({
      subject: field(body.subject, 200),
      grade: field(body.grade, 100) || gradeFromClassName(field(body.className, 100)),
      hoursPerLesson,
    });
    const result = await structuredCompletion<{ rows: PlanRow[] }>({
      system,
      user: [{ type: "text", text: "Převeď tento plán na lekce." }, ...parts],
      schema: PLAN_ROWS_SCHEMA,
      temperature: 0.2,
    });

    const rows = (result.rows ?? [])
      .filter((r) => r.title?.trim())
      .slice(0, 120)
      .map((r) => ({
        month: PLAN_MONTHS.includes(r.month) ? r.month : "",
        title: r.title.trim(),
        description: (r.description ?? "").trim(),
        hours: r.hours > 0 && r.hours <= 10 ? r.hours : hoursPerLesson,
        rvp_outcome: (r.rvp_outcome ?? "").trim(),
      }));
    return json({ rows });
  } catch (e) {
    return errorResponse(e, "plan-rows");
  }
});
