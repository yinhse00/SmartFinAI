
-- Make the guidance table publicly readable (SELECT only) so the UI can render inputs

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.ipo_prospectus_section_guidance ENABLE ROW LEVEL SECURITY;

-- Grant SELECT privileges to both anon and authenticated roles
GRANT SELECT ON TABLE public.ipo_prospectus_section_guidance TO anon, authenticated;

-- Allow anyone to read rows (public content)
CREATE POLICY "Public read IPO guidance"
  ON public.ipo_prospectus_section_guidance
  FOR SELECT
  USING (true);
