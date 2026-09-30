import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { SchoolPeriod } from "@/constants/schoolYear";
import type { EvidenceItem, EvidenceKind } from "@/lib/evidence";

const LESSON = "lessons(id, title, class_id, subject_id, classes(name), subjects(name))";
const PROOF_KINDS: EvidenceKind[] = ["text", "camera", "voice", "file"];

/**
 * Everything recorded about pupils' learning in a period (zadání kap. 4.5,
 * Veroničin DukazyView): stored proofs and the teacher's levels on criteria.
 * Levels that came with a proof (a paper exit ticket) show as that proof.
 */
export function useEvidenceFeed(period: Pick<SchoolPeriod, "from" | "to">) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["evidence_feed", period.from, period.to],
    queryFn: async (): Promise<EvidenceItem[]> => {
      const [{ data: proofs, error: e1 }, { data: levels, error: e2 }] = await Promise.all([
        supabase
          .from("proofs_of_learning")
          .select(`id, title, type, date, note, file_url, file_name, proof_students(students(id, first_name, last_name)), ${LESSON}`)
          .gte("date", period.from)
          .lte("date", period.to),
        supabase
          .from("criterion_assessments")
          .select(
            `id, level, source, assessed_at, note, proof_id, students(id, first_name, last_name), evaluation_criteria(teacher_text, pupil_text, description), ${LESSON}`,
          )
          .is("proof_id", null)
          .gte("assessed_at", `${period.from}T00:00:00`)
          .lte("assessed_at", `${period.to}T23:59:59`),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fromProofs: EvidenceItem[] = ((proofs ?? []) as any[]).map((p) => ({
        key: `proof:${p.id}`,
        id: p.id,
        kind: (PROOF_KINDS.includes(p.type) ? p.type : "text") as EvidenceKind,
        date: p.date,
        pupils: (p.proof_students ?? []).map((s) => s.students).filter(Boolean),
        lesson: p.lessons ?? null,
        title: p.title,
        note: p.note ?? "",
        file: p.file_url ? { url: p.file_url, name: p.file_name } : null,
        level: null,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fromLevels: EvidenceItem[] = ((levels ?? []) as any[]).map((l) => {
        const c = l.evaluation_criteria;
        return {
          key: `level:${l.id}`,
          id: l.id,
          kind: "level" as const,
          date: l.assessed_at.slice(0, 10),
          pupils: l.students ? [l.students] : [],
          lesson: l.lessons ?? null,
          title: "",
          note: l.note ?? "",
          file: null,
          level: { code: l.level, criterion: c?.teacher_text || c?.pupil_text || c?.description || "", source: l.source },
        };
      });
      return [...fromProofs, ...fromLevels];
    },
    enabled: !!user,
  });
}

/** Remove one level entry; the pupil's previous level becomes the current one again. */
export function useDeleteAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("criterion_assessments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidence_feed"] });
      queryClient.invalidateQueries({ queryKey: ["criterion_levels"] });
      queryClient.invalidateQueries({ queryKey: ["class_overview"] });
      queryClient.invalidateQueries({ queryKey: ["student_levels"] });
    },
  });
}
