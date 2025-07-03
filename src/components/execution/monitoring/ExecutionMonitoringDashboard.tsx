import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Users,
  Target,
  Activity
} from 'lucide-react';
import { ExecutionPlan } from '@/services/execution/executionPlanExtractor';
import { 
  executionCollaborationService,
  ProjectMember,
  ExecutionNotification
} from '@/services/execution/executionCollaborationService';

interface ExecutionMonitoringDashboardProps {
  projectId: string;
  executionPlan: ExecutionPlan;
  members: ProjectMember[];
}

export const ExecutionMonitoringDashboard = ({ 
  projectId, 
  executionPlan, 
  members 
}: ExecutionMonitoringDashboardProps) => {
  const [riskAlerts, setRiskAlerts] = useState<ExecutionNotification[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadRiskAlerts();
    // Set up real-time monitoring
    const subscription = executionCollaborationService.subscribeToProjectUpdates(
      projectId,
      (payload) => {
        console.log('Project update:', payload);
        // Handle real-time updates
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId]);

  const loadRiskAlerts = async () => {
    try {
      const notifications = await executionCollaborationService.getUserNotifications(50);
      const alerts = notifications.filter(n => 
        n.project_id === projectId && 
        n.type === 'project_risk_alert' && 
        !n.read_at
      );
      setRiskAlerts(alerts);
    } catch (error) {
      console.error('Error loading risk alerts:', error);
    }
  };

  // Calculate project metrics
  const getProjectMetrics = () => {
    const totalTasks = executionPlan.tasks.length;
    const completedTasks = executionPlan.tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = executionPlan.tasks.filter(t => t.status === 'in_progress').length;
    const blockedTasks = executionPlan.tasks.filter(t => t.status === 'blocked').length;
    const pendingTasks = executionPlan.tasks.filter(t => t.status === 'pending').length;

    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate overdue tasks
    const overdueTasks = executionPlan.tasks.filter(t => {
      return t.completionDate && new Date(t.completionDate) < new Date() && t.status !== 'completed';
    }).length;

    // Calculate risk level
    const riskLevel = executionCollaborationService.calculateRiskLevel(executionPlan.tasks);

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      pendingTasks,
      overdueTasks,
      completionPercentage,
      riskLevel
    };
  };

  const getTasksByType = () => {
    const taskTypes = executionPlan.tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(taskTypes).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      completed: executionPlan.tasks.filter(t => t.type === type && t.status === 'completed').length
    }));
  };

  const getTasksByPriority = () => {
    const priorities = ['high', 'medium', 'low'] as const;
    return priorities.map(priority => ({
      priority: priority.charAt(0).toUpperCase() + priority.slice(1),
      count: executionPlan.tasks.filter(t => t.priority === priority).length,
      completed: executionPlan.tasks.filter(t => t.priority === priority && t.status === 'completed').length
    }));
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const metrics = getProjectMetrics();
  const tasksByType = getTasksByType();
  const tasksByPriority = getTasksByPriority();

  return (
    <div className="space-y-6">
      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Risk Alerts ({riskAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskAlerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-white border border-orange-200 rounded-lg">
                  <h4 className="font-medium text-sm text-orange-800">{alert.title}</h4>
                  <p className="text-sm text-orange-700 mt-1">{alert.message}</p>
                  <p className="text-xs text-orange-600 mt-2">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                <div className="mt-2">
                  <p className="text-2xl font-bold">{Math.round(metrics.completionPercentage)}%</p>
                  <Progress value={metrics.completionPercentage} className="mt-2" />
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Project Risk</p>
                <div className="mt-2">
                  <Badge className={getRiskColor(metrics.riskLevel)}>
                    {metrics.riskLevel.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <div className="mt-2">
                  <p className="text-2xl font-bold">
                    {members.filter(m => m.status === 'active').length}
                  </p>
                </div>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Blocked Tasks</p>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-red-600">{metrics.blockedTasks}</p>
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Project Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Task Overview</TabsTrigger>
              <TabsTrigger value="types">By Type</TabsTrigger>
              <TabsTrigger value="priority">By Priority</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{metrics.completedTasks}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{metrics.inProgressTasks}</div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{metrics.blockedTasks}</div>
                  <div className="text-sm text-gray-600">Blocked</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{metrics.pendingTasks}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{metrics.overdueTasks}</div>
                  <div className="text-sm text-gray-600">Overdue</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="types" className="mt-6">
              <div className="space-y-4">
                {tasksByType.map((typeData) => (
                  <div key={typeData.type} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{typeData.type}</span>
                        <span className="text-sm text-gray-600">
                          {typeData.completed}/{typeData.count} completed
                        </span>
                      </div>
                      <Progress 
                        value={typeData.count > 0 ? (typeData.completed / typeData.count) * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="priority" className="mt-6">
              <div className="space-y-4">
                {tasksByPriority.map((priorityData) => (
                  <div key={priorityData.priority} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{priorityData.priority} Priority</span>
                          <Badge variant={priorityData.priority === 'High' ? 'destructive' : 
                                        priorityData.priority === 'Medium' ? 'default' : 'secondary'}>
                            {priorityData.count} tasks
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-600">
                          {priorityData.completed}/{priorityData.count} completed
                        </span>
                      </div>
                      <Progress 
                        value={priorityData.count > 0 ? (priorityData.completed / priorityData.count) * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};