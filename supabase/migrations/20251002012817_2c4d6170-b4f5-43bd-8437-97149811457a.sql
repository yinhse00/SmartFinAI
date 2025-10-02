-- Fix remaining functions with mutable search_path
CREATE OR REPLACE FUNCTION public.update_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.search_index (provision_id, full_text, search_vector, last_indexed)
  VALUES (
    NEW.id, 
    NEW.rule_number || ' ' || COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''),
    to_tsvector('english', NEW.rule_number || ' ' || COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '')),
    now()
  )
  ON CONFLICT (provision_id) 
  DO UPDATE SET 
    full_text = NEW.rule_number || ' ' || COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''),
    search_vector = to_tsvector('english', NEW.rule_number || ' ' || COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '')),
    last_indexed = now();
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_type)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$;