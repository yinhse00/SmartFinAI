-- Create IPO prospectus sections table
CREATE TABLE public.ipo_prospectus_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ipo_prospectus_projects(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  section_number TEXT,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'completed', 'pending')),
  confidence_score DECIMAL(3,2) DEFAULT 0.00 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create source attribution table
CREATE TABLE public.ipo_source_attribution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.ipo_prospectus_sections(id) ON DELETE CASCADE,
  content_snippet TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('dd_document', 'template', 'ai_generated', 'manual', 'regulatory')),
  source_reference TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.00 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ipo_prospectus_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipo_source_attribution ENABLE ROW LEVEL SECURITY;

-- RLS policies for ipo_prospectus_sections
CREATE POLICY "Users can manage sections of their IPO projects"
ON public.ipo_prospectus_sections
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.ipo_prospectus_projects
    WHERE ipo_prospectus_projects.id = ipo_prospectus_sections.project_id
    AND ipo_prospectus_projects.user_id = auth.uid()
  )
);

-- RLS policies for ipo_source_attribution  
CREATE POLICY "Users can manage attributions of their IPO sections"
ON public.ipo_source_attribution
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.ipo_prospectus_sections
    JOIN public.ipo_prospectus_projects ON ipo_prospectus_projects.id = ipo_prospectus_sections.project_id
    WHERE ipo_prospectus_sections.id = ipo_source_attribution.section_id
    AND ipo_prospectus_projects.user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_ipo_sections_project_id ON public.ipo_prospectus_sections(project_id);
CREATE INDEX idx_ipo_sections_type ON public.ipo_prospectus_sections(section_type);
CREATE INDEX idx_ipo_attribution_section_id ON public.ipo_source_attribution(section_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ipo_sections_updated_at
BEFORE UPDATE ON public.ipo_prospectus_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_ipo_updated_at();