import { AnalysisResults } from './AIAnalysisResults';
import { TransactionSummaryBox } from './sections/TransactionSummaryBox';
import { StructureRecommendationBox } from './sections/StructureRecommendationBox';
import { CostAnalysisBox } from './sections/CostAnalysisBox';
import { ExecutionTimetableBox } from './sections/ExecutionTimetableBox';
import { ShareholdingImpactBox } from './sections/ShareholdingImpactBox';
import { RegulatoryComplianceBox } from './sections/RegulatoryComplianceBox';
import { DealStructuringChatbox } from './sections/DealStructuringChatbox';
import { TransactionFlowDiagramBox } from './sections/TransactionFlowDiagramBox';
import { ValuationAnalysisBox } from './sections/ValuationAnalysisBox';
import { DocumentPreparationBox } from './sections/DocumentPreparationBox';
import { OptimizationResult } from '@/services/dealStructuring/optimizationEngine';
import { ExtractedUserInputs } from '@/services/dealStructuring/enhancedAiAnalysisService';
import { ExecutionPlan } from '@/services/execution/executionPlanExtractor';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DealStructuringDashboardProps {
  results: AnalysisResults;
  onResultsUpdate: (updatedResults: AnalysisResults) => void;
  optimizationResult?: OptimizationResult;
  userInputs?: ExtractedUserInputs;
}

export const DealStructuringDashboard = ({ 
  results, 
  onResultsUpdate, 
  optimizationResult,
  userInputs 
}: DealStructuringDashboardProps) => {
  const navigate = useNavigate();
  
  console.log('=== DealStructuringDashboard ===');
  console.log('UserInputs received:', userInputs);
  
  const handleGoToExecution = () => {
    // Store analysis results for the execution page
    localStorage.setItem('executionAnalysisResults', JSON.stringify(results));
    
    // Navigate to execution page
    navigate('/execution');
  };
  
  return (
    <div className="space-y-4">
      {/* Transaction Summary at the top */}
      <TransactionSummaryBox results={results} userInputs={userInputs} />
      
      <div className="flex gap-4 h-screen">
        {/* Left side: 4x2 grid of analysis boxes */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          {/* Row 1: Structure Recommendation, Transaction Flow */}
          <div>
            <StructureRecommendationBox results={results} />
          </div>
          <div>
            <TransactionFlowDiagramBox 
              results={results} 
              optimizationResult={optimizationResult}
              userInputs={userInputs}
            />
          </div>
          
          {/* Row 2: Valuation Analysis, Shareholding Impact */}
          <div>
            <ValuationAnalysisBox results={results} userInputs={userInputs} />
          </div>
          <div>
            <ShareholdingImpactBox results={results} />
          </div>
          
          {/* Row 3: Cost Analysis, Document Preparation */}
          <div>
            <CostAnalysisBox results={results} />
          </div>
          <div>
            <DocumentPreparationBox results={results} />
          </div>
          
          {/* Row 4: Execution Navigation, Regulatory Compliance */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Execution Planning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="mb-4">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Ready for Execution</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                      Generate and manage your execution plan in a dedicated interface with enhanced task management capabilities.
                    </p>
                  </div>
                  
                  <Button onClick={handleGoToExecution} className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Go to Execution Center
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <RegulatoryComplianceBox results={results} />
          </div>
        </div>
        
        {/* Right side: Chat box */}
        <div className="w-96">
          <DealStructuringChatbox results={results} onResultsUpdate={onResultsUpdate} />
        </div>
      </div>
    </div>
  );
};
