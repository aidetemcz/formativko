import { pupilSentence, type JctuCode, type JctuScale } from "@/constants/jctu";
import { monthOrder } from "@/constants/schoolYear";
import type { CurrentLevel, LessonDetail } from "@/hooks/usePlanLessons";

/** Lessons grouped by month, in school-year order; lessons without a month last. */
export function groupByMonth<T extends { month: string | null }>(lessons: T[]): { month: string; lessons: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const l of lessons) {
    const key = l.month?.trim() || "";
    groups.set(key, [...(groups.get(key) ?? []), l]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => monthOrder(a) - monthOrder(b))
    .map(([month, items]) => ({ month: month || "Bez měsíce", lessons: items }));
}

/** What an exit ticket says, editable before printing (zadání kap. 4.3). */
export interface ExitTicketTemplate {
  goal: string;
  criteria: { pupil: string; scale: JctuScale }[];
}

export function templateFrom(lesson: LessonDetail): ExitTicketTemplate {
  return {
    goal: lesson.goal?.pupil_text || lesson.goal?.title || "",
    criteria: lesson.criteria.map((c) => ({
      pupil: c.pupil_text || c.teacher_text || c.description,
      scale: {
        J: pupilSentence("J", c.scale),
        C: pupilSentence("C", c.scale),
        T: pupilSentence("T", c.scale),
        U: pupilSentence("U", c.scale),
      },
    })),
  };
}

/** Latest teacher level and latest self-assessment per pupil × criterion. */
export function levelMap(levels: CurrentLevel[]) {
  const map = new Map<string, { teacher?: JctuCode; self?: JctuCode; selfAt?: string }>();
  for (const l of levels) {
    const key = `${l.student_id}:${l.criterion_id}`;
    const entry = map.get(key) ?? {};
    if (l.source === "teacher") entry.teacher = l.level;
    else if (!entry.selfAt || l.assessed_at > entry.selfAt) {
      entry.self = l.level;
      entry.selfAt = l.assessed_at;
    }
    map.set(key, entry);
  }
  return map;
}
