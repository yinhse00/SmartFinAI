-- Create IPO prospectus database schema
CREATE TABLE public.ipo_prospectus_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  industry TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create prospectus sections table
CREATE TABLE public.ipo_prospectus_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES ipo_prospectus_projects(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL, -- 'business', 'financial', 'risk_factors', etc.
  section_number TEXT,
  title TEXT NOT NULL,
  content TEXT,
  sources JSONB DEFAULT '[]'::jsonb, -- Source attribution
  confidence_score DECIMAL(3,2) DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create due diligence documents table
CREATE TABLE public.ipo_dd_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES ipo_prospectus_projects(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'financial', 'legal', 'business', etc.
  file_path TEXT,
  file_url TEXT,
  extracted_content TEXT,
  key_insights JSONB DEFAULT '[]'::jsonb,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create section templates table
CREATE TABLE public.ipo_section_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type TEXT NOT NULL,
  industry TEXT,
  template_name TEXT NOT NULL,
  template_content JSONB NOT NULL, -- Structured template with fields
  regulatory_requirements JSONB DEFAULT '[]'::jsonb,
  sample_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create source attribution table
CREATE TABLE public.ipo_source_attribution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES ipo_prospectus_sections(id) ON DELETE CASCADE,
  content_snippet TEXT NOT NULL,
  source_document_id UUID REFERENCES ipo_dd_documents(id),
  source_type TEXT NOT NULL, -- 'dd_document', 'template', 'ai_generated'
  source_reference TEXT, -- Page number, section reference, etc.
  confidence_score DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ipo_prospectus_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipo_prospectus_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipo_dd_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipo_section_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipo_source_attribution ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for IPO prospectus projects
CREATE POLICY "Users can view their own IPO projects" 
ON public.ipo_prospectus_projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own IPO projects" 
ON public.ipo_prospectus_projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own IPO projects" 
ON public.ipo_prospectus_projects 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for prospectus sections
CREATE POLICY "Users can view sections of their IPO projects" 
ON public.ipo_prospectus_sections 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM ipo_prospectus_projects 
  WHERE id = project_id AND user_id = auth.uid()
));

CREATE POLICY "Users can manage sections of their IPO projects" 
ON public.ipo_prospectus_sections 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM ipo_prospectus_projects 
  WHERE id = project_id AND user_id = auth.uid()
));

-- Create RLS policies for DD documents
CREATE POLICY "Users can manage DD documents of their IPO projects" 
ON public.ipo_dd_documents 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM ipo_prospectus_projects 
  WHERE id = project_id AND user_id = auth.uid()
));

-- Create RLS policies for section templates (public read)
CREATE POLICY "Templates are publicly readable" 
ON public.ipo_section_templates 
FOR SELECT 
USING (true);

-- Create RLS policies for source attribution
CREATE POLICY "Users can view source attribution for their projects" 
ON public.ipo_source_attribution 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM ipo_prospectus_sections s
  JOIN ipo_prospectus_projects p ON s.project_id = p.id
  WHERE s.id = section_id AND p.user_id = auth.uid()
));

CREATE POLICY "Users can manage source attribution for their projects" 
ON public.ipo_source_attribution 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM ipo_prospectus_sections s
  JOIN ipo_prospectus_projects p ON s.project_id = p.id
  WHERE s.id = section_id AND p.user_id = auth.uid()
));

-- Create update triggers
CREATE OR REPLACE FUNCTION public.update_ipo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ipo_prospectus_projects_updated_at
  BEFORE UPDATE ON public.ipo_prospectus_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ipo_updated_at();

CREATE TRIGGER update_ipo_prospectus_sections_updated_at
  BEFORE UPDATE ON public.ipo_prospectus_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ipo_updated_at();

CREATE TRIGGER update_ipo_dd_documents_updated_at
  BEFORE UPDATE ON public.ipo_dd_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ipo_updated_at();

-- Insert initial business section template
INSERT INTO public.ipo_section_templates (section_type, template_name, template_content, regulatory_requirements) VALUES
('business', 'Standard Business Section Template', 
'{
  "sections": [
    {
      "id": "overview",
      "title": "Business Overview",
      "fields": ["company_description", "principal_activities", "business_model"],
      "regulatory_ref": "App1A Part A para 32"
    },
    {
      "id": "history",
      "title": "History and Corporate Development",
      "fields": ["corporate_history", "key_milestones", "corporate_structure"],
      "regulatory_ref": "App1A Part A para 33"
    },
    {
      "id": "products_services",
      "title": "Products and Services",
      "fields": ["product_portfolio", "service_offerings", "revenue_streams"],
      "regulatory_ref": "App1A Part A para 34"
    },
    {
      "id": "competitive_strengths",
      "title": "Competitive Strengths",
      "fields": ["key_strengths", "competitive_advantages", "market_position"],
      "regulatory_ref": "App1A Part A para 35"
    },
    {
      "id": "strategy",
      "title": "Business Strategy",
      "fields": ["strategic_objectives", "growth_strategy", "implementation_plan"],
      "regulatory_ref": "App1A Part A para 36"
    }
  ]
}',
'["App1A Part A para 32-36", "Main Board Listing Rule 11.07"]'
);