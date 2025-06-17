
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
    <div className="space-y-4">
      {/* Chat box at top */}
      <div className="w-full">
        <DealStructuringChatbox results={results} onResultsUpdate={onResultsUpdate} />
      </div>
      
      {/* 8 analysis boxes in 4x2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Row 1 */}
        <div className="lg:col-span-1">
          <StructureRecommendationBox results={results} />
        </div>
        
        <div className="lg:col-span-1">
          <CostAnalysisBox results={results} />
        </div>
        
        <div className="lg:col-span-1">
          <ValuationAnalysisBox results={results} />
        </div>
        
        <div className="lg:col-span-1">
          <DocumentPreparationBox results={results} />
        </div>
        
        {/* Row 2 */}
        <div className="lg:col-span-1">
          <ShareholdingImpactBox results={results} />
        </div>
        
        <div className="lg:col-span-1">
          <RegulatoryComplianceBox results={results} />
        </div>
        
        <div className="lg:col-span-1">
          <ExecutionTimetableBox results={results} />
        </div>

        <div className="lg:col-span-1">
          <TransactionFlowDiagramBox 
            results={results} 
            optimizationResult={optimizationResult}
          />
        </div>
      </div>
    </div>
  );
};
