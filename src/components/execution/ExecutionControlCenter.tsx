import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Settings, 
  Download, 
  BarChart3, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  FileText
} from 'lucide-react';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { ExecutionTaskManager } from './ExecutionTaskManager';
import { ExecutionProgressTracker } from './ExecutionProgressTracker';
import { executionPlanExtractor, ExecutionPlan, ExecutionTask, ChatAnalysisContext } from '@/services/execution/executionPlanExtractor';
import { useToast } from '@/hooks/use-toast';

interface ExecutionControlCenterProps {
  results: AnalysisResults;
  chatHistory?: Array<{
    question: string;
    response: string;
    timestamp: Date;
  }>;
  onExecutionStart: (plan: ExecutionPlan) => void;
}

export const ExecutionControlCenter = ({ 
  results, 
  chatHistory = [], 
  onExecutionStart 
}: ExecutionControlCenterProps) => {
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const generateExecutionPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const context: ChatAnalysisContext = {
        originalAnalysis: results,
        chatHistory: chatHistory,
        transactionType: results.transactionType || 'Transaction',
        targetCompany: results.corporateStructure?.entities?.[0]?.name || 'Target Company',
        acquiringCompany: results.corporateStructure?.entities?.[1]?.name || 'Acquiring Company'
      };

      const plan = await executionPlanExtractor.extractExecutionPlan(context);
      setExecutionPlan(plan);
      onExecutionStart(plan);
      setActiveTab('tasks');

      toast({
        title: "Execution Plan Generated",
        description: `Created ${plan.tasks.length} tasks with ${plan.totalEstimatedDays} day timeline`
      });
    } catch (error) {
      console.error('Error generating execution plan:', error);
      toast({
        title: "Plan Generation Failed",
        description: "Could not generate execution plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleTaskUpdate = (taskId: string, status: ExecutionTask['status']) => {
    if (!executionPlan) return;

    const updatedPlan = executionPlanExtractor.updateTaskStatus(executionPlan, taskId, status);
    setExecutionPlan(updatedPlan);

    toast({
      title: "Task Updated",
      description: `Task status changed to ${status.replace('_', ' ')}`
    });
  };

  const handlePlanUpdate = (plan: ExecutionPlan) => {
    setExecutionPlan(plan);
  };

  const exportExecutionPlan = () => {
    if (!executionPlan) return;

    const exportData = {
      ...executionPlan,
      exportedAt: new Date().toISOString(),
      transactionSummary: {
        type: results.transactionType,
        targetCompany: results.corporateStructure?.entities?.[0]?.name,
        dealValue: results.dealEconomics?.purchasePrice
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-plan-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Plan Exported",
      description: "Execution plan has been exported successfully"
    });
  };

  const getExecutionStats = () => {
    if (!executionPlan) return null;

    const completed = executionPlan.tasks.filter(t => t.status === 'completed').length;
    const inProgress = executionPlan.tasks.filter(t => t.status === 'in_progress').length;
    const blocked = executionPlan.tasks.filter(t => t.status === 'blocked').length;
    const pending = executionPlan.tasks.filter(t => t.status === 'pending').length;

    return { completed, inProgress, blocked, pending, total: executionPlan.tasks.length };
  };

  const stats = getExecutionStats();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Execution Control Center
          </div>
          <div className="flex items-center gap-2">
            {executionPlan && (
              <Button size="sm" variant="outline" onClick={exportExecutionPlan}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
            {!executionPlan && (
              <Button 
                size="sm" 
                onClick={generateExecutionPlan}
                disabled={isGeneratingPlan}
              >
                <Play className="h-4 w-4 mr-1" />
                {isGeneratingPlan ? 'Generating...' : 'Generate Plan'}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {!executionPlan ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Ready to Execute</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Generate an automated execution plan based on your transaction analysis. 
                The system will create actionable tasks, timelines, and stakeholder assignments.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
              <div className="text-center p-3 border rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <div className="text-xs font-medium">Smart Extraction</div>
                <div className="text-xs text-muted-foreground">From analysis & chat</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <div className="text-xs font-medium">Timeline Planning</div>
                <div className="text-xs text-muted-foreground">Critical path analysis</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <Users className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                <div className="text-xs font-medium">Stakeholder Mgmt</div>
                <div className="text-xs text-muted-foreground">Role assignments</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <FileText className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                <div className="text-xs font-medium">Documentation</div>
                <div className="text-xs text-muted-foreground">Required deliverables</div>
              </div>
            </div>

            <Button onClick={generateExecutionPlan} disabled={isGeneratingPlan}>
              <Play className="h-4 w-4 mr-2" />
              {isGeneratingPlan ? 'Generating Execution Plan...' : 'Generate Execution Plan'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Stats */}
            {stats && (
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{stats.inProgress}</div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-xl font-bold text-red-600">{stats.blocked}</div>
                  <div className="text-xs text-muted-foreground">Blocked</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-xl font-bold text-gray-600">{stats.pending}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
              </div>
            )}

            {/* Execution Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="progress" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Progress
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{executionPlan.title}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{executionPlan.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Total Tasks:</span> {executionPlan.tasks.length}
                      </div>
                      <div>
                        <span className="font-medium">Estimated Duration:</span> {executionPlan.totalEstimatedDays} days
                      </div>
                      <div>
                        <span className="font-medium">Critical Path:</span> {executionPlan.criticalPath.length} tasks
                      </div>
                      <div>
                        <span className="font-medium">Key Milestones:</span> {executionPlan.milestones.length}
                      </div>
                    </div>
                  </div>

                  {executionPlan.criticalPath.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">Critical Path</h5>
                      <div className="flex flex-wrap gap-1">
                        {executionPlan.criticalPath.map((taskId) => {
                          const task = executionPlan.tasks.find(t => t.id === taskId);
                          return task ? (
                            <Badge key={taskId} variant="outline" className="text-xs bg-orange-50 text-orange-700">
                              {task.title}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="mt-4">
                <ExecutionTaskManager
                  executionPlan={executionPlan}
                  onTaskUpdate={handleTaskUpdate}
                  onPlanUpdate={handlePlanUpdate}
                />
              </TabsContent>

              <TabsContent value="progress" className="mt-4">
                <ExecutionProgressTracker executionPlan={executionPlan} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};