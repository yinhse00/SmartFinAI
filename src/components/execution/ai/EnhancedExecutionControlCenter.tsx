import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Mail, 
  BarChart3, 
  Users, 
  Settings, 
  Zap,
  Brain,
  MessageSquare
} from 'lucide-react';
import { ExecutionControlCenter } from '../ExecutionControlCenter';
import { AIEmailInterface } from './AIEmailInterface';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';

interface EnhancedExecutionControlCenterProps {
  results: AnalysisResults;
  chatHistory?: Array<{
    question: string;
    response: string;
    timestamp: Date;
  }>;
  onExecutionStart?: (plan: any) => void;
}

export const EnhancedExecutionControlCenter = ({ 
  results, 
  chatHistory = [], 
  onExecutionStart 
}: EnhancedExecutionControlCenterProps) => {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('execution');

  const handleProjectChange = (projectId: string) => {
    setCurrentProjectId(projectId);
  };

  const handleTasksCreated = (tasks: any[]) => {
    console.log('Tasks created from email:', tasks);
    // Integrate with existing task management
  };

  const handleDocumentGenerated = (document: any) => {
    console.log('Document generated from email:', document);
    // Integrate with document management
  };

  return (
    <div className="space-y-6">
      {/* AI-Powered Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI-Powered Execution Control Center
          </CardTitle>
          <p className="text-muted-foreground">
            Intelligent task management, email automation, and stakeholder communication
          </p>
        </CardHeader>
      </Card>

      {/* Enhanced Interface Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="execution" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            Execution
          </TabsTrigger>
          <TabsTrigger value="ai-email" className="flex items-center gap-1">
            <Mail className="h-4 w-4" />
            AI Email
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="flex items-center gap-1">
            <Bot className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="stakeholders" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Stakeholders
          </TabsTrigger>
          <TabsTrigger value="ai-settings" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            AI Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="execution" className="mt-6">
          <ExecutionControlCenter
            results={results}
            chatHistory={chatHistory}
            onExecutionStart={(plan) => {
              onExecutionStart?.(plan);
              if (plan.projectId) {
                setCurrentProjectId(plan.projectId);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="ai-email" className="mt-6">
          {currentProjectId ? (
            <AIEmailInterface
              projectId={currentProjectId}
              onTasksCreated={handleTasksCreated}
              onDocumentGenerated={handleDocumentGenerated}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Create or load a project to access AI email features</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai-insights" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  AI-powered insights and recommendations will appear here based on project activity.
                </p>
                <Button className="mt-4" disabled>
                  <Bot className="h-4 w-4 mr-2" />
                  Analyze Project
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Predictive Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Risk predictions and timeline analysis powered by AI.
                </p>
                <Button className="mt-4" disabled>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Forecast
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stakeholders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Intelligent Stakeholder Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                AI-powered stakeholder analysis and communication optimization.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configure AI behavior, automation rules, and integration settings.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};