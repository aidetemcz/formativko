import { webHandler } from "./_lib/handler.js";
import { BadRequest, errorResponse, field, json, requireUser } from "./_lib/http.js";
import { structuredCompletion } from "./_lib/openai.js";
import { CRITERIA_SCHEMA, criteriaPrompt, gradeFromClassName, type CriteriaOutput } from "./_lib/prompts.js";

/**
 * Steps 2 and 3 of the methodology in one structured answer
 * (metodologie/prompty/02 and 03): three criteria, each for the teacher and
 * for the pupil, with the pupil's J/Č/T/Ú sentences.
 *
 * SVP variants are produced only for needs the teacher ticked for this call,
 * and the SVP knowledge file is attached only then.
 */
export const config = { maxDuration: 60 };

export default webHandler(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return json(null);
  try {
    await requireUser(req);
    const body = await req.json();

    const goal = field(body.goal) || [field(body.goalTitle), field(body.goalDescription)].filter(Boolean).join(" ");
    if (!goal) throw new BadRequest("Chybí výukový cíl.");

    const svpNeeds = Array.isArray(body.svpNeeds)
      ? body.svpNeeds.map((n: unknown) => field(n, 300)).filter(Boolean).slice(0, 5)
      : [];

    const { system, user } = criteriaPrompt({
      goal,
      grade: field(body.grade, 100) || gradeFromClassName(field(body.className, 100)),
      subject: field(body.subject, 200),
      notes: field(body.notes),
      svpNeeds,
    });
    const result = await structuredCompletion<CriteriaOutput>({ system, user, schema: CRITERIA_SCHEMA });

    const criteria = (result.criteria ?? [])
      .filter((c) => c.teacher?.trim())
      .slice(0, 3)
      .map((c) => ({ ...c, svp_variants: svpNeeds.length > 0 ? c.svp_variants ?? [] : [] }));
    if (criteria.length === 0) throw new Error("AI returned no criteria");
    return json({ criteria });
  } catch (e) {
    return errorResponse(e, "generate-criteria");
  }
});
