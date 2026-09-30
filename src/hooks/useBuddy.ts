import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";
import { fetchLessonDetail, saveLessonCriteria, saveLessonGoal } from "@/hooks/usePlanLessons";
import {
  snapshotChanges,
  snapshotOf,
  withTitleAndMonth,
  type BuddyContext,
  type BuddyMessage,
  type LessonSnapshot,
  type Proposal,
  type ProposalStatus,
  type SearchHit,
} from "@/lib/buddy";
import type { JctuScale } from "@/constants/jctu";

export interface BuddyConversation {
  id: string;
  title: string;
  context: BuddyContext | Record<string, never>;
  updated_at: string;
}

export function useBuddyConversations(limit = 8) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["buddy_conversations", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buddy_conversations")
        .select("id, title, context, updated_at")
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as unknown as BuddyConversation[];
    },
    enabled: !!user,
  });
}

export function useBuddyConversation(id: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["buddy_conversation", id],
    queryFn: async () => {
      const [{ data: conv, error: e1 }, { data: messages, error: e2 }] = await Promise.all([
        supabase.from("buddy_conversations").select("id, title, context, updated_at").eq("id", id!).maybeSingle(),
        supabase
          .from("buddy_messages")
          .select("id, role, content, data, created_at")
          .eq("conversation_id", id!)
          .in("role", ["user", "assistant"])
          .order("created_at"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { conversation: conv as unknown as BuddyConversation | null, messages: (messages ?? []) as unknown as BuddyMessage[] };
    },
    enabled: !!user && !!id,
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("buddy_conversations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["buddy_conversations"] }),
  });
}

/** Direct results while the teacher types (zadání kap. 5.2, bod 1). */
export function useSearchEverything(query: string) {
  const { user } = useAuth();
  const q = query.trim();
  return useQuery({
    queryKey: ["search_everything", q],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_everything", { q, per_kind: 4 });
      if (error) throw error;
      return (data ?? []) as SearchHit[];
    },
    enabled: !!user && q.length >= 2,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

// ─── Saving what Buddy proposed ──────────────────────────────────────────────

/**
 * Bring a lesson to `target` through the same writes the lesson page uses, and
 * record the change in the lesson's history so it can be undone.
 */
export async function applyLessonSnapshot(
  teacherId: string,
  lessonId: string,
  target: LessonSnapshot,
  changedBy: "teacher" | "buddy",
  summary: string,
): Promise<void> {
  const lesson = await fetchLessonDetail(lessonId);
  const before = snapshotOf(lesson);
  const changes = snapshotChanges(before, target);

  if (Object.keys(changes.info).length > 0) {
    const { error } = await supabase.from("lessons").update(changes.info).eq("id", lessonId);
    if (error) throw error;
  }
  let goalId = lesson.goal?.id ?? null;
  if (changes.goal) {
    goalId = await saveLessonGoal(teacherId, { lesson, goalId, teacher: changes.goal.teacher, pupil: changes.goal.pupil });
  }
  if (changes.criteria) {
    if (!goalId) throw new Error("Lekce nemá cíl, ke kterému by šla kritéria uložit.");
    await saveLessonCriteria({
      goalId,
      existingIds: lesson.criteria.map((c) => c.id),
      criteria: changes.criteria.map((c, i) => ({
        teacher: c.teacher,
        pupil: c.pupil,
        scale: (c.scale as JctuScale) ?? null,
        svp_variants: lesson.criteria[i]?.svp_variants ?? [],
      })),
    });
  }
  const { error } = await supabase.from("lesson_revisions").insert({
    lesson_id: lessonId,
    teacher_id: teacherId,
    changed_by: changedBy,
    summary,
    before: before as unknown as Json,
    after: target as unknown as Json,
  });
  if (error) throw error;
}

async function createLessonFromSnapshot(teacherId: string, planId: string, target: LessonSnapshot, summary: string): Promise<string> {
  const { data: plan, error: planErr } = await supabase.from("courses").select("id, class_id, subject_id").eq("id", planId).single();
  if (planErr) throw planErr;
  const { count } = await supabase.from("lessons").select("id", { count: "exact", head: true }).eq("course_id", planId);
  const { data: lesson, error } = await supabase
    .from("lessons")
    .insert({
      teacher_id: teacherId,
      course_id: plan.id,
      class_id: plan.class_id,
      subject_id: plan.subject_id,
      title: target.title,
      description: target.description,
      month: target.month,
      hours: target.hours,
      planned_activities: target.planned_activities,
      position: (count ?? 0) + 1,
      status: "prepared",
    })
    .select("id")
    .single();
  if (error) throw error;
  if (target.goal) {
    // The new lesson starts empty; saving its goal and criteria goes the usual way.
    const detail = await fetchLessonDetail(lesson.id);
    const goalId = await saveLessonGoal(teacherId, { lesson: detail, goalId: null, teacher: target.goal.teacher, pupil: target.goal.pupil });
    if (target.criteria.length) {
      await saveLessonCriteria({
        goalId,
        existingIds: [],
        criteria: target.criteria.map((c) => ({ teacher: c.teacher, pupil: c.pupil, scale: (c.scale as JctuScale) ?? null, svp_variants: [] })),
      });
    }
  }
  const { error: revErr } = await supabase.from("lesson_revisions").insert({
    lesson_id: lesson.id,
    teacher_id: teacherId,
    changed_by: "buddy",
    summary: summary || "Nová lekce od Buddyho",
    before: null,
    after: target as unknown as Json,
  });
  if (revErr) throw revErr;
  return lesson.id as string;
}

async function setProposalStatus(messageId: string, proposalId: string, status: ProposalStatus) {
  const { data, error } = await supabase.from("buddy_messages").select("data").eq("id", messageId).single();
  if (error) throw error;
  const current = (data?.data ?? {}) as { proposals?: Proposal[] };
  const proposals = (current.proposals ?? []).map((p) => (p.id === proposalId ? { ...p, status } : p));
  const { error: upErr } = await supabase
    .from("buddy_messages")
    .update({ data: { ...current, proposals } as unknown as Json })
    .eq("id", messageId);
  if (upErr) throw upErr;
}

function invalidateAfterSave(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of ["lesson_detail", "plan_lessons", "goals", "lesson_revisions", "buddy_conversation"]) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}

/** Save a proposal after the teacher clicked "Uložit" (zadání kap. 5.2, bod 3). Returns the lesson to open, if any. */
export function useSaveProposal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, proposal }: { messageId: string | null; proposal: Proposal }): Promise<string | null> => {
      let lessonId: string | null = null;
      if (proposal.type === "lesson_update") {
        await applyLessonSnapshot(user!.id, proposal.lesson_id, proposal.after, "buddy", proposal.summary);
        lessonId = proposal.lesson_id;
      } else if (proposal.type === "lesson_create") {
        lessonId = await createLessonFromSnapshot(user!.id, proposal.plan_id, proposal.after, proposal.summary);
      } else {
        for (const item of proposal.items) {
          const current = snapshotOf(await fetchLessonDetail(item.lesson_id));
          await applyLessonSnapshot(user!.id, item.lesson_id, withTitleAndMonth(current, item.after), "buddy", proposal.summary);
        }
      }
      if (messageId) await setProposalStatus(messageId, proposal.id, "saved");
      return lessonId;
    },
    onSuccess: () => invalidateAfterSave(queryClient),
  });
}

export function useDiscardProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, proposalId }: { messageId: string; proposalId: string }) =>
      setProposalStatus(messageId, proposalId, "discarded"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["buddy_conversation"] }),
  });
}

// ─── Lesson history ──────────────────────────────────────────────────────────

export interface LessonRevision {
  id: string;
  changed_by: "teacher" | "buddy";
  summary: string;
  before: LessonSnapshot | null;
  after: LessonSnapshot;
  created_at: string;
}

export function useLessonRevisions(lessonId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lesson_revisions", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_revisions")
        .select("id, changed_by, summary, before, after, created_at")
        .eq("lesson_id", lessonId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as LessonRevision[];
    },
    enabled: !!user && !!lessonId,
  });
}

/** Undo one change: put the lesson back as it was before it. The undo is itself a history entry. */
export function useRevertRevision() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, revision }: { lessonId: string; revision: LessonRevision }) => {
      if (!revision.before) throw new Error("Lekci vytvořil Buddy. Pokud ji nechcete, smažte ji.");
      await applyLessonSnapshot(user!.id, lessonId, revision.before, "teacher", `Vráceno: ${revision.summary}`.trim());
    },
    onSuccess: () => invalidateAfterSave(queryClient),
  });
}
