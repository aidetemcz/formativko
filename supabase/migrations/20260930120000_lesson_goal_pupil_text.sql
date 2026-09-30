-- Phase 5: lessons inside thematic plans.
--
-- A lesson has exactly one goal (zadání kap. 8.1), linked through
-- lesson_goals. The exit ticket opens with the goal in the pupil's words
-- ("Dnes se učím…"), which the goal did not have a place for.

alter table public.educational_goals
  add column if not exists pupil_text text not null default '';

-- The old policy checked only that the lesson was the teacher's, so a lesson
-- could be linked to another teacher's goal. Both ends are checked now.
drop policy if exists "Teachers manage own lesson_goals" on public.lesson_goals;
create policy "Teachers manage own lesson_goals" on public.lesson_goals
  for all
  using (exists (
    select 1 from public.lessons l where l.id = lesson_id and l.teacher_id = auth.uid()
  ))
  with check (
    exists (select 1 from public.lessons l where l.id = lesson_id and l.teacher_id = auth.uid())
    and exists (select 1 from public.educational_goals g where g.id = goal_id and g.teacher_id = auth.uid())
  );
