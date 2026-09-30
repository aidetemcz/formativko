import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { JctuCode } from "@/constants/jctu";

export interface LessonExitTicket {
  id: string;
  source: "self_qr" | "self_paper";
  submitted_at: string;
  pupil_comment: string;
  teacher_comment: string;
  confirmed_by_teacher: boolean;
  proof_id: string | null;
  students: { id: string; first_name: string; last_name: string } | null;
  criterion_assessments: { criterion_id: string; level: JctuCode }[];
}

/** Exit tickets pupils handed in for a lesson, newest first. */
export function useLessonExitTickets(lessonId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["exit_tickets", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exit_tickets")
        .select(
          "id, source, submitted_at, pupil_comment, teacher_comment, confirmed_by_teacher, proof_id, students(id, first_name, last_name), criterion_assessments(criterion_id, level)",
        )
        .eq("lesson_id", lessonId!)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as unknown as LessonExitTicket[];
    },
    enabled: !!user && !!lessonId,
  });
}

export function useUpdateExitTicketComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, teacherComment }: { id: string; teacherComment: string }) => {
      const { error } = await supabase.from("exit_tickets").update({ teacher_comment: teacherComment }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exit_tickets"] }),
  });
}

export interface SelfAssessmentSession {
  id: string;
  token: string;
  expires_at: string;
}

/**
 * Open the online exit ticket for a lesson (zadání kap. 2.3). The token is
 * random and long; the session ends at the end of the day or when the teacher
 * closes it.
 */
export function useStartSelfAssessment() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (lessonId: string): Promise<SelfAssessmentSession> => {
      const { data, error } = await supabase
        .from("self_assessment_sessions")
        .insert({ teacher_id: user!.id, lesson_id: lessonId })
        .select("id, token, expires_at")
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCloseSelfAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("self_assessment_sessions")
        .update({ closed_at: new Date().toISOString() })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exit_tickets"] });
      queryClient.invalidateQueries({ queryKey: ["criterion_levels"] });
    },
  });
}

export interface ConfirmedPaperTicket {
  studentId: string;
  file: { path: string; name: string };
  levels: Record<string, JctuCode>;
  pupilComment: string;
  teacherComment: string;
}

/**
 * Save paper exit tickets the teacher has checked (zadání kap. 3, bod 5): the
 * photo as a proof, the ticket with source "self_paper", and the ticked steps
 * as the pupil's self-assessment, all marked as confirmed by the teacher.
 */
export function useSavePaperExitTickets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lessonId,
      goalId,
      tickets,
    }: {
      lessonId: string;
      goalId: string | null;
      tickets: ConfirmedPaperTicket[];
    }) => {
      const today = new Date().toISOString().slice(0, 10);
      for (const t of tickets) {
        const { data: proof, error: proofErr } = await supabase
          .from("proofs_of_learning")
          .insert({
            teacher_id: user!.id,
            title: `Exitka ${today}`,
            type: "camera",
            note: t.pupilComment,
            date: today,
            lesson_id: lessonId,
            file_url: t.file.path,
            file_name: t.file.name,
          })
          .select("id")
          .single();
        if (proofErr) throw proofErr;
        const { error: linkErr } = await supabase.from("proof_students").insert({ proof_id: proof.id, student_id: t.studentId });
        if (linkErr) throw linkErr;
        if (goalId) await supabase.from("proof_goals").insert({ proof_id: proof.id, goal_id: goalId });

        const { data: ticket, error: ticketErr } = await supabase
          .from("exit_tickets")
          .insert({
            teacher_id: user!.id,
            lesson_id: lessonId,
            student_id: t.studentId,
            source: "self_paper",
            proof_id: proof.id,
            pupil_comment: t.pupilComment,
            teacher_comment: t.teacherComment,
            confirmed_by_teacher: true,
          })
          .select("id")
          .single();
        if (ticketErr) throw ticketErr;

        const levels = Object.entries(t.levels);
        if (levels.length > 0) {
          const { error: levelErr } = await supabase.from("criterion_assessments").insert(
            levels.map(([criterionId, level]) => ({
              teacher_id: user!.id,
              student_id: t.studentId,
              criterion_id: criterionId,
              level,
              source: "self_paper",
              lesson_id: lessonId,
              proof_id: proof.id,
              exit_ticket_id: ticket.id,
              confirmed_by_teacher: true,
            })),
          );
          if (levelErr) throw levelErr;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exit_tickets"] });
      queryClient.invalidateQueries({ queryKey: ["criterion_levels"] });
      queryClient.invalidateQueries({ queryKey: ["student_levels"] });
      queryClient.invalidateQueries({ queryKey: ["proofs"] });
    },
  });
}
