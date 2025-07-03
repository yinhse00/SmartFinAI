-- Create email integration tables for AI execution system

-- Table for storing execution emails
CREATE TABLE public.execution_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES execution_projects(id),
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  analysis JSONB,
  ai_response TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzed', 'responded', 'escalated')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for email integration configurations
CREATE TABLE public.execution_email_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL UNIQUE REFERENCES execution_projects(id),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for email interaction logs
CREATE TABLE public.execution_email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id UUID NOT NULL REFERENCES execution_emails(id),
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for AI-powered stakeholder management
CREATE TABLE public.execution_stakeholders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES execution_projects(id),
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('regulator', 'client', 'team_member', 'external_advisor')),
  communication_style TEXT NOT NULL DEFAULT 'professional' CHECK (communication_style IN ('formal', 'professional', 'casual')),
  expertise_areas JSONB DEFAULT '[]'::jsonb,
  contact_info JSONB DEFAULT '{}'::jsonb,
  ai_context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, email)
);

-- Table for AI-generated documents
CREATE TABLE public.execution_ai_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES execution_projects(id),
  email_id UUID REFERENCES execution_emails(id),
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  file_path TEXT,
  created_by_ai BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.execution_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_email_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_ai_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for execution_emails
CREATE POLICY "Project members can view and manage emails" 
ON public.execution_emails 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM execution_projects 
    WHERE execution_projects.id = execution_emails.project_id 
    AND execution_projects.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM execution_project_members 
    WHERE execution_project_members.project_id = execution_emails.project_id 
    AND execution_project_members.user_id = auth.uid() 
    AND execution_project_members.status = 'active'
  )
);

-- RLS policies for execution_email_configs
CREATE POLICY "Project owners and admins can manage email configs" 
ON public.execution_email_configs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM execution_projects 
    WHERE execution_projects.id = execution_email_configs.project_id 
    AND execution_projects.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM execution_project_members 
    WHERE execution_project_members.project_id = execution_email_configs.project_id 
    AND execution_project_members.user_id = auth.uid() 
    AND execution_project_members.role IN ('admin', 'manager')
    AND execution_project_members.status = 'active'
  )
);

-- RLS policies for execution_email_logs
CREATE POLICY "Project members can view email logs" 
ON public.execution_email_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM execution_emails 
    JOIN execution_projects ON execution_projects.id = execution_emails.project_id
    WHERE execution_emails.id = execution_email_logs.email_id 
    AND (
      execution_projects.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM execution_project_members 
        WHERE execution_project_members.project_id = execution_projects.id 
        AND execution_project_members.user_id = auth.uid() 
        AND execution_project_members.status = 'active'
      )
    )
  )
);

-- Allow system to insert logs
CREATE POLICY "System can create email logs" 
ON public.execution_email_logs 
FOR INSERT 
WITH CHECK (true);

-- RLS policies for execution_stakeholders
CREATE POLICY "Project members can manage stakeholders" 
ON public.execution_stakeholders 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM execution_projects 
    WHERE execution_projects.id = execution_stakeholders.project_id 
    AND execution_projects.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM execution_project_members 
    WHERE execution_project_members.project_id = execution_stakeholders.project_id 
    AND execution_project_members.user_id = auth.uid() 
    AND execution_project_members.status = 'active'
  )
);

-- RLS policies for execution_ai_documents
CREATE POLICY "Project members can view and manage AI documents" 
ON public.execution_ai_documents 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM execution_projects 
    WHERE execution_projects.id = execution_ai_documents.project_id 
    AND execution_projects.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM execution_project_members 
    WHERE execution_project_members.project_id = execution_ai_documents.project_id 
    AND execution_project_members.user_id = auth.uid() 
    AND execution_project_members.status = 'active'
  )
);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_execution_emails_updated_at
  BEFORE UPDATE ON public.execution_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_execution_updated_at();

CREATE TRIGGER update_execution_email_configs_updated_at
  BEFORE UPDATE ON public.execution_email_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_execution_updated_at();

CREATE TRIGGER update_execution_stakeholders_updated_at
  BEFORE UPDATE ON public.execution_stakeholders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_execution_updated_at();

CREATE TRIGGER update_execution_ai_documents_updated_at
  BEFORE UPDATE ON public.execution_ai_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_execution_updated_at();