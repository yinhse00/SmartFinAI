-- Create private bucket for IPO DD documents
insert into storage.buckets (id, name, public)
values ('ipo-dd', 'ipo-dd', false)
on conflict (id) do nothing;

-- Policies for storage.objects limited to ipo-dd bucket
-- Allow users to list and read their own project files in ipo-dd
create policy if not exists "Allow project owners to read ipo-dd objects"
  on storage.objects
  for select
  using (
    bucket_id = 'ipo-dd' and exists (
      select 1 from public.ipo_prospectus_projects p
      where p.id::text = (storage.foldername(name))[1]
        and p.user_id = auth.uid()
    )
  );

-- Allow users to upload files to their own project folder in ipo-dd
create policy if not exists "Allow project owners to upload ipo-dd objects"
  on storage.objects
  for insert
  with check (
    bucket_id = 'ipo-dd' and exists (
      select 1 from public.ipo_prospectus_projects p
      where p.id::text = (storage.foldername(name))[1]
        and p.user_id = auth.uid()
    )
  );

-- Allow users to update their own project files
create policy if not exists "Allow project owners to update ipo-dd objects"
  on storage.objects
  for update
  using (
    bucket_id = 'ipo-dd' and exists (
      select 1 from public.ipo_prospectus_projects p
      where p.id::text = (storage.foldername(name))[1]
        and p.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'ipo-dd' and exists (
      select 1 from public.ipo_prospectus_projects p
      where p.id::text = (storage.foldername(name))[1]
        and p.user_id = auth.uid()
    )
  );

-- Allow users to delete their own project files
create policy if not exists "Allow project owners to delete ipo-dd objects"
  on storage.objects
  for delete
  using (
    bucket_id = 'ipo-dd' and exists (
      select 1 from public.ipo_prospectus_projects p
      where p.id::text = (storage.foldername(name))[1]
        and p.user_id = auth.uid()
    )
  );