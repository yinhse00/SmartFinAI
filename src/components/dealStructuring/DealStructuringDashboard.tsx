
import { AnalysisResults } from './AIAnalysisResults';
import { StructureRecommendationBox } from './sections/StructureRecommendationBox';
import { CostAnalysisBox } from './sections/CostAnalysisBox';
import { ExecutionTimetableBox } from './sections/ExecutionTimetableBox';
import { ShareholdingImpactBox } from './sections/ShareholdingImpactBox';
import { RegulatoryComplianceBox } from './sections/RegulatoryComplianceBox';
import { DealStructuringChatbox } from './sections/DealStructuringChatbox';
import { TransactionStructureDiagramBox } from './sections/TransactionStructureDiagramBox';

interface DealStructuringDashboardProps {
  results: AnalysisResults;
  onResultsUpdate: (updatedResults: AnalysisResults) => void;
}

export const DealStructuringDashboard = ({ results, onResultsUpdate }: DealStructuringDashboardProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:grid-rows-4 lg:items-start">
      {/* Row 1, Col 1: Structure Recommendation */}
      <div className="lg:col-start-1 lg:row-start-1">
        <StructureRecommendationBox results={results} />
      </div>
      
      {/* Row 1, Col 2: Cost Analysis */}
      <div className="lg:col-start-2 lg:row-start-1">
        <CostAnalysisBox results={results} />
      </div>
      
      {/* Row 1-4, Col 3: Chat (spans all 4 rows) */}
      <div className="lg:col-start-3 lg:row-start-1 lg:row-span-4">
        <DealStructuringChatbox results={results} onResultsUpdate={onResultsUpdate} />
      </div>
      
      {/* Row 2, Col 1: Shareholding Impact */}
      <div className="lg:col-start-1 lg:row-start-2">
        <ShareholdingImpactBox results={results} />
      </div>
      
      {/* Row 2, Col 2: Regulatory Compliance */}
      <div className="lg:col-start-2 lg:row-start-2">
        <RegulatoryComplianceBox results={results} />
      </div>
      
      {/* Row 3, Col 1: Execution Timetable */}
      <div className="lg:col-start-1 lg:row-start-3">
        <ExecutionTimetableBox results={results} />
      </div>

      {/* Row 3, Col 2: Transaction Structure Diagram */}
      <div className="lg:col-start-2 lg:row-start-3">
        <TransactionStructureDiagramBox results={results} />
      </div>
    </div>
  );
};
