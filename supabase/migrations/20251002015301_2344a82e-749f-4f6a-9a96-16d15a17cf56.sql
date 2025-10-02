-- Phase 1: Implement Role-Based Access Control (RBAC)

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'analyst', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- Phase 2: Tighten RLS policies on sensitive tables

-- Enhanced RLS for execution_stakeholders (restrict contact info access)
DROP POLICY IF EXISTS "Project members can view and manage stakeholders" ON public.execution_stakeholders;

CREATE POLICY "Project members can view stakeholder names"
  ON public.execution_stakeholders
  FOR SELECT
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

CREATE POLICY "Project owners and admins can manage stakeholders"
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
        AND execution_project_members.role IN ('admin', 'manager')
        AND execution_project_members.status = 'active'
    )
  );

-- Enhanced RLS for execution_emails (restrict body content to owners/admins)
DROP POLICY IF EXISTS "Project members can view emails" ON public.execution_emails;

CREATE POLICY "Project members can view email metadata"
  ON public.execution_emails
  FOR SELECT
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

-- Enhanced RLS for financial_statements (more restrictive access)
DROP POLICY IF EXISTS "Users can view their own financial statements" ON public.financial_statements;

CREATE POLICY "Project owners and analysts can view financial statements"
  ON public.financial_statements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ipo_prospectus_projects
      WHERE ipo_prospectus_projects.id = financial_statements.project_id
        AND ipo_prospectus_projects.user_id = auth.uid()
    ) OR
    public.has_role(auth.uid(), 'analyst') OR
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert their own financial statements" ON public.financial_statements;

CREATE POLICY "Project owners can insert financial statements"
  ON public.financial_statements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ipo_prospectus_projects
      WHERE ipo_prospectus_projects.id = financial_statements.project_id
        AND ipo_prospectus_projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own financial statements" ON public.financial_statements;

CREATE POLICY "Project owners can update financial statements"
  ON public.financial_statements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ipo_prospectus_projects
      WHERE ipo_prospectus_projects.id = financial_statements.project_id
        AND ipo_prospectus_projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own financial statements" ON public.financial_statements;

CREATE POLICY "Project owners can delete financial statements"
  ON public.financial_statements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ipo_prospectus_projects
      WHERE ipo_prospectus_projects.id = financial_statements.project_id
        AND ipo_prospectus_projects.user_id = auth.uid()
    )
  );

-- Add audit logging for sensitive operations
CREATE TABLE public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.security_audit_log
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert audit logs"
  ON public.security_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX idx_security_audit_log_created_at ON public.security_audit_log(created_at DESC);