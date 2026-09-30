import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { SchoolPeriod } from "@/constants/schoolYear";
import { readinessFor, taughtInPeriod, type ReadinessResult } from "@/lib/readiness";

export type ProofKind = "text" | "voice" | "camera" | "file";

export interface ClassPupil {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string;
  svp: boolean;
}

export interface ClassOverviewRow {
  pupil: ClassPupil;
  proofs: Record<ProofKind, number>;
  readiness: ReadinessResult;
}

export interface ClassOverview {
  rows: ClassOverviewRow[];
  /** Lessons marked "probráno" in the period. */
  taughtLessons: number;
  taughtCriteria: number;
}

const EMPTY_COUNTS: Record<ProofKind, number> = { text: 0, voice: 0, camera: 0, file: 0 };

function inPeriod(date: string | null | undefined, period: Pick<SchoolPeriod, "from" | "to">): boolean {
  const day = (date ?? "").slice(0, 10);
  return !!day && day >= period.from && day <= period.to;
}

/**
 * Everything the class page shows for one period: each pupil's proofs by
 * type and the readiness semafor (zadání kap. 2.4, 4.4).
 *
 * A lesson counts as taught in the period when it is marked "probráno" and
 * its date, or failing that its month, falls into the period.
 */
export function useClassOverview(classId: string | undefined, period: SchoolPeriod) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["class_overview", classId, period.from, period.to],
    queryFn: async (): Promise<ClassOverview> => {
      const [{ data: links, error: e1 }, { data: lessons, error: e2 }] = await Promise.all([
        supabase.from("class_students").select("students(id, first_name, last_name, nickname, svp)").eq("class_id", classId!),
        supabase
          .from("lessons")
          .select("id, month, date, status, lesson_goals(educational_goals(evaluation_criteria(id)))")
          .eq("class_id", classId!)
          .eq("status", "past"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pupils = ((links ?? []) as any[]).map((l) => l.students).filter(Boolean) as ClassPupil[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { lessons: taught, criterionIds: taughtCriteria } = taughtInPeriod((lessons ?? []) as any[], period);

      const ids = pupils.map((p) => p.id);
      const [{ data: levels, error: e3 }, { data: proofLinks, error: e4 }] = await Promise.all([
        taughtCriteria.length && ids.length
          ? supabase
              .from("current_criterion_levels")
              .select("student_id, criterion_id")
              .eq("source", "teacher")
              .in("student_id", ids)
              .in("criterion_id", taughtCriteria)
          : Promise.resolve({ data: [], error: null }),
        ids.length
          ? supabase.from("proof_students").select("student_id, proofs_of_learning(type, date)").in("student_id", ids)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (e3) throw e3;
      if (e4) throw e4;

      const assessed = new Map<string, Set<string>>();
      for (const l of levels ?? []) {
        if (!assessed.has(l.student_id)) assessed.set(l.student_id, new Set());
        assessed.get(l.student_id)!.add(l.criterion_id);
      }
      const counts = new Map<string, Record<ProofKind, number>>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const link of (proofLinks ?? []) as any[]) {
        const proof = link.proofs_of_learning;
        if (!proof || !inPeriod(proof.date, period)) continue;
        const c = counts.get(link.student_id) ?? { ...EMPTY_COUNTS };
        if (proof.type in c) c[proof.type as ProofKind] += 1;
        counts.set(link.student_id, c);
      }

      const rows = pupils
        .map((pupil) => ({
          pupil,
          proofs: counts.get(pupil.id) ?? { ...EMPTY_COUNTS },
          readiness: readinessFor(taughtCriteria, assessed.get(pupil.id) ?? new Set()),
        }))
        .sort((a, b) => a.pupil.last_name.localeCompare(b.pupil.last_name, "cs"));

      return { rows, taughtLessons: taught.length, taughtCriteria: taughtCriteria.length };
    },
    enabled: !!user && !!classId,
  });
}

/** New pupils straight into a class; the database gives each a nickname. */
export function useAddPupilsToClass() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, pupils }: { classId: string; pupils: { first: string; last: string }[] }) => {
      const { data, error } = await supabase
        .from("students")
        .insert(pupils.map((p) => ({ first_name: p.first, last_name: p.last, teacher_id: user!.id })))
        .select("id");
      if (error) throw error;
      const { error: linkErr } = await supabase
        .from("class_students")
        .insert(data.map((s) => ({ class_id: classId, student_id: s.id })));
      if (linkErr) throw linkErr;
      return data.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class_overview"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["class_students"] });
      queryClient.invalidateQueries({ queryKey: ["all_class_students"] });
    },
  });
}
