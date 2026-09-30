import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { SchoolPeriod } from "@/constants/schoolYear";
import {
  buildNapadyQuestions,
  type NapadyLesson,
  type NapadyLevel,
  type NapadyProof,
  type NapadyPupil,
} from "@/lib/napady";

/**
 * Questions for Nápady: missing teacher levels in lessons taught in the
 * period, optionally for one class or subject. The list is loaded once per
 * filter; answers do not reshuffle the batch the teacher is working through.
 */
export function useNapadyQuestions(filters: { classId?: string; subjectId?: string; period: SchoolPeriod }) {
  const { user } = useAuth();
  const { classId, subjectId, period } = filters;
  return useQuery({
    queryKey: ["napady", classId ?? "", subjectId ?? "", period.from, period.to],
    queryFn: async () => {
      let query = supabase
        .from("lessons")
        .select(
          "id, title, month, date, status, class_id, classes(name), subjects(name), lesson_goals(educational_goals(title, evaluation_criteria(id, teacher_text, pupil_text, description, scale, position, sort_order)))",
        )
        .eq("status", "past");
      if (classId) query = query.eq("class_id", classId);
      if (subjectId) query = query.eq("subject_id", subjectId);
      const { data: lessons, error } = await query;
      if (error) throw error;
      const list = (lessons ?? []) as unknown as NapadyLesson[];

      const classIds = [...new Set(list.map((l) => l.class_id).filter(Boolean))] as string[];
      const lessonIds = list.map((l) => l.id);
      const criterionIds = list.flatMap((l) =>
        (l.lesson_goals ?? []).flatMap((lg) => (lg.educational_goals?.evaluation_criteria ?? []).map((c) => c.id)),
      );
      if (classIds.length === 0 || criterionIds.length === 0) return [];

      const [{ data: links, error: e1 }, { data: levels, error: e2 }, { data: proofs, error: e3 }] = await Promise.all([
        supabase.from("class_students").select("class_id, students(id, first_name, last_name)").in("class_id", classIds),
        supabase
          .from("current_criterion_levels")
          .select("student_id, criterion_id, source, level")
          .in("criterion_id", criterionIds),
        supabase
          .from("proofs_of_learning")
          .select("id, title, type, date, lesson_id, proof_students(student_id)")
          .in("lesson_id", lessonIds),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      if (e3) throw e3;

      const pupilsByClass = new Map<string, NapadyPupil[]>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const link of (links ?? []) as any[]) {
        if (!link.students) continue;
        pupilsByClass.set(link.class_id, [...(pupilsByClass.get(link.class_id) ?? []), link.students]);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const proofList: NapadyProof[] = ((proofs ?? []) as any[]).map((p) => ({
        ...p,
        studentIds: (p.proof_students ?? []).map((s: { student_id: string }) => s.student_id),
      }));
      return buildNapadyQuestions(list, pupilsByClass, (levels ?? []) as NapadyLevel[], proofList, period);
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
  });
}
