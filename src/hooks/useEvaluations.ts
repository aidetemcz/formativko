import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";
import type { EvaluationSentence, EvaluationMode, EvaluationReview, EvaluationSettings } from "@/lib/evaluations";

/**
 * Written evaluations (zadání kap. 4.5). A batch (`evaluation_groups`) is one
 * run of the generator for a class and period; it holds one evaluation per
 * pupil. Each evaluation moves from draft to approved; only an approved text
 * is meant to be copied or exported.
 */

export interface EvaluationBatchSummary {
  id: string;
  name: string;
  mode: EvaluationMode | null;
  type: string;
  date_from: string | null;
  date_to: string | null;
  created_at: string;
  classes: { id: string; name: string } | null;
  subjects: { id: string; name: string } | null;
  evaluations: { id: string; status: string }[];
}

export interface BatchEvaluation {
  id: string;
  student_id: string;
  status: string;
  text: string;
  period: string;
  sentences: EvaluationSentence[];
  review: EvaluationReview | null;
  recommendations_outside: string[];
  approved_at: string | null;
  updated_at: string;
  students: { id: string; first_name: string; last_name: string } | null;
}

export interface EvaluationBatch {
  id: string;
  name: string;
  mode: EvaluationMode | null;
  type: string;
  date_from: string | null;
  date_to: string | null;
  created_at: string;
  settings: EvaluationSettings;
  class_id: string | null;
  subject_id: string | null;
  classes: { id: string; name: string } | null;
  subjects: { id: string; name: string } | null;
  evaluations: BatchEvaluation[];
}

export function useEvaluationBatches() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["evaluation_groups", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_groups")
        .select("id, name, mode, type, date_from, date_to, created_at, classes(id, name), subjects(id, name), evaluations(id, status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as EvaluationBatchSummary[];
    },
    enabled: !!user,
  });
}

export function useEvaluationBatch(groupId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["evaluations", "group", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_groups")
        .select(
          "id, name, mode, type, date_from, date_to, created_at, settings, class_id, subject_id, classes(id, name), subjects(id, name), evaluations(id, student_id, status, text, period, sentences, review, recommendations_outside, approved_at, updated_at, students(id, first_name, last_name))",
        )
        .eq("id", groupId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const batch = data as unknown as EvaluationBatch;
      batch.evaluations = [...batch.evaluations].sort((a, b) =>
        (a.students?.last_name ?? "").localeCompare(b.students?.last_name ?? "", "cs"),
      );
      return batch;
    },
    enabled: !!user && !!groupId,
  });
}

/** Start a batch: the group and an empty draft for every chosen pupil. */
export function useCreateEvaluationBatch() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      mode: EvaluationMode;
      classId: string;
      subjectId: string | null;
      subjectName: string;
      dateFrom: string;
      dateTo: string;
      periodLabel: string;
      settings: EvaluationSettings;
      studentIds: string[];
    }) => {
      const { data: group, error } = await supabase
        .from("evaluation_groups")
        .insert({
          teacher_id: user!.id,
          name: input.name,
          type: input.mode === "certificate" ? "vysvedceni" : "prubezna",
          mode: input.mode,
          class_id: input.classId,
          subject_id: input.subjectId,
          date_from: input.dateFrom,
          date_to: input.dateTo,
          settings: input.settings as unknown as Json,
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: evErr } = await supabase.from("evaluations").insert(
        input.studentIds.map((studentId) => ({
          teacher_id: user!.id,
          group_id: group.id,
          student_id: studentId,
          subject: input.subjectName || "Hodnocení",
          period: input.periodLabel,
          text: "",
          status: "draft",
        })),
      );
      if (evErr) throw evErr;
      return group.id as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation_groups"] });
      queryClient.invalidateQueries({ queryKey: ["student_evaluations"] });
    },
  });
}

export function useUpdateEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: {
      id: string;
      text?: string;
      status?: string;
      sentences?: EvaluationSentence[];
      review?: EvaluationReview | null;
      recommendations_outside?: string[];
    }) => {
      const update: Record<string, unknown> = { ...patch };
      if (patch.status === "approved") update.approved_at = new Date().toISOString();
      if (patch.status && patch.status !== "approved") update.approved_at = null;
      const { error } = await supabase.from("evaluations").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["evaluation_groups"] });
      queryClient.invalidateQueries({ queryKey: ["student_evaluations"] });
    },
  });
}

export function useDeleteEvaluationGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error: evErr } = await supabase.from("evaluations").delete().eq("group_id", groupId);
      if (evErr) throw evErr;
      const { error } = await supabase.from("evaluation_groups").delete().eq("id", groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation_groups"] });
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["student_evaluations"] });
    },
  });
}

/** The proofs and levels an evaluation's sentences were written from. */
export function useEvaluationSources(proofIds: string[], assessmentIds: string[]) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["evaluation_sources", proofIds, assessmentIds],
    queryFn: async () => {
      const [{ data: proofs, error: e1 }, { data: levels, error: e2 }] = await Promise.all([
        proofIds.length
          ? supabase.from("proofs_of_learning").select("id, title, type, date, note").in("id", proofIds)
          : Promise.resolve({ data: [], error: null }),
        assessmentIds.length
          ? supabase
              .from("criterion_assessments")
              .select("id, level, source, assessed_at, evaluation_criteria(teacher_text, pupil_text, description)")
              .in("id", assessmentIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { proofs: proofs ?? [], levels: levels ?? [] };
    },
    enabled: !!user && proofIds.length + assessmentIds.length > 0,
  });
}
