import type { AssessmentSource, JctuCode } from "@/constants/jctu";

/** What a feed item is: a stored proof by its type, or a level on a criterion. */
export type EvidenceKind = "text" | "camera" | "voice" | "file" | "level";

export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  level: "Úroveň",
  text: "Poznámka",
  camera: "Fotka",
  voice: "Nahrávka",
  file: "Soubor",
};

export interface EvidencePupil {
  id: string;
  first_name: string;
  last_name: string;
}

export interface EvidenceLessonRef {
  id: string;
  title: string;
  class_id: string | null;
  subject_id: string | null;
  classes: { name: string } | null;
  subjects: { name: string } | null;
}

export interface EvidenceItem {
  /** `proof:<id>` or `level:<id>`. */
  key: string;
  id: string;
  kind: EvidenceKind;
  date: string;
  pupils: EvidencePupil[];
  lesson: EvidenceLessonRef | null;
  title: string;
  note: string;
  file: { url: string; name: string | null } | null;
  level: { code: JctuCode; criterion: string; source: AssessmentSource } | null;
}

export interface EvidenceFilters {
  subjectId?: string;
  classId?: string;
  studentId?: string;
  lessonId?: string;
  kind?: EvidenceKind;
  search?: string;
}

/**
 * The feed after the filters. A proof without a lesson belongs to the
 * classes of its pupils, which `classOf` knows (pupil id → class ids).
 */
export function filterEvidence(
  items: EvidenceItem[],
  f: EvidenceFilters,
  classOf: Map<string, string[]>,
): EvidenceItem[] {
  const q = (f.search ?? "").trim().toLocaleLowerCase("cs");
  return items
    .filter((i) => {
      if (f.kind && i.kind !== f.kind) return false;
      if (f.lessonId && i.lesson?.id !== f.lessonId) return false;
      if (f.subjectId && i.lesson?.subject_id !== f.subjectId) return false;
      if (f.studentId && !i.pupils.some((p) => p.id === f.studentId)) return false;
      if (f.classId) {
        const inClass = i.lesson?.class_id
          ? i.lesson.class_id === f.classId
          : i.pupils.some((p) => (classOf.get(p.id) ?? []).includes(f.classId!));
        if (!inClass) return false;
      }
      if (q) {
        const text = [
          i.title,
          i.note,
          i.level?.criterion,
          i.lesson?.title,
          i.lesson?.subjects?.name,
          i.lesson?.classes?.name,
          ...i.pupils.map((p) => `${p.first_name} ${p.last_name}`),
        ]
          .join(" ")
          .toLocaleLowerCase("cs");
        if (!text.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function pluralRecords(n: number): string {
  return n === 1 ? "záznam" : n >= 2 && n <= 4 ? "záznamy" : "záznamů";
}
