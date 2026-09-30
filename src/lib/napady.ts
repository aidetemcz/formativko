import { monthOrder } from "@/constants/schoolYear";
import type { JctuCode, JctuScale } from "@/constants/jctu";
import { taughtInPeriod, type TaughtLesson } from "@/lib/readiness";
import type { SchoolPeriod } from "@/constants/schoolYear";

/** One batch of questions is short on purpose: asking about everything at once does not help. */
export const NAPADY_BATCH = 12;

export interface NapadyCriterion {
  id: string;
  teacher_text: string | null;
  pupil_text: string | null;
  description: string;
  scale: Partial<JctuScale> | null;
  position: number | null;
  sort_order: number;
}

export interface NapadyLesson extends TaughtLesson {
  id: string;
  title: string;
  class_id: string | null;
  classes: { name: string } | null;
  subjects: { name: string } | null;
  lesson_goals?: { educational_goals: { title: string; evaluation_criteria: NapadyCriterion[] } | null }[];
}

export interface NapadyPupil {
  id: string;
  first_name: string;
  last_name: string;
}

export interface NapadyLevel {
  student_id: string;
  criterion_id: string;
  source: string;
  level: JctuCode;
}

export interface NapadyProof {
  id: string;
  title: string;
  type: string;
  date: string;
  lesson_id: string | null;
  studentIds: string[];
}

export interface NapadyQuestion {
  key: string;
  pupil: NapadyPupil;
  lesson: { id: string; title: string; className: string; subject: string; goal: string };
  criterion: { id: string; text: string };
  /** What the pupil said about themselves on an exit ticket, if anything. */
  selfLevel: JctuCode | null;
  /** The newest proof of this pupil from the lesson. */
  lastProof: { title: string; type: string; date: string } | null;
}

/**
 * Pupil × criterion pairs from lessons taught in the period that still have no
 * level from the teacher (zadání kap. 4.6). Self-assessment does not fill a
 * gap — it is shown next to the question instead.
 */
export function buildNapadyQuestions(
  lessons: NapadyLesson[],
  pupilsByClass: Map<string, NapadyPupil[]>,
  levels: NapadyLevel[],
  proofs: NapadyProof[],
  period: Pick<SchoolPeriod, "from" | "to">,
): NapadyQuestion[] {
  const { lessons: taught } = taughtInPeriod(lessons, period);
  const teacher = new Set(levels.filter((l) => l.source === "teacher").map((l) => `${l.student_id}|${l.criterion_id}`));
  const self = new Map<string, JctuCode>();
  for (const l of levels) if (l.source !== "teacher") self.set(`${l.student_id}|${l.criterion_id}`, l.level);

  const ordered = [...taught].sort(
    (a, b) => (a.date ?? "").localeCompare(b.date ?? "") || monthOrder(a.month) - monthOrder(b.month),
  );
  const questions: NapadyQuestion[] = [];
  for (const lesson of ordered) {
    const goal = lesson.lesson_goals?.[0]?.educational_goals;
    if (!goal || !lesson.class_id) continue;
    const criteria = [...goal.evaluation_criteria].sort(
      (a, b) => (a.position ?? a.sort_order + 1) - (b.position ?? b.sort_order + 1),
    );
    const pupils = [...(pupilsByClass.get(lesson.class_id) ?? [])].sort((a, b) =>
      a.last_name.localeCompare(b.last_name, "cs"),
    );
    for (const pupil of pupils) {
      const lastProof =
        proofs
          .filter((p) => p.lesson_id === lesson.id && p.studentIds.includes(pupil.id))
          .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
      for (const c of criteria) {
        const key = `${pupil.id}|${c.id}`;
        if (teacher.has(key)) continue;
        questions.push({
          key,
          pupil,
          lesson: {
            id: lesson.id,
            title: lesson.title,
            className: lesson.classes?.name ?? "",
            subject: lesson.subjects?.name ?? "",
            goal: goal.title,
          },
          criterion: { id: c.id, text: c.teacher_text || c.pupil_text || c.description },
          selfLevel: self.get(key) ?? null,
          lastProof: lastProof ? { title: lastProof.title, type: lastProof.type, date: lastProof.date } : null,
        });
      }
    }
  }
  return questions;
}
