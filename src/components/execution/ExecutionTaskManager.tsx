import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  Clock, 
  Users, 
  AlertTriangle, 
  Play, 
  Pause,
  FileText,
  Calendar
} from 'lucide-react';
import { ExecutionTask, ExecutionPlan } from '@/services/execution/executionPlanExtractor';

interface ExecutionTaskManagerProps {
  executionPlan: ExecutionPlan;
  onTaskUpdate: (taskId: string, status: ExecutionTask['status']) => void;
  onPlanUpdate: (plan: ExecutionPlan) => void;
}

export const ExecutionTaskManager = ({ 
  executionPlan, 
  onTaskUpdate, 
  onPlanUpdate 
}: ExecutionTaskManagerProps) => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const getStatusIcon = (status: ExecutionTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ExecutionTask['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: ExecutionTask['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getTypeColor = (type: ExecutionTask['type']) => {
    switch (type) {
      case 'regulatory':
        return 'bg-purple-100 text-purple-800';
      case 'financial':
        return 'bg-blue-100 text-blue-800';
      case 'legal':
        return 'bg-indigo-100 text-indigo-800';
      case 'operational':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const completedTasks = executionPlan.tasks.filter(task => task.status === 'completed').length;
  const totalTasks = executionPlan.tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleTaskStatusChange = (taskId: string, newStatus: ExecutionTask['status']) => {
    onTaskUpdate(taskId, newStatus);
  };

  const canStartTask = (task: ExecutionTask) => {
    return task.dependencies.every(depId => 
      executionPlan.tasks.find(t => t.id === depId)?.status === 'completed'
    );
  };

  const criticalPathTasks = new Set(executionPlan.criticalPath);

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Execution Overview</span>
            <div className="flex items-center gap-4 text-sm">
              <span>{completedTasks}/{totalTasks} Tasks</span>
              <span>{executionPlan.totalEstimatedDays} Days</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{progressPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          <p className="text-sm text-muted-foreground">
            {executionPlan.description}
          </p>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {executionPlan.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTask === task.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  } ${criticalPathTasks.has(task.id) ? 'ring-2 ring-orange-200' : ''}`}
                  onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      {criticalPathTasks.has(task.id) && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                          Critical Path
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>
                      <Badge className={`text-xs ${getTypeColor(task.type)}`}>
                        {task.type}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {task.estimatedDays} days
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {task.stakeholders.length} stakeholders
                      </span>
                      {task.documents && task.documents.length > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {task.documents.length} docs
                        </span>
                      )}
                    </div>
                    
                    <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {selectedTask === task.id && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      <p className="text-sm">{task.description}</p>
                      
                      {task.stakeholders.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium mb-1">Stakeholders:</h5>
                          <div className="flex flex-wrap gap-1">
                            {task.stakeholders.map((stakeholder, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {stakeholder}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {task.dependencies.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium mb-1">Dependencies:</h5>
                          <div className="flex flex-wrap gap-1">
                            {task.dependencies.map((depId) => {
                              const depTask = executionPlan.tasks.find(t => t.id === depId);
                              return depTask ? (
                                <Badge 
                                  key={depId} 
                                  variant="outline" 
                                  className={`text-xs ${
                                    depTask.status === 'completed' 
                                      ? 'text-green-700 border-green-300' 
                                      : 'text-gray-700'
                                  }`}
                                >
                                  {depTask.title}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {task.documents && task.documents.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium mb-1">Required Documents:</h5>
                          <div className="flex flex-wrap gap-1">
                            {task.documents.map((doc, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        {task.status === 'pending' && canStartTask(task) && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskStatusChange(task.id, 'in_progress');
                            }}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start Task
                          </Button>
                        )}
                        
                        {task.status === 'in_progress' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskStatusChange(task.id, 'pending');
                              }}
                            >
                              <Pause className="h-3 w-3 mr-1" />
                              Pause
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskStatusChange(task.id, 'completed');
                              }}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                          </>
                        )}

                        {task.status === 'pending' && !canStartTask(task) && (
                          <Button size="sm" disabled>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Waiting for Dependencies
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Milestones */}
      {executionPlan.milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {executionPlan.milestones.map((milestone) => {
                const milestoneTasksCompleted = milestone.taskIds.filter(taskId =>
                  executionPlan.tasks.find(t => t.id === taskId)?.status === 'completed'
                ).length;
                const milestoneProgress = milestone.taskIds.length > 0 
                  ? (milestoneTasksCompleted / milestone.taskIds.length) * 100 
                  : 0;

                return (
                  <div key={milestone.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-sm">{milestone.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {milestone.date.toLocaleDateString()} • {milestoneTasksCompleted}/{milestone.taskIds.length} tasks
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground mb-1">{milestoneProgress.toFixed(0)}%</div>
                      <Progress value={milestoneProgress} className="w-20 h-2" />
                    </div>
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