import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";
import { planCriteriaUpdate } from "@/lib/criteriaDiff";
import { JCTU_LEVELS, type JctuCode, type JctuScale } from "@/constants/jctu";
import { monthOrder } from "@/constants/schoolYear";

/**
 * Lessons of the new version: they live in a thematic plan (a course) and
 * each has one goal with its criteria (zadání kap. 4.3, rozhodnutí 8.1).
 *
 * Not behind LESSONS_ENABLED — that flag keeps the old stand-alone lesson
 * pages hidden; these lessons replace them.
 */

export interface PlanLesson {
  id: string;
  title: string;
  description: string;
  month: string | null;
  hours: number | null;
  position: number | null;
  rvp_outcome: string | null;
  status: string;
  course_id: string | null;
  class_id: string | null;
  subject_id: string | null;
}

export interface LessonGoal {
  id: string;
  title: string;
  pupil_text: string;
}

export interface LessonCriterion {
  id: string;
  teacher_text: string | null;
  description: string;
  pupil_text: string | null;
  scale: JctuScale | null;
  svp_variants: { need: string; text: string }[];
  position: number | null;
  sort_order: number;
}

export interface LessonDetail extends PlanLesson {
  /** How the lesson goes, step by step (the teacher's or Buddy's plan). */
  planned_activities: string;
  courses: {
    id: string;
    name: string;
    classes: { id: string; name: string } | null;
    subjects: { id: string; name: string } | null;
  } | null;
  goal: LessonGoal | null;
  criteria: LessonCriterion[];
}

/** Lessons of one plan, ordered by school month and then by position. */
export function sortLessons<T extends { month: string | null; position: number | null; title: string }>(lessons: T[]): T[] {
  return [...lessons].sort(
    (a, b) =>
      monthOrder(a.month) - monthOrder(b.month) ||
      (a.position ?? 1e9) - (b.position ?? 1e9) ||
      a.title.localeCompare(b.title, "cs"),
  );
}

export function usePlanLessons(courseId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["plan_lessons", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title, description, month, hours, position, rvp_outcome, status, course_id, class_id, subject_id, lesson_goals(educational_goals(id, title))")
        .eq("course_id", courseId!);
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return sortLessons(data as any[]).map((l) => ({
        ...(l as PlanLesson),
        goalTitle: (l.lesson_goals?.[0]?.educational_goals?.title as string | undefined) ?? null,
      }));
    },
    enabled: !!user && !!courseId,
  });
}

export function useCreatePlanLesson() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      course: { id: string; class_id: string; subject_id: string };
      title: string;
      month: string | null;
      hours: number | null;
      description: string;
      position: number;
    }) => {
      const { data, error } = await supabase
        .from("lessons")
        .insert({
          teacher_id: user!.id,
          course_id: input.course.id,
          class_id: input.course.class_id,
          subject_id: input.course.subject_id,
          title: input.title,
          month: input.month,
          hours: input.hours,
          description: input.description,
          position: input.position,
          status: "prepared",
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => queryClient.invalidateQueries({ queryKey: ["plan_lessons", input.course.id] }),
  });
}

/** One lesson with its plan, goal and criteria in order. */
export async function fetchLessonDetail(lessonId: string): Promise<LessonDetail> {
  const { data, error } = await supabase
    .from("lessons")
    .select(
      "id, title, description, month, hours, position, rvp_outcome, status, planned_activities, course_id, class_id, subject_id, courses(id, name, classes(id, name), subjects(id, name)), lesson_goals(educational_goals(id, title, pupil_text, evaluation_criteria(id, teacher_text, description, pupil_text, scale, svp_variants, position, sort_order)))",
    )
    .eq("id", lessonId)
    .single();
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  // One goal per lesson; an older lesson linked to several shows the first.
  const goal = row.lesson_goals?.[0]?.educational_goals ?? null;
  const criteria = ((goal?.evaluation_criteria ?? []) as LessonCriterion[]).sort(
    (a, b) => (a.position ?? a.sort_order + 1) - (b.position ?? b.sort_order + 1),
  );
  return {
    ...row,
    goal: goal ? { id: goal.id, title: goal.title, pupil_text: goal.pupil_text ?? "" } : null,
    criteria,
  };
}

export function useLessonDetail(lessonId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lesson_detail", lessonId],
    queryFn: () => fetchLessonDetail(lessonId!),
    enabled: !!user && !!lessonId,
  });
}

function invalidateLesson(queryClient: ReturnType<typeof useQueryClient>, lessonId: string) {
  queryClient.invalidateQueries({ queryKey: ["lesson_detail", lessonId] });
  queryClient.invalidateQueries({ queryKey: ["plan_lessons"] });
  queryClient.invalidateQueries({ queryKey: ["goals"] });
}

export function useUpdateLessonInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...fields
    }: {
      id: string;
      title?: string;
      description?: string;
      month?: string | null;
      hours?: number | null;
      rvp_outcome?: string | null;
      status?: string;
      planned_activities?: string;
    }) => {
      const { error } = await supabase.from("lessons").update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => invalidateLesson(queryClient, v.id),
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plan_lessons"] }),
  });
}

type GoalLesson = Pick<LessonDetail, "id" | "class_id" | "subject_id" | "course_id" | "courses">;

/** Save the lesson's one goal: create and link it, or update it in place. */
export async function saveLessonGoal(
  teacherId: string,
  { lesson, goalId, teacher, pupil }: { lesson: GoalLesson; goalId: string | null; teacher: string; pupil: string },
): Promise<string> {
  if (goalId) {
    const { error } = await supabase.from("educational_goals").update({ title: teacher, pupil_text: pupil }).eq("id", goalId);
    if (error) throw error;
    return goalId;
  }
  const classId = lesson.class_id ?? lesson.courses?.classes?.id;
  const { data: goal, error } = await supabase
    .from("educational_goals")
    .insert({
      teacher_id: teacherId,
      class_id: classId!,
      subject_id: lesson.subject_id ?? lesson.courses?.subjects?.id ?? null,
      course_id: lesson.course_id,
      title: teacher,
      description: "",
      pupil_text: pupil,
    })
    .select("id")
    .single();
  if (error) throw error;
  const { error: linkErr } = await supabase.from("lesson_goals").insert({ lesson_id: lesson.id, goal_id: goal.id });
  if (linkErr) throw linkErr;
  return goal.id as string;
}

export function useSaveLessonGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { lesson: GoalLesson; goalId: string | null; teacher: string; pupil: string }) =>
      saveLessonGoal(user!.id, args),
    onSuccess: (_, v) => invalidateLesson(queryClient, v.lesson.id),
  });
}

export interface CriterionDraft {
  teacher: string;
  pupil: string;
  scale: JctuScale | null;
  svp_variants: { need: string; text: string }[];
}

/**
 * Level names written into the legacy `level_descriptors`, so the old capture
 * tool and course overview keep working with these criteria until phase 7.
 */
const LEGACY_LEVEL_DESCRIPTORS = JCTU_LEVELS.map((l) => ({ level: l.label, description: l.pupil }));

export function criterionRow(c: CriterionDraft, index: number) {
  return {
    description: c.teacher,
    teacher_text: c.teacher,
    pupil_text: c.pupil || null,
    scale: (c.scale as unknown as Json) ?? null,
    svp_variants: (c.svp_variants ?? []) as unknown as Json,
    position: index + 1,
    sort_order: index,
    level_descriptors: LEGACY_LEVEL_DESCRIPTORS as unknown as Json,
  };
}

/**
 * Save the goal's criteria. Criteria that keep their place are updated in
 * place, because pupils' levels hang off a criterion's id.
 */
export async function saveLessonCriteria({
  goalId,
  existingIds,
  criteria,
}: {
  goalId: string;
  existingIds: string[];
  criteria: CriterionDraft[];
}): Promise<void> {
  const plan = planCriteriaUpdate(existingIds, criteria);
  for (const [i, { id, value }] of plan.updates.entries()) {
    const { error } = await supabase.from("evaluation_criteria").update(criterionRow(value, i)).eq("id", id);
    if (error) throw error;
  }
  if (plan.inserts.length > 0) {
    const offset = plan.updates.length;
    const { error } = await supabase
      .from("evaluation_criteria")
      .insert(plan.inserts.map((c, i) => ({ goal_id: goalId, ...criterionRow(c, offset + i) })));
    if (error) throw error;
  }
  if (plan.deleteIds.length > 0) {
    const { error } = await supabase.from("evaluation_criteria").delete().in("id", plan.deleteIds);
    if (error) throw error;
  }
}

export function useSaveLessonCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId: _lessonId, ...args }: { lessonId: string; goalId: string; existingIds: string[]; criteria: CriterionDraft[] }) =>
      saveLessonCriteria(args),
    onSuccess: (_, v) => invalidateLesson(queryClient, v.lessonId),
  });
}

/** Add several lessons to a plan at once (rows read from a thematic plan). */
export function useAddPlanLessons() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      course,
      rows,
      startPosition,
      sourceText,
    }: {
      course: { id: string; class_id: string; subject_id: string };
      rows: { title: string; description: string; month: string | null; hours: number | null; rvp_outcome: string | null }[];
      startPosition: number;
      sourceText?: string;
    }) => {
      const { error } = await supabase.from("lessons").insert(
        rows.map((r, i) => ({
          teacher_id: user!.id,
          course_id: course.id,
          class_id: course.class_id,
          subject_id: course.subject_id,
          title: r.title,
          description: r.description,
          month: r.month,
          hours: r.hours,
          rvp_outcome: r.rvp_outcome,
          position: startPosition + i,
          status: "prepared",
        })),
      );
      if (error) throw error;
      if (sourceText) {
        // Where the plan came from (zadání kap. 2.3, courses.source_text).
        await supabase.from("courses").update({ source_text: sourceText }).eq("id", course.id);
      }
    },
    onSuccess: (_, v) => queryClient.invalidateQueries({ queryKey: ["plan_lessons", v.course.id] }),
  });
}

export interface CurrentLevel {
  student_id: string;
  criterion_id: string;
  source: "teacher" | "self_qr" | "self_paper";
  level: JctuCode;
  assessed_at: string;
}

/** Latest levels (teacher and self-assessment) for the given criteria. */
export function useCriterionLevels(criterionIds: string[]) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["criterion_levels", criterionIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("current_criterion_levels")
        .select("student_id, criterion_id, source, level, assessed_at")
        .in("criterion_id", criterionIds);
      if (error) throw error;
      return data as CurrentLevel[];
    },
    enabled: !!user && criterionIds.length > 0,
  });
}
