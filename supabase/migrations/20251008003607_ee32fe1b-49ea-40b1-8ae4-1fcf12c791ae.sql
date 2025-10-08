-- Phase 1: Critical Security Fixes - Restrict Profile Access

-- Drop the overly permissive policy that allows all authenticated users to view all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create restrictive policy: users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to view profiles of execution project members (business requirement)
CREATE POLICY "Users can view profiles of project members"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.execution_project_members epm1
    JOIN public.execution_project_members epm2 ON epm1.project_id = epm2.project_id
    WHERE epm1.user_id = auth.uid()
      AND epm2.user_id = profiles.id
      AND epm1.status = 'active'
      AND epm2.status = 'active'
  )
  OR EXISTS (
    SELECT 1 FROM public.execution_projects ep
    WHERE ep.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.execution_project_members epm
        WHERE epm.project_id = ep.id
          AND epm.user_id = profiles.id
          AND epm.status = 'active'
      )
  )
);