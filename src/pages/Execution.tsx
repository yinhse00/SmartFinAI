import MainLayout from '@/components/layout/MainLayout';
import { ExecutionControlCenter } from '@/components/execution/ExecutionControlCenter';
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { ExecutionPlan } from '@/services/execution/executionPlanExtractor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Execution = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null);

  useEffect(() => {
    // Get analysis results from URL params or localStorage
    const analysisData = searchParams.get('analysis');
    if (analysisData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(analysisData));
        setAnalysisResults(parsed);
      } catch (error) {
        console.error('Error parsing analysis data:', error);
      }
    } else {
      // Try to get from localStorage as fallback
      const stored = localStorage.getItem('executionAnalysisResults');
      if (stored) {
        try {
          setAnalysisResults(JSON.parse(stored));
        } catch (error) {
          console.error('Error parsing stored analysis data:', error);
        }
      }
    }
  }, [searchParams]);

  const handleExecutionStart = (plan: ExecutionPlan) => {
    setExecutionPlan(plan);
    // Store execution plan for future access
    localStorage.setItem('currentExecutionPlan', JSON.stringify(plan));
  };

  const handleBackToAnalysis = () => {
    navigate('/deal-structuring');
  };

  if (!analysisResults) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Execution Control Center
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="mb-4">
                  <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Transaction Analysis Found</h3>
                  <p className="text-muted-foreground mb-6">
                    You need to complete a transaction analysis before accessing the execution center.
                  </p>
                  <Button onClick={() => navigate('/deal-structuring')}>
                    Start Transaction Analysis
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-4">
        {/* Header with navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBackToAnalysis}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Analysis
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Execution Control Center</h1>
                <p className="text-muted-foreground">
                  Manage and track your transaction execution plan
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Execution Control Center - Full Width */}
        <div className="space-y-6">
          <ExecutionControlCenter
            results={analysisResults}
            onExecutionStart={handleExecutionStart}
          />
          
          {executionPlan && (
            <Card>
              <CardHeader>
                <CardTitle>Execution Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{executionPlan.tasks.length}</div>
                    <div className="text-sm text-muted-foreground">Total Tasks</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{executionPlan.totalEstimatedDays}</div>
                    <div className="text-sm text-muted-foreground">Estimated Days</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{executionPlan.milestones.length}</div>
                    <div className="text-sm text-muted-foreground">Key Milestones</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Execution;