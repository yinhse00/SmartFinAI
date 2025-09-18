-- Add unique constraint on user_id and insert default subscription
ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT user_subscriptions_user_id_unique UNIQUE (user_id);

-- Create default subscription for existing user
INSERT INTO public.user_subscriptions (user_id, plan_type, monthly_token_limit, tokens_used_this_month)
VALUES ('fcfc38cc-3eb2-47b2-bb1b-6155cdc36b39', 'free', 10000, 0);