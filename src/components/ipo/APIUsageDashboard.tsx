import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingDown, TrendingUp, RefreshCw } from 'lucide-react';
import { useApiUsageSettings } from '@/hooks/useApiUsageSettings';

interface APIUsageDashboardProps {
  recentActivity?: Array<{
    timestamp: string;
    action: string;
    cost: number;
  }>;
}

export const APIUsageDashboard = ({ recentActivity = [] }: APIUsageDashboardProps) => {
  const { 
    settings, 
    apiCallsToday, 
    resetApiCallCounter 
  } = useApiUsageSettings();

  // Calculate usage trends
  const usagePercentage = Math.min((apiCallsToday / 100) * 100, 100);
  const isHighUsage = apiCallsToday > 50;
  const isCriticalUsage = apiCallsToday > 80;

  // Estimate remaining calls
  const estimatedRemainingCalls = Math.max(0, 100 - apiCallsToday);

  // Get usage level color and text
  const getUsageLevel = () => {
    if (isCriticalUsage) return { color: 'destructive', text: 'Critical' };
    if (isHighUsage) return { color: 'yellow', text: 'High' };
    return { color: 'green', text: 'Normal' };
  };

  const usageLevel = getUsageLevel();

  // Calculate daily trend (mock data for now)
  const dailyTrend = apiCallsToday > 30 ? 'up' : 'down';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          API Usage Dashboard
        </CardTitle>
        <CardDescription>
          Monitor your daily API usage and optimize costs
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Usage Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Today's Usage</h3>
            <Badge variant={usageLevel.color as any}>
              {usageLevel.text} Usage
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{apiCallsToday} calls made</span>
              <span>{estimatedRemainingCalls} calls remaining</span>
            </div>
            <Progress 
              value={usagePercentage} 
              className={`h-3 ${isCriticalUsage ? 'bg-red-100' : isHighUsage ? 'bg-yellow-100' : 'bg-green-100'}`}
            />
          </div>
          
          {/* Usage breakdown */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-muted rounded-lg">
              <p className="text-lg font-bold">{apiCallsToday}</p>
              <p className="text-xs text-muted-foreground">Total Today</p>
            </div>
            <div className="p-2 bg-muted rounded-lg">
              <p className="text-lg font-bold">{Math.round(apiCallsToday / Math.max(1, new Date().getHours() || 1))}</p>
              <p className="text-xs text-muted-foreground">Per Hour</p>
            </div>
            <div className="p-2 bg-muted rounded-lg">
              <p className="text-lg font-bold">{settings.mode}</p>
              <p className="text-xs text-muted-foreground">Mode</p>
            </div>
          </div>
        </div>

        {/* Usage Trend */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Trend</h3>
            <div className="flex items-center gap-1 text-sm">
              {dailyTrend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span className={dailyTrend === 'up' ? 'text-red-500' : 'text-green-500'}>
                {dailyTrend === 'up' ? 'Increasing' : 'Decreasing'}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {dailyTrend === 'up' 
              ? 'Consider switching to Economy mode to reduce API usage'
              : 'Good usage pattern - staying within reasonable limits'
            }
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Recent Activity</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recentActivity.slice(-5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                  <span>{activity.action}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{activity.timestamp}</span>
                    <Badge variant="outline" className="text-xs">
                      {activity.cost} call{activity.cost > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning Messages */}
        {isCriticalUsage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 mb-1">Critical Usage Warning</h4>
            <p className="text-sm text-red-600">
              You've made {apiCallsToday} API calls today. Consider switching to Economy mode or reducing usage.
            </p>
          </div>
        )}

        {isHighUsage && !isCriticalUsage && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 mb-1">High Usage Notice</h4>
            <p className="text-sm text-yellow-600">
              You're approaching your daily usage limit. Monitor your API calls.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetApiCallCounter}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Counter
          </Button>
        </div>

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Tip:</strong> Use Economy mode to minimize API usage</p>
          <p><strong>Tip:</strong> Batch multiple operations together when possible</p>
          <p><strong>Tip:</strong> Use manual controls to avoid unnecessary API calls</p>
        </div>
      </CardContent>
    </Card>
  );
};