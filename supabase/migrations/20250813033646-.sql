-- Ensure bucket exists
insert into storage.buckets (id, name, public)
values ('ipo-dd', 'ipo-dd', false)
on conflict (id) do nothing;

-- Create policies only if they don't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow project owners to read ipo-dd objects'
  ) THEN
    CREATE POLICY "Allow project owners to read ipo-dd objects"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'ipo-dd' AND EXISTS (
          SELECT 1 FROM public.ipo_prospectus_projects p
          WHERE p.id::text = (storage.foldername(name))[1]
            AND p.user_id = auth.uid()
        )
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow project owners to upload ipo-dd objects'
  ) THEN
    CREATE POLICY "Allow project owners to upload ipo-dd objects"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'ipo-dd' AND EXISTS (
          SELECT 1 FROM public.ipo_prospectus_projects p
          WHERE p.id::text = (storage.foldername(name))[1]
            AND p.user_id = auth.uid()
        )
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow project owners to update ipo-dd objects'
  ) THEN
    CREATE POLICY "Allow project owners to update ipo-dd objects"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'ipo-dd' AND EXISTS (
          SELECT 1 FROM public.ipo_prospectus_projects p
          WHERE p.id::text = (storage.foldername(name))[1]
            AND p.user_id = auth.uid()
        )
      )
      WITH CHECK (
        bucket_id = 'ipo-dd' AND EXISTS (
          SELECT 1 FROM public.ipo_prospectus_projects p
          WHERE p.id::text = (storage.foldername(name))[1]
            AND p.user_id = auth.uid()
        )
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow project owners to delete ipo-dd objects'
  ) THEN
    CREATE POLICY "Allow project owners to delete ipo-dd objects"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'ipo-dd' AND EXISTS (
          SELECT 1 FROM public.ipo_prospectus_projects p
          WHERE p.id::text = (storage.foldername(name))[1]
            AND p.user_id = auth.uid()
        )
      );
  END IF;
END$$;