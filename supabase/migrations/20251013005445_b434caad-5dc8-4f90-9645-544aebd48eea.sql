-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Project members can view email metadata" ON execution_emails;

-- Project owners can view all emails in their projects
CREATE POLICY "Project owners can view all emails"
ON execution_emails
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM execution_projects
    WHERE execution_projects.id = execution_emails.project_id
    AND execution_projects.user_id = auth.uid()
  )
);

-- Admins and managers can view all emails in projects they manage
CREATE POLICY "Admins and managers can view all project emails"
ON execution_emails
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM execution_project_members
    WHERE execution_project_members.project_id = execution_emails.project_id
    AND execution_project_members.user_id = auth.uid()
    AND execution_project_members.role IN ('admin', 'manager')
    AND execution_project_members.status = 'active'
  )
);

-- Team members can only view emails they created or emails addressed to them
CREATE POLICY "Team members can view their own emails"
ON execution_emails
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM execution_project_members
    WHERE execution_project_members.project_id = execution_emails.project_id
    AND execution_project_members.user_id = auth.uid()
    AND execution_project_members.status = 'active'
  )
  AND (
    execution_emails.from_email = auth.email()
    OR execution_emails.to_email = auth.email()
  )
);