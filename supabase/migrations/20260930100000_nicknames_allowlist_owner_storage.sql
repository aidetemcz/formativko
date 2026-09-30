-- Phase 1 of the new version: pupil nicknames, closed registration and
-- owner-only storage.

-- =============================================================================
-- 1. Nicknames
-- =============================================================================
-- An AI model only ever sees a pupil under a nickname ("Modrá vydra"); the real
-- name never leaves the app. A nickname is generated here, in the database, the
-- moment a pupil is inserted — locally, with no AI — so every path that creates
-- a pupil gets one. It is unique per teacher and the teacher may change it.
--
-- The adjectives are deliberately neutral (colours, patterns, places): the
-- nickname is part of the prompt that writes an evaluation, and "Chytrá vydra"
-- or "Pomalý ježek" would colour what the model writes about the child.

alter table public.students add column if not exists nickname text;

create or replace function public.generate_student_nickname(p_teacher_id uuid)
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  -- Stems of hard adjectives: the ending is added to agree with the animal's
  -- gender (-ý masculine, -á feminine, -é neuter).
  stems text[] := array[
    'modr', 'zelen', 'žlut', 'stříbrn', 'zlat', 'fialov', 'oranžov', 'hněd',
    'šed', 'bíl', 'růžov', 'tyrkysov', 'pruhovan', 'tečkovan', 'kostkovan',
    'skvrnit', 'horsk', 'mořsk', 'písečn', 'sněžn', 'duhov', 'mechov'
  ];
  animals text[] := array[
    'vydra', 'liška', 'sova', 'veverka', 'žirafa', 'zebra', 'želva', 'velryba',
    'panda', 'koala', 'lama', 'sýkorka', 'vážka', 'kavka',
    'jezevec', 'ježek', 'bobr', 'rys', 'jelen', 'tučňák', 'delfín', 'papoušek',
    'zajíc', 'medvěd', 'klokan', 'lemur', 'plameňák', 'mýval', 'kolibřík',
    'čáp', 'sokol', 'svišť',
    'kotě', 'štěně', 'hříbě', 'kůzle'
  ];
  genders text[] := array[
    'f', 'f', 'f', 'f', 'f', 'f', 'f', 'f',
    'f', 'f', 'f', 'f', 'f', 'f',
    'm', 'm', 'm', 'm', 'm', 'm', 'm', 'm',
    'm', 'm', 'm', 'm', 'm', 'm', 'm',
    'm', 'm', 'm',
    'n', 'n', 'n', 'n'
  ];
  a int;
  i int;
  attempt int;
  candidate text;
begin
  for attempt in 1..60 loop
    a := 1 + floor(random() * array_length(stems, 1))::int;
    i := 1 + floor(random() * array_length(animals, 1))::int;
    candidate := stems[a]
      || case genders[i] when 'f' then 'á' when 'n' then 'é' else 'ý' end
      || ' ' || animals[i];
    candidate := upper(left(candidate, 1)) || substr(candidate, 2);
    -- After a few misses (a big class, a crowded list) add a number rather
    -- than keep guessing.
    if attempt > 40 then
      candidate := candidate || ' ' || (attempt - 38)::text;
    end if;
    if not exists (
      select 1 from public.students
       where teacher_id = p_teacher_id and lower(nickname) = lower(candidate)
    ) then
      return candidate;
    end if;
  end loop;
  return candidate || ' ' || substr(md5(random()::text), 1, 4);
end;
$$;

create or replace function public.set_student_nickname()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.nickname is null or btrim(new.nickname) = '' then
    new.nickname := public.generate_student_nickname(new.teacher_id);
  else
    new.nickname := btrim(new.nickname);
  end if;
  return new;
end;
$$;

drop trigger if exists set_student_nickname on public.students;
create trigger set_student_nickname
  before insert or update of nickname on public.students
  for each row execute function public.set_student_nickname();

-- Backfill one row at a time, so each new nickname sees the ones already
-- given out to the same teacher.
do $$
declare
  r record;
begin
  for r in select id, teacher_id from public.students where nickname is null order by created_at loop
    update public.students
       set nickname = public.generate_student_nickname(r.teacher_id)
     where id = r.id;
  end loop;
end;
$$;

alter table public.students alter column nickname set not null;
-- The empty default is never stored: the trigger above replaces it with a
-- generated nickname. It only tells clients (and the generated types) that an
-- insert may leave the column out.
alter table public.students alter column nickname set default '';

create unique index if not exists students_teacher_nickname_key
  on public.students (teacher_id, lower(nickname));

-- =============================================================================
-- 2. Closed registration
-- =============================================================================
-- Only e-mail addresses on this list can create an account. The table has RLS
-- on and no policies, so only the service role (Supabase dashboard, SQL
-- editor) can read or change it. Add a teacher with:
--   insert into public.allowed_emails (email) values ('ucitel@skola.cz');

create table if not exists public.allowed_emails (
  email text primary key,
  note text,
  created_at timestamptz not null default now()
);
alter table public.allowed_emails enable row level security;

-- Everyone who already has an account stays welcome.
insert into public.allowed_emails (email, note)
select lower(email), 'existující účet'
  from auth.users
 where email is not null
on conflict (email) do nothing;

create or replace function public.enforce_signup_allowlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null
     or not exists (select 1 from public.allowed_emails where email = lower(new.email)) then
    -- The client recognises this code and shows a readable message.
    raise exception 'signup_not_allowed'
      using errcode = 'P0001',
            hint = 'Registrace je zatím jen pro pozvané učitele.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_signup_allowlist on auth.users;
create trigger enforce_signup_allowlist
  before insert on auth.users
  for each row execute function public.enforce_signup_allowlist();

-- =============================================================================
-- 3. Storage: each teacher reads and writes only their own folder
-- =============================================================================
-- Uploads go to "<teacher id>/<uuid>.<ext>". Until now any logged-in teacher
-- could read every file in both buckets; reads are now limited to the owner's
-- folder. Files uploaded before owner folders existed sit at the bucket root;
-- they stay readable by whoever uploaded them (storage.objects.owner).

drop policy if exists "Authenticated teachers read proof files" on storage.objects;
create policy "Teachers read own proof files" on storage.objects
  for select using (
    bucket_id = 'proof-files'
    and ((storage.foldername(name))[1] = auth.uid()::text or owner = auth.uid())
  );

drop policy if exists "Authenticated teachers read course files" on storage.objects;
create policy "Teachers read own course files" on storage.objects
  for select using (
    bucket_id = 'course-files'
    and ((storage.foldername(name))[1] = auth.uid()::text or owner = auth.uid())
  );

drop policy if exists "Teachers can upload proof files" on storage.objects;
create policy "Teachers upload into own proof folder" on storage.objects
  for insert with check (
    bucket_id = 'proof-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Teachers upload course files" on storage.objects;
create policy "Teachers upload into own course folder" on storage.objects
  for insert with check (
    bucket_id = 'course-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
