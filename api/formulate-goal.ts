import { webHandler } from "./_lib/handler.js";
import { BadRequest, errorResponse, field, json, requireUser } from "./_lib/http.js";
import { structuredCompletion } from "./_lib/openai.js";
import { GOAL_SCHEMA, goalPrompt, gradeFromClassName, type GoalOutput } from "./_lib/prompts.js";

/**
 * Step 1 of the methodology: the lesson goal (metodologie/prompty/01).
 *
 * The prompt's questions are the request's fields. Returns three variants of
 * the goal, each for the teacher and for the pupil ("Dnes se učím…").
 */
export const config = { maxDuration: 60 };

export default webHandler(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return json(null);
  try {
    await requireUser(req);
    const body = await req.json();

    const input = {
      subject: field(body.subject, 200),
      grade: field(body.grade, 100) || gradeFromClassName(field(body.className, 100)),
      rvpOutcome: field(body.rvpOutcome),
      // `rawGoal` is how the old goal editor names the teacher's own wording.
      context: field(body.context) || field(body.rawGoal),
      competences: field(body.competences, 1000),
    };
    if (!input.context && !input.rvpOutcome) {
      throw new BadRequest("Napište, čeho se má cíl týkat, nebo vložte výstup z RVP.");
    }

    const { system, user } = goalPrompt(input);
    const result = await structuredCompletion<GoalOutput>({ system, user, schema: GOAL_SCHEMA });
    const goals = (result.goals ?? []).filter((g) => g.teacher?.trim()).slice(0, 3);
    if (goals.length === 0) throw new Error("AI returned no goal");
    return json({ goals });
  } catch (e) {
    return errorResponse(e, "formulate-goal");
  }
});
