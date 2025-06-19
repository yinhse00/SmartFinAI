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
  console.log('=== DealStructuringDashboard ===');
  console.log('UserInputs received:', userInputs);
  
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
          
          {/* Row 4: Execution Timetable, Regulatory Compliance */}
          <div>
            <ExecutionTimetableBox results={results} />
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
