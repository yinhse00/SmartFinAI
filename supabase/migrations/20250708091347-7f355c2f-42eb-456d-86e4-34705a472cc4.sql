-- Add unique constraint to ipo_prospectus_sections for upsert operations
ALTER TABLE public.ipo_prospectus_sections 
ADD CONSTRAINT ipo_prospectus_sections_project_section_unique 
UNIQUE (project_id, section_type);