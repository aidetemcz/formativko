-- Phase 10: TinyBuddy (zadání kap. 5).
--
-- * search_everything(): one full-text-ish search over what the teacher made
--   (lessons with their goal and criteria, plans, pupils by name and
--   nickname, classes, proofs, evaluations). Accents and case do not matter.
--   It runs with the caller's rights: in the browser RLS limits it to the
--   teacher; the Buddy endpoint calls it with the service role and passes
--   the teacher's id.
-- * buddy_messages.data: what an answer carried besides text — search
--   results to click, change proposals and whether the teacher saved them.
-- * lesson_revisions: every change Buddy made to a lesson (and every undo),
--   with the lesson before and after, so it can be reverted.
--
-- Safe to run more than once.

create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;

create or replace function public.f_unaccent(value text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, value) $$;

-- ---------------------------------------------------------------------------
-- Messages keep their extras
-- ---------------------------------------------------------------------------

alter table public.buddy_messages
  add column if not exists data jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- Lesson history
-- ---------------------------------------------------------------------------

create table if not exists public.lesson_revisions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  changed_by text not null check (changed_by in ('teacher', 'buddy')),
  summary text not null default '',
  before jsonb,
  after jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists lesson_revisions_lesson_idx
  on public.lesson_revisions (lesson_id, created_at desc);

alter table public.lesson_revisions enable row level security;

drop policy if exists "Teachers manage own lesson revisions" on public.lesson_revisions;
create policy "Teachers manage own lesson revisions" on public.lesson_revisions
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Search
-- ---------------------------------------------------------------------------

create or replace function public.search_everything(q text, p_teacher uuid default null, per_kind int default 5)
returns table (kind text, id uuid, title text, subtitle text, link_id uuid)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  t uuid := coalesce(auth.uid(), p_teacher);
  pattern text;
begin
  if t is null or coalesce(trim(q), '') = '' then
    return;
  end if;
  pattern := '%' || lower(public.f_unaccent(trim(q))) || '%';

  return query
  (select 'lesson'::text, l.id, l.title,
          concat_ws(' · ', c.name, cl.name, l.month),
          null::uuid
     from lessons l
     left join courses c on c.id = l.course_id
     left join classes cl on cl.id = l.class_id
    where l.teacher_id = t
      and (
        lower(public.f_unaccent(l.title || ' ' || coalesce(l.description, '') || ' ' || coalesce(l.planned_activities, ''))) like pattern
        or exists (
          select 1
            from lesson_goals lg
            join educational_goals g on g.id = lg.goal_id
            left join evaluation_criteria ec on ec.goal_id = g.id
           where lg.lesson_id = l.id
             and lower(public.f_unaccent(
                   g.title || ' ' || coalesce(g.pupil_text, '') || ' ' ||
                   coalesce(ec.teacher_text, '') || ' ' || coalesce(ec.pupil_text, '') || ' ' || coalesce(ec.description, '')
                 )) like pattern
        )
      )
    order by (lower(public.f_unaccent(l.title)) like pattern) desc, l.title
    limit per_kind)
  union all
  (select 'plan'::text, c.id, c.name,
          concat_ws(' · ', s.name, cl.name),
          null::uuid
     from courses c
     left join subjects s on s.id = c.subject_id
     left join classes cl on cl.id = c.class_id
    where c.teacher_id = t
      and lower(public.f_unaccent(c.name)) like pattern
    order by c.name
    limit per_kind)
  union all
  (select 'student'::text, st.id, st.first_name || ' ' || st.last_name,
          st.nickname,
          null::uuid
     from students st
    where st.teacher_id = t
      and lower(public.f_unaccent(st.first_name || ' ' || st.last_name || ' ' || st.last_name || ' ' || st.first_name || ' ' || coalesce(st.nickname, ''))) like pattern
    order by st.last_name, st.first_name
    limit per_kind)
  union all
  (select 'class'::text, cl.id, cl.name,
          null::text,
          null::uuid
     from classes cl
    where cl.teacher_id = t
      and lower(public.f_unaccent(cl.name)) like pattern
    order by cl.name
    limit per_kind)
  union all
  (select 'proof'::text, p.id, p.title,
          concat_ws(' · ', to_char(p.date, 'DD. MM. YYYY'), left(coalesce(p.note, ''), 80)),
          (select ps.student_id from proof_students ps where ps.proof_id = p.id limit 1)
     from proofs_of_learning p
    where p.teacher_id = t
      and lower(public.f_unaccent(p.title || ' ' || coalesce(p.note, ''))) like pattern
    order by p.date desc
    limit per_kind)
  union all
  (select 'evaluation'::text, e.id, st.first_name || ' ' || st.last_name,
          concat_ws(' · ', eg.name, e.period),
          e.group_id
     from evaluations e
     join students st on st.id = e.student_id
     left join evaluation_groups eg on eg.id = e.group_id
    where e.teacher_id = t
      and e.group_id is not null
      and lower(public.f_unaccent(coalesce(e.text, '') || ' ' || st.first_name || ' ' || st.last_name)) like pattern
    order by e.created_at desc
    limit per_kind);
end;
$$;

revoke all on function public.search_everything(text, uuid, int) from public, anon;
grant execute on function public.search_everything(text, uuid, int) to authenticated, service_role;
