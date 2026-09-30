import type { AiResult } from "@/lib/ai";
import type { JctuScale } from "@/constants/jctu";
import type { CriterionDraft } from "@/hooks/usePlanLessons";

/** Where one lesson is in the generation queue. */
export type GenerationStatus = "waiting" | "running" | "done" | "error";

export interface LessonToGenerate {
  id: string;
  title: string;
  description: string;
  rvp_outcome: string | null;
}

export interface GenerationContext {
  subject: string;
  grade: string;
}

interface GoalVariant {
  teacher: string;
  pupil: string;
}

interface GeneratedCriterion {
  teacher: string;
  pupil: string;
  scale: JctuScale;
  svp_variants: { need: string; text: string }[];
}

export interface GenerationDeps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoke: (name: "formulate-goal" | "generate-criteria", options: { body: Record<string, unknown> }) => Promise<AiResult<any>>;
  saveGoal: (lessonId: string, goal: GoalVariant) => Promise<string>;
  saveCriteria: (goalId: string, criteria: CriterionDraft[]) => Promise<void>;
}

/**
 * Goal (prompt 01, first variant) and criteria with scales (prompts 02 + 03)
 * for one lesson, saved as they arrive. One lesson per request pair, so a long
 * plan never hits the function time limit (zadání kap. 4.3).
 */
export async function generateLessonContent(
  lesson: LessonToGenerate,
  ctx: GenerationContext,
  deps: GenerationDeps,
): Promise<void> {
  const goalRes = await deps.invoke("formulate-goal", {
    body: {
      context: [lesson.title, lesson.description].filter(Boolean).join(" — "),
      rvpOutcome: lesson.rvp_outcome ?? "",
      subject: ctx.subject,
      grade: ctx.grade,
    },
  });
  if (goalRes.error) throw goalRes.error;
  const goal: GoalVariant | undefined = goalRes.data?.goals?.[0];
  if (!goal?.teacher) throw new Error("AI nevrátila cíl.");
  const goalId = await deps.saveGoal(lesson.id, goal);

  const critRes = await deps.invoke("generate-criteria", {
    body: { goal: goal.teacher, subject: ctx.subject, grade: ctx.grade },
  });
  if (critRes.error) throw critRes.error;
  const criteria: GeneratedCriterion[] = critRes.data?.criteria ?? [];
  if (criteria.length === 0) throw new Error("AI nevrátila kritéria.");
  await deps.saveCriteria(
    goalId,
    criteria.map((c) => ({ teacher: c.teacher, pupil: c.pupil, scale: c.scale, svp_variants: c.svp_variants ?? [] })),
  );
}

/**
 * Work through items a few at a time, reporting each one's status. A failure
 * marks that item and moves on; the caller can run it again.
 */
export async function runQueue<T extends { id: string }>(
  items: T[],
  work: (item: T) => Promise<void>,
  onStatus: (id: string, status: GenerationStatus, error?: string) => void,
  concurrency = 2,
): Promise<void> {
  items.forEach((i) => onStatus(i.id, "waiting"));
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++];
      onStatus(item.id, "running");
      try {
        await work(item);
        onStatus(item.id, "done");
      } catch (e) {
        onStatus(item.id, "error", e instanceof Error ? e.message : "Neznámá chyba");
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
}
