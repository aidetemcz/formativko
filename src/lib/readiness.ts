import { monthsInPeriod, type SchoolPeriod } from "@/constants/schoolYear";

/**
 * The readiness semafor (zadání kap. 2.4): is a pupil ready to be evaluated
 * for a period? The thresholds live here and nowhere else — in Veronika's
 * prototype they differed between screens.
 *
 * A pupil is ready when the teacher has recorded a level for every criterion
 * of the lessons taught in the period. Self-assessment does not count: it is
 * the pupil's view, not evidence the teacher has weighed.
 */

/** Share of criteria with a teacher's level from which a few are "missing" rather than "most". */
export const PARTIAL_MIN_SHARE = 0.5;

export type Readiness = "ready" | "partial" | "missing" | "nothing_taught";

export interface ReadinessResult {
  status: Readiness;
  covered: number;
  total: number;
  /** Criteria still without the teacher's level. */
  missingCriterionIds: string[];
}

export function readinessFor(taughtCriterionIds: string[], assessedCriterionIds: Set<string>): ReadinessResult {
  const total = taughtCriterionIds.length;
  const missingCriterionIds = taughtCriterionIds.filter((id) => !assessedCriterionIds.has(id));
  const covered = total - missingCriterionIds.length;
  let status: Readiness;
  if (total === 0) status = "nothing_taught";
  else if (covered === total) status = "ready";
  else if (covered / total >= PARTIAL_MIN_SHARE) status = "partial";
  else status = "missing";
  return { status, covered, total, missingCriterionIds };
}

export const READINESS_LABELS: Record<Readiness, string> = {
  ready: "Připravený",
  partial: "Pár důkazů chybí",
  missing: "Žádné nebo málo důkazů",
  nothing_taught: "Zatím nic probráno",
};

/** Token classes; the semafor speaks about the teacher's records, never about the pupil's performance. */
export const READINESS_CLASSES: Record<Readiness, string> = {
  ready: "bg-ready text-ready-foreground",
  partial: "bg-partial text-partial-foreground",
  missing: "bg-missing text-missing-foreground",
  nothing_taught: "bg-muted text-muted-foreground",
};

export interface TaughtLesson {
  month: string | null;
  date: string | null;
  status: string;
  lesson_goals?: { educational_goals: { evaluation_criteria: { id: string }[] } | null }[];
}

/**
 * Lessons taught in a period and their criteria. A lesson counts when it is
 * marked "probráno" and its date — or, without a date, its month — falls
 * into the period.
 */
export function taughtInPeriod<T extends TaughtLesson>(
  lessons: T[],
  period: Pick<SchoolPeriod, "from" | "to">,
): { lessons: T[]; criterionIds: string[] } {
  const months = monthsInPeriod(period) as string[];
  const taught = lessons.filter((l) => {
    if (l.status !== "past") return false;
    if (l.date) {
      const day = l.date.slice(0, 10);
      return day >= period.from && day <= period.to;
    }
    return months.includes((l.month ?? "").trim().toLowerCase());
  });
  const criterionIds = [
    ...new Set(taught.flatMap((l) => (l.lesson_goals ?? []).flatMap((lg) => (lg.educational_goals?.evaluation_criteria ?? []).map((c) => c.id)))),
  ];
  return { lessons: taught, criterionIds };
}
