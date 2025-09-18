import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { BarChart3, Zap, Crown } from 'lucide-react';

interface UserSubscription {
  plan_type: string;
  monthly_token_limit: number;
  tokens_used_this_month: number;
}

const UsageDisplay = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('plan_type, monthly_token_limit, tokens_used_this_month')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'pro': return <Zap className="h-4 w-4" />;
      case 'enterprise': return <Crown className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Loading usage...</div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return null;
  }

  const usagePercentage = (subscription.tokens_used_this_month / subscription.monthly_token_limit) * 100;
  const remaining = subscription.monthly_token_limit - subscription.tokens_used_this_month;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>AI Usage</span>
          <Badge className={getPlanColor(subscription.plan_type)}>
            {getPlanIcon(subscription.plan_type)}
            {subscription.plan_type.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>This Month</span>
            <span>{subscription.tokens_used_this_month.toLocaleString()} / {subscription.monthly_token_limit.toLocaleString()}</span>
          </div>
          <Progress value={usagePercentage} className="h-1.5" />
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{remaining.toLocaleString()} remaining</span>
          <span>{Math.round(usagePercentage)}% used</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageDisplay;