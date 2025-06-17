
import { AnalysisResults } from './AIAnalysisResults';
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

interface DealStructuringDashboardProps {
  results: AnalysisResults;
  onResultsUpdate: (updatedResults: AnalysisResults) => void;
  optimizationResult?: OptimizationResult;
}

export const DealStructuringDashboard = ({ 
  results, 
  onResultsUpdate, 
  optimizationResult 
}: DealStructuringDashboardProps) => {
  return (
    <div className="flex gap-6 h-screen p-6 bg-gray-50">
      {/* Left side: 4x2 grid of analysis boxes */}
      <div className="flex-1 grid grid-cols-2 gap-4 auto-rows-fr">
        {/* Row 1: Structure Recommendation, Transaction Flow */}
        <div className="h-56">
          <StructureRecommendationBox results={results} />
        </div>
        <div className="h-56">
          <TransactionFlowDiagramBox 
            results={results} 
            optimizationResult={optimizationResult}
          />
        </div>
        
        {/* Row 2: Valuation Analysis, Shareholding Impact */}
        <div className="h-56">
          <ValuationAnalysisBox results={results} />
        </div>
        <div className="h-56">
          <ShareholdingImpactBox results={results} />
        </div>
        
        {/* Row 3: Cost Analysis, Document Preparation */}
        <div className="h-56">
          <CostAnalysisBox results={results} />
        </div>
        <div className="h-56">
          <DocumentPreparationBox results={results} />
        </div>
        
        {/* Row 4: Execution Timetable, Regulatory Compliance */}
        <div className="h-56">
          <ExecutionTimetableBox results={results} />
        </div>
        <div className="h-56">
          <RegulatoryComplianceBox results={results} />
        </div>
      </div>
      
      {/* Right side: Chat box */}
      <div className="w-96 h-full">
        <DealStructuringChatbox results={results} onResultsUpdate={onResultsUpdate} />
      </div>
    </div>
  );
};
