import React, { useState, useEffect } from 'react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Zap, BarChart3 } from 'lucide-react';

interface UserSubscription {
  plan_type: string;
  monthly_token_limit: number;
  tokens_used_this_month: number;
  billing_cycle_start: string;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserSubscription();
    }
  }, [user]);

  const fetchUserSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
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

  const getPlanBadgeVariant = (planType: string) => {
    switch (planType) {
      case 'pro': return 'default';
      case 'enterprise': return 'secondary';
      default: return 'outline';
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'pro': return <Zap className="h-4 w-4" />;
      case 'enterprise': return <Crown className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const usagePercentage = subscription 
    ? (subscription.tokens_used_this_month / subscription.monthly_token_limit) * 100 
    : 0;

  return (
    <SidebarLayout>
      <div className="container mx-auto py-10 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Profile & Usage</h1>
          <p className="text-muted-foreground">View your account information and AI usage</p>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
                    {user?.email || ''}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">User ID</label>
                  <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md font-mono">
                    {user?.id || ''}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription & Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                AI Usage & Subscription
                {subscription && (
                  <Badge variant={getPlanBadgeVariant(subscription.plan_type)} className="ml-auto">
                    {getPlanIcon(subscription.plan_type)}
                    {subscription.plan_type.toUpperCase()}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading subscription data...</div>
              ) : subscription ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Monthly Token Usage</span>
                      <span>{subscription.tokens_used_this_month.toLocaleString()} / {subscription.monthly_token_limit.toLocaleString()}</span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {Math.round(usagePercentage)}% of monthly limit used
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">
                        {subscription.tokens_used_this_month.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Tokens Used</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-green-600">
                        {(subscription.monthly_token_limit - subscription.tokens_used_this_month).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold">
                        {subscription.monthly_token_limit.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Monthly Limit</div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Billing cycle started: {new Date(subscription.billing_cycle_start).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No subscription data found
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>AI System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Grok AI (X.AI)</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">System Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Google Gemini</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">System Connected</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  ✨ No API key setup required - all providers managed by the system
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ProfilePage;