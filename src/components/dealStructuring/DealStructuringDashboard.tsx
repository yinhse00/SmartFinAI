import { AnalysisResults } from './AIAnalysisResults';
import { TransactionSummaryBox } from './sections/TransactionSummaryBox';
import { StructureRecommendationBox } from './sections/StructureRecommendationBox';
import { CostAnalysisBox } from './sections/CostAnalysisBox';
import { ShareholdingImpactBox } from './sections/ShareholdingImpactBox';
import { RegulatoryComplianceBox } from './sections/RegulatoryComplianceBox';
import { DealStructuringChatbox } from './sections/DealStructuringChatbox';
import { TransactionFlowDiagramBox } from './sections/TransactionFlowDiagramBox';
import { ValuationAnalysisBox } from './sections/ValuationAnalysisBox';
import { OptimizationResult } from '@/services/dealStructuring/optimizationEngine';
import { ExtractedUserInputs } from '@/services/dealStructuring/enhancedAiAnalysisService';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DealStructuringDashboardProps {
  results: AnalysisResults;
  onResultsUpdate: (updatedResults: AnalysisResults) => void;
  optimizationResult?: OptimizationResult;
  userInputs?: ExtractedUserInputs;
  transactionDescription?: string;
}

export const DealStructuringDashboard = ({ 
  results, 
  onResultsUpdate, 
  optimizationResult,
  userInputs,
  transactionDescription 
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
      
      <div className="flex gap-4 h-[85vh]">
        {/* Left side: 3x2 grid of analysis boxes */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          {/* Row 1: Structure Recommendation, Transaction Flow */}
          <div>
            <StructureRecommendationBox 
              results={results} 
              userInputs={userInputs}
              description={transactionDescription}
            />
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
          
          {/* Row 3: Cost Analysis, Regulatory Compliance */}
          <div>
            <CostAnalysisBox results={results} />
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
