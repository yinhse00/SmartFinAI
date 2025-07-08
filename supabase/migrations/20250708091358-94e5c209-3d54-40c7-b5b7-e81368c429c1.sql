-- Remove duplicate entries, keeping only the most recent one for each project_id, section_type combination
DELETE FROM public.ipo_prospectus_sections 
WHERE id NOT IN (
    SELECT DISTINCT ON (project_id, section_type) id
    FROM public.ipo_prospectus_sections
    ORDER BY project_id, section_type, updated_at DESC
);

-- Add unique constraint to ipo_prospectus_sections for upsert operations
ALTER TABLE public.ipo_prospectus_sections 
ADD CONSTRAINT ipo_prospectus_sections_project_section_unique 
UNIQUE (project_id, section_type);