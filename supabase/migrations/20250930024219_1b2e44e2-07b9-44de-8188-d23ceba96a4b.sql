-- Check if RLS is enabled on execution_emails table and fix any access issues
-- First, ensure RLS is enabled
ALTER TABLE public.execution_emails ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Project members can view and manage emails" ON public.execution_emails;

-- Create comprehensive RLS policies for execution_emails table
-- Policy for SELECT: Only project owners and active members can view emails
CREATE POLICY "Project members can view emails" 
ON public.execution_emails 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM execution_projects 
    WHERE execution_projects.id = execution_emails.project_id 
    AND execution_projects.user_id = auth.uid()
  ) 
  OR 
  EXISTS (
    SELECT 1 
    FROM execution_project_members 
    WHERE execution_project_members.project_id = execution_emails.project_id 
    AND execution_project_members.user_id = auth.uid() 
    AND execution_project_members.status = 'active'
  )
);

-- Policy for INSERT: Only project owners and active members can create emails
CREATE POLICY "Project members can create emails" 
ON public.execution_emails 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM execution_projects 
    WHERE execution_projects.id = execution_emails.project_id 
    AND execution_projects.user_id = auth.uid()
  ) 
  OR 
  EXISTS (
    SELECT 1 
    FROM execution_project_members 
    WHERE execution_project_members.project_id = execution_emails.project_id 
    AND execution_project_members.user_id = auth.uid() 
    AND execution_project_members.status = 'active'
  )
);

-- Policy for UPDATE: Only project owners and active members can update emails
CREATE POLICY "Project members can update emails" 
ON public.execution_emails 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM execution_projects 
    WHERE execution_projects.id = execution_emails.project_id 
    AND execution_projects.user_id = auth.uid()
  ) 
  OR 
  EXISTS (
    SELECT 1 
    FROM execution_project_members 
    WHERE execution_project_members.project_id = execution_emails.project_id 
    AND execution_project_members.user_id = auth.uid() 
    AND execution_project_members.status = 'active'
  )
);

-- Policy for DELETE: Only project owners and admins can delete emails
CREATE POLICY "Project owners and admins can delete emails" 
ON public.execution_emails 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM execution_projects 
    WHERE execution_projects.id = execution_emails.project_id 
    AND execution_projects.user_id = auth.uid()
  ) 
  OR 
  EXISTS (
    SELECT 1 
    FROM execution_project_members 
    WHERE execution_project_members.project_id = execution_emails.project_id 
    AND execution_project_members.user_id = auth.uid() 
    AND execution_project_members.role IN ('admin', 'manager')
    AND execution_project_members.status = 'active'
  )
);

-- Also fix the execution_stakeholders table mentioned in the security scan
ALTER TABLE public.execution_stakeholders ENABLE ROW LEVEL SECURITY;

-- Drop existing policy to recreate it properly
DROP POLICY IF EXISTS "Project members can manage stakeholders" ON public.execution_stakeholders;

-- Create comprehensive RLS policies for execution_stakeholders table
CREATE POLICY "Project members can view and manage stakeholders" 
ON public.execution_stakeholders 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM execution_projects 
    WHERE execution_projects.id = execution_stakeholders.project_id 
    AND execution_projects.user_id = auth.uid()
  ) 
  OR 
  EXISTS (
    SELECT 1 
    FROM execution_project_members 
    WHERE execution_project_members.project_id = execution_stakeholders.project_id 
    AND execution_project_members.user_id = auth.uid() 
    AND execution_project_members.status = 'active'
  )
);