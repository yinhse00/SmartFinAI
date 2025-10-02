-- Phase 1 & 2: Critical Security Fixes
-- Fix infinite recursion in RLS policies by creating security definer functions

-- Create security definer function to check if user is project owner
CREATE OR REPLACE FUNCTION public.is_project_owner(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.execution_projects
    WHERE id = _project_id
      AND user_id = _user_id
  )
$$;

-- Create security definer function to check if user is active project member
CREATE OR REPLACE FUNCTION public.is_active_project_member(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.execution_project_members
    WHERE project_id = _project_id
      AND user_id = _user_id
      AND status = 'active'
  )
$$;

-- Create security definer function to check if user is project admin/manager
CREATE OR REPLACE FUNCTION public.is_project_admin(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.execution_project_members
    WHERE project_id = _project_id
      AND user_id = _user_id
      AND role IN ('admin', 'manager')
      AND status = 'active'
  )
$$;

-- Fix execution_projects RLS policies to prevent infinite recursion
DROP POLICY IF EXISTS "Users can view projects they are members of" ON public.execution_projects;
DROP POLICY IF EXISTS "Project owners and admins can update projects" ON public.execution_projects;

CREATE POLICY "Users can view projects they are members of"
ON public.execution_projects
FOR SELECT
USING (
  user_id = auth.uid() 
  OR public.is_active_project_member(id, auth.uid())
);

CREATE POLICY "Project owners and admins can update projects"
ON public.execution_projects
FOR UPDATE
USING (
  user_id = auth.uid() 
  OR public.is_project_admin(id, auth.uid())
);

-- Fix execution_project_members RLS policies
DROP POLICY IF EXISTS "Users can view project members for their projects" ON public.execution_project_members;
DROP POLICY IF EXISTS "Project owners and admins can manage members" ON public.execution_project_members;

CREATE POLICY "Users can view project members for their projects"
ON public.execution_project_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_project_owner(project_id, auth.uid())
  OR public.is_active_project_member(project_id, auth.uid())
);

CREATE POLICY "Project owners and admins can manage members"
ON public.execution_project_members
FOR ALL
USING (
  public.is_project_owner(project_id, auth.uid())
  OR public.is_project_admin(project_id, auth.uid())
);

-- Add RLS to announcement_pre_vetting_requirements (regulatory data - public read only)
ALTER TABLE public.announcement_pre_vetting_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for vetting requirements"
ON public.announcement_pre_vetting_requirements
FOR SELECT
USING (true);

-- Add RLS to listingrule_new_faq
ALTER TABLE public.listingrule_new_faq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for new FAQ"
ON public.listingrule_new_faq
FOR SELECT
USING (true);

-- Add RLS to listingrules_listed_timetable
ALTER TABLE public.listingrules_listed_timetable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for timetable"
ON public.listingrules_listed_timetable
FOR SELECT
USING (true);

-- Fix profiles table RLS to be more restrictive
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix database functions to add proper security settings
CREATE OR REPLACE FUNCTION public.update_timestamp_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_execution_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_ipo_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_subscriptions 
  SET tokens_used_this_month = 0,
      billing_cycle_start = CURRENT_DATE
  WHERE billing_cycle_start + INTERVAL '1 month' <= CURRENT_DATE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_tables()
RETURNS TABLE(table_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT pg_tables.tablename::TEXT
  FROM pg_catalog.pg_tables
  WHERE pg_tables.schemaname = 'public';
END;
$$;