-- Fix user_subscriptions RLS policies to prevent public data exposure
-- The current "System can manage subscriptions" policy with ALL and true is too permissive

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can manage subscriptions" ON public.user_subscriptions;

-- Create restricted system policies for specific operations only
CREATE POLICY "System can create subscriptions"
ON public.user_subscriptions
FOR INSERT
WITH CHECK (true);

-- Allow admins to view all subscriptions (if needed for admin panel)
CREATE POLICY "Admins can view all subscriptions"
ON public.user_subscriptions
FOR SELECT
USING (is_admin(auth.uid()));

-- Allow admins to update subscriptions (if needed for admin operations)
CREATE POLICY "Admins can update subscriptions"
ON public.user_subscriptions
FOR UPDATE
USING (is_admin(auth.uid()));

-- The existing "Users can view their own subscription" and 
-- "Users can update their own subscription" policies remain unchanged