-- Create execution projects table
CREATE TABLE public.execution_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  transaction_type TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'on_hold')),
  execution_plan JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles enum
CREATE TYPE public.execution_role AS ENUM ('admin', 'manager', 'team_member', 'external_advisor', 'client');

-- Create project members table for collaboration
CREATE TABLE public.execution_project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.execution_projects(id) ON DELETE CASCADE,
  user_id UUID,
  email TEXT,
  role execution_role NOT NULL DEFAULT 'team_member',
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  invited_by UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id),
  UNIQUE(project_id, email)
);

-- Create task comments table
CREATE TABLE public.execution_task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.execution_projects(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  user_id UUID,
  author_email TEXT,
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.execution_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.execution_projects(id) ON DELETE CASCADE,
  user_id UUID,
  email TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.execution_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for execution_projects
CREATE POLICY "Users can view projects they are members of" 
ON public.execution_projects 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.execution_project_members 
    WHERE project_id = execution_projects.id 
    AND (user_id = auth.uid() OR email = auth.email())
    AND status = 'active'
  )
);

CREATE POLICY "Users can create their own projects" 
ON public.execution_projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Project owners and admins can update projects" 
ON public.execution_projects 
FOR UPDATE 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.execution_project_members 
    WHERE project_id = execution_projects.id 
    AND user_id = auth.uid()
    AND role IN ('admin', 'manager')
    AND status = 'active'
  )
);

-- RLS Policies for execution_project_members
CREATE POLICY "Users can view project members for their projects" 
ON public.execution_project_members 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.execution_projects 
    WHERE id = execution_project_members.project_id 
    AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.execution_project_members AS epm2
    WHERE epm2.project_id = execution_project_members.project_id 
    AND epm2.user_id = auth.uid()
    AND epm2.status = 'active'
  )
);

CREATE POLICY "Project owners and admins can manage members" 
ON public.execution_project_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.execution_projects 
    WHERE id = execution_project_members.project_id 
    AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.execution_project_members AS epm2
    WHERE epm2.project_id = execution_project_members.project_id 
    AND epm2.user_id = auth.uid()
    AND epm2.role IN ('admin', 'manager')
    AND epm2.status = 'active'
  )
);

-- RLS Policies for execution_task_comments
CREATE POLICY "Project members can view and create comments" 
ON public.execution_task_comments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.execution_project_members 
    WHERE project_id = execution_task_comments.project_id 
    AND (user_id = auth.uid() OR email = auth.email())
    AND status = 'active'
  ) OR
  EXISTS (
    SELECT 1 FROM public.execution_projects 
    WHERE id = execution_task_comments.project_id 
    AND user_id = auth.uid()
  )
);

-- RLS Policies for execution_notifications
CREATE POLICY "Users can view their own notifications" 
ON public.execution_notifications 
FOR SELECT 
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "System can create notifications" 
ON public.execution_notifications 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_execution_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_execution_projects_updated_at
  BEFORE UPDATE ON public.execution_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_execution_updated_at();

CREATE TRIGGER update_execution_task_comments_updated_at
  BEFORE UPDATE ON public.execution_task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_execution_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_execution_projects_user_id ON public.execution_projects(user_id);
CREATE INDEX idx_execution_project_members_project_id ON public.execution_project_members(project_id);
CREATE INDEX idx_execution_project_members_user_id ON public.execution_project_members(user_id);
CREATE INDEX idx_execution_project_members_email ON public.execution_project_members(email);
CREATE INDEX idx_execution_task_comments_project_id ON public.execution_task_comments(project_id);
CREATE INDEX idx_execution_task_comments_task_id ON public.execution_task_comments(task_id);
CREATE INDEX idx_execution_notifications_user_id ON public.execution_notifications(user_id);
CREATE INDEX idx_execution_notifications_email ON public.execution_notifications(email);