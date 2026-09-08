/**
 * Feature flags for the prototype.
 *
 * These switch whole features off in the school pilot without deleting the
 * code that implements them, so a flag can be flipped back on once the feature
 * is wanted again.
 *
 * Each flag is typed as `boolean` rather than left to infer a literal `false`.
 * A literal would narrow every guard to dead code, and TypeScript would then
 * stop reporting type errors inside the very code that is switched off — which
 * is exactly the code nobody is exercising by hand any more.
 */

/**
 * Lesson planning: the /lessons pages, the sidebar entry, the lesson picker on
 * a proof of learning and in the capture tool, the lesson section of a course,
 * and the AI that drafts lessons from a thematic plan.
 *
 * While this is off, no other part of the prototype may require a lesson to
 * exist. The onboarding leads from goals straight to the first proof, the
 * capture tool colours goal coverage from the course's goals, and the
 * evaluations entry appears once goals are set — none of it waits for a lesson
 * to be planned. Proofs still carry a nullable `lesson_id`, so records written
 * while lessons were on keep their link.
 */
export const LESSONS_ENABLED: boolean = false;
