import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { JctuCode } from "@/constants/jctu";

export interface StudentCriterionLevel {
  criterionId: string;
  criterion: string;
  goal: string;
  lesson: { id: string; title: string } | null;
  teacher: { level: JctuCode; at: string } | null;
  self: { level: JctuCode; at: string } | null;
}

/**
 * A pupil's latest levels per criterion: the teacher's and the pupil's own
 * (zadání kap. 2.4, 4.4). Grouped by lesson on screen.
 */
export function useStudentLevels(studentId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["student_levels", studentId],
    queryFn: async (): Promise<StudentCriterionLevel[]> => {
      const { data: levels, error } = await supabase
        .from("current_criterion_levels")
        .select("criterion_id, source, level, assessed_at")
        .eq("student_id", studentId!);
      if (error) throw error;
      const ids = [...new Set((levels ?? []).map((l) => l.criterion_id))];
      if (ids.length === 0) return [];

      const { data: criteria, error: e2 } = await supabase
        .from("evaluation_criteria")
        .select("id, teacher_text, description, position, sort_order, educational_goals(title, lesson_goals(lessons(id, title)))")
        .in("id", ids);
      if (e2) throw e2;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((criteria ?? []) as any[])
        .map((c) => {
          const mine = (levels ?? []).filter((l) => l.criterion_id === c.id);
          const teacher = mine.find((l) => l.source === "teacher");
          const self = mine
            .filter((l) => l.source !== "teacher")
            .sort((a, b) => b.assessed_at.localeCompare(a.assessed_at))[0];
          const lesson = c.educational_goals?.lesson_goals?.[0]?.lessons ?? null;
          return {
            criterionId: c.id,
            criterion: c.teacher_text || c.description,
            goal: c.educational_goals?.title ?? "",
            lesson,
            position: c.position ?? c.sort_order + 1,
            teacher: teacher ? { level: teacher.level as JctuCode, at: teacher.assessed_at } : null,
            self: self ? { level: self.level as JctuCode, at: self.assessed_at } : null,
          };
        })
        .sort((a, b) => a.goal.localeCompare(b.goal, "cs") || a.position - b.position);
    },
    enabled: !!user && !!studentId,
  });
}

export interface StudentEvaluation {
  id: string;
  group_id: string | null;
  subject: string;
  period: string;
  status: string;
  text: string | null;
  created_at: string;
}

/** Earlier written evaluations of a pupil, newest first. */
export function useStudentEvaluations(studentId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["student_evaluations", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluations")
        .select("id, group_id, subject, period, status, text, created_at")
        .eq("student_id", studentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StudentEvaluation[];
    },
    enabled: !!user && !!studentId,
  });
}
