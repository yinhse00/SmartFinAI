import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { ExecutionPlan, ExecutionTask } from '@/services/execution/executionPlanExtractor';

interface ExecutionProgressTrackerProps {
  executionPlan: ExecutionPlan;
}

export const ExecutionProgressTracker = ({ executionPlan }: ExecutionProgressTrackerProps) => {
  const getTasksByStatus = () => {
    const completed = executionPlan.tasks.filter(t => t.status === 'completed');
    const inProgress = executionPlan.tasks.filter(t => t.status === 'in_progress');
    const blocked = executionPlan.tasks.filter(t => t.status === 'blocked');
    const pending = executionPlan.tasks.filter(t => t.status === 'pending');
    
    return { completed, inProgress, blocked, pending };
  };

  const getTasksByType = () => {
    const types = ['regulatory', 'financial', 'legal', 'operational', 'documentation'] as const;
    return types.map(type => ({
      type,
      tasks: executionPlan.tasks.filter(t => t.type === type),
      completed: executionPlan.tasks.filter(t => t.type === type && t.status === 'completed').length
    }));
  };

  const getTasksByPriority = () => {
    const priorities = ['high', 'medium', 'low'] as const;
    return priorities.map(priority => ({
      priority,
      tasks: executionPlan.tasks.filter(t => t.priority === priority),
      completed: executionPlan.tasks.filter(t => t.priority === priority && t.status === 'completed').length
    }));
  };

  const getCriticalPathProgress = () => {
    if (executionPlan.criticalPath.length === 0) return 0;
    
    const completedCriticalTasks = executionPlan.criticalPath.filter(taskId =>
      executionPlan.tasks.find(t => t.id === taskId)?.status === 'completed'
    ).length;
    
    return (completedCriticalTasks / executionPlan.criticalPath.length) * 100;
  };

  const getEstimatedCompletion = () => {
    const { completed, inProgress, pending } = getTasksByStatus();
    const remainingDays = pending.reduce((sum, task) => sum + task.estimatedDays, 0) +
                         inProgress.reduce((sum, task) => sum + (task.estimatedDays * 0.5), 0); // Assume in-progress tasks are 50% done
    
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + remainingDays);
    
    return completionDate;
  };

  const tasksByStatus = getTasksByStatus();
  const tasksByType = getTasksByType();
  const tasksByPriority = getTasksByPriority();
  const criticalPathProgress = getCriticalPathProgress();
  const estimatedCompletion = getEstimatedCompletion();
  const overallProgress = (tasksByStatus.completed.length / executionPlan.tasks.length) * 100;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'regulatory': return 'bg-purple-100 text-purple-800';
      case 'financial': return 'bg-blue-100 text-blue-800';
      case 'legal': return 'bg-indigo-100 text-indigo-800';
      case 'operational': return 'bg-green-100 text-green-800';
      case 'documentation': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Execution Progress</span>
              <span>{overallProgress.toFixed(0)}% Complete</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
          
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="text-2xl font-bold text-green-600">{tasksByStatus.completed.length}</div>
              <div className="text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{tasksByStatus.inProgress.length}</div>
              <div className="text-muted-foreground">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{tasksByStatus.blocked.length}</div>
              <div className="text-muted-foreground">Blocked</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{tasksByStatus.pending.length}</div>
              <div className="text-muted-foreground">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Path Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Critical Path Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Critical Path Completion</span>
                <span>{criticalPathProgress.toFixed(0)}%</span>
              </div>
              <Progress value={criticalPathProgress} className="h-3" />
            </div>
            
            <div className="text-sm text-muted-foreground">
              {executionPlan.criticalPath.length} critical tasks • 
              {executionPlan.criticalPath.filter(taskId =>
                executionPlan.tasks.find(t => t.id === taskId)?.status === 'completed'
              ).length} completed
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline and Completion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline & Completion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-1">Original Estimate</div>
              <div className="text-2xl font-bold">{executionPlan.totalEstimatedDays}</div>
              <div className="text-xs text-muted-foreground">days total</div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Estimated Completion</div>
              <div className="text-lg font-bold flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {estimatedCompletion.toLocaleDateString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.ceil((estimatedCompletion.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress by Task Type */}
      <Card>
        <CardHeader>
          <CardTitle>Progress by Task Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasksByType.map(({ type, tasks, completed }) => {
              const progress = tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
              return (
                <div key={type} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getTypeColor(type)}`}>
                        {type}
                      </Badge>
                      <span className="text-sm">{completed}/{tasks.length} tasks</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Progress by Priority */}
      <Card>
        <CardHeader>
          <CardTitle>Progress by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasksByPriority.map(({ priority, tasks, completed }) => {
              const progress = tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
              return (
                <div key={priority} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getPriorityColor(priority)}`}>
                        {priority} priority
                      </Badge>
                      <span className="text-sm">{completed}/{tasks.length} tasks</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Milestones Progress */}
      {executionPlan.milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Milestone Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {executionPlan.milestones.map((milestone) => {
                const milestoneTasksCompleted = milestone.taskIds.filter(taskId =>
                  executionPlan.tasks.find(t => t.id === taskId)?.status === 'completed'
                ).length;
                const milestoneProgress = milestone.taskIds.length > 0 
                  ? (milestoneTasksCompleted / milestone.taskIds.length) * 100 
                  : 0;
                const isCompleted = milestoneProgress === 100;
                const isOverdue = new Date() > milestone.date && !isCompleted;

                return (
                  <div key={milestone.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : isOverdue ? (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="font-medium text-sm">{milestone.name}</span>
                        {isOverdue && (
                          <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>{milestone.date.toLocaleDateString()}</div>
                        <div>{milestoneTasksCompleted}/{milestone.taskIds.length} tasks</div>
                      </div>
                    </div>
                    <Progress value={milestoneProgress} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};