-- Make the evidence buckets private.
--
-- Both buckets were created with public = true and a SELECT policy that did not
-- check authentication at all ("USING (bucket_id = 'proof-files')"). Combined
-- with getPublicUrl(), that made every uploaded photo of a pupil's work
-- readable by anyone on the internet holding the link. These are records about
-- named minors, so the buckets are switched to private and reads now require a
-- signed URL minted for a logged-in teacher.

update storage.buckets set public = false where id in ('proof-files', 'course-files');

-- Reads: authenticated only ---------------------------------------------------
-- Scoped to any authenticated teacher rather than to the owner's folder,
-- because files uploaded before this migration sit at the bucket root with no
-- owner folder — an owner-only policy would orphan them. Which proofs a teacher
-- can actually discover is still constrained by RLS on proofs_of_learning.

drop policy if exists "Teachers can view proof files" on storage.objects;
create policy "Authenticated teachers read proof files" on storage.objects
  for select using (bucket_id = 'proof-files' and auth.role() = 'authenticated');

drop policy if exists "Public read course files" on storage.objects;
create policy "Authenticated teachers read course files" on storage.objects
  for select using (bucket_id = 'course-files' and auth.role() = 'authenticated');

-- Deletes: own uploads only ---------------------------------------------------
-- The previous proof-files delete policy compared auth.uid() against
-- (storage.foldername(name))[1], but uploads were written as "<uuid>.jpg" with
-- no folder, so the condition could never be true and deleting always failed.
-- New uploads use "<teacher id>/<uuid>.ext"; the owner check keeps pre-existing
-- root-level files deletable by whoever uploaded them.

drop policy if exists "Teachers can delete own proof files" on storage.objects;
create policy "Teachers delete own proof files" on storage.objects
  for delete using (
    bucket_id = 'proof-files'
    and (owner = auth.uid() or (storage.foldername(name))[1] = auth.uid()::text)
  );

drop policy if exists "Teachers delete own course files" on storage.objects;
create policy "Teachers delete own course files" on storage.objects
  for delete using (
    bucket_id = 'course-files'
    and (owner = auth.uid() or (storage.foldername(name))[1] = auth.uid()::text)
  );

-- Stored references become paths ----------------------------------------------
-- Columns held absolute public URLs, which stop resolving once the bucket is
-- private. Reduce them to bucket-relative object paths; the client signs them
-- on read. Values that are already paths are left alone.

update proofs_of_learning
   set file_url = split_part(file_url, '/storage/v1/object/public/proof-files/', 2)
 where file_url like '%/storage/v1/object/public/proof-files/%';

update courses
   set thematic_plan_file_url = split_part(
         thematic_plan_file_url, '/storage/v1/object/public/course-files/', 2)
 where thematic_plan_file_url like '%/storage/v1/object/public/course-files/%';
