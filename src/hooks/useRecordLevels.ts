import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { JctuCode } from "@/constants/jctu";

/**
 * The teacher records a level on one criterion for one or more pupils
 * (zadání kap. 3, bod 2). Every entry is a new row in criterion_assessments,
 * so the history builds itself; "current" is the latest row.
 */
export function useRecordLevels() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentIds,
      criterionId,
      level,
      lessonId,
      note,
    }: {
      studentIds: string[];
      criterionId: string;
      level: JctuCode;
      lessonId: string | null;
      note?: string;
    }) => {
      const { error } = await supabase.from("criterion_assessments").insert(
        studentIds.map((studentId) => ({
          teacher_id: user!.id,
          student_id: studentId,
          criterion_id: criterionId,
          level,
          source: "teacher",
          lesson_id: lessonId,
          note: note ?? "",
        })),
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criterion_levels"] });
      queryClient.invalidateQueries({ queryKey: ["class_overview"] });
      queryClient.invalidateQueries({ queryKey: ["student_levels"] });
    },
  });
}
