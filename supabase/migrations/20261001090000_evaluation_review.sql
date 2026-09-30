-- Phase 9b: evaluations keep what the generator and the Rádce said
-- (zadání kap. 2.4 a 4.5).
--
-- * evaluation_groups.subject_id, .mode, .settings: the choices the teacher
--   made in the generator (subject, running feedback or school report, tone,
--   length, instructions), so a batch can be regenerated the same way.
-- * evaluations.sentences: the text sentence by sentence with the proofs and
--   levels each sentence was written from ("Napsáno z…").
-- * evaluations.review: the Rádce's comments on the latest version.
-- * evaluations.recommendations_outside: next steps a school report keeps
--   out of the text.
-- * evaluations.approved_at: when the teacher approved the text
--   (status draft → approved).
--
-- Safe to run more than once.

alter table public.evaluation_groups
  add column if not exists subject_id uuid references public.subjects(id) on delete set null,
  add column if not exists mode text,
  add column if not exists settings jsonb not null default '{}'::jsonb;

alter table public.evaluation_groups drop constraint if exists evaluation_groups_mode_check;
alter table public.evaluation_groups
  add constraint evaluation_groups_mode_check check (mode is null or mode in ('feedback', 'certificate'));

alter table public.evaluations
  add column if not exists sentences jsonb not null default '[]'::jsonb,
  add column if not exists review jsonb,
  add column if not exists recommendations_outside jsonb not null default '[]'::jsonb,
  add column if not exists approved_at timestamptz;

-- Old drafts waiting for the teacher are drafts.
update public.evaluations set status = 'draft' where status in ('waiting', 'none');
alter table public.evaluations alter column status set default 'draft';

create index if not exists evaluations_group_id_idx on public.evaluations (group_id);
