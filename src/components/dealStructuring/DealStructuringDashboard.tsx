
import { AnalysisResults } from './AIAnalysisResults';
import { StructureRecommendationBox } from './sections/StructureRecommendationBox';
import { CostAnalysisBox } from './sections/CostAnalysisBox';
import { ExecutionTimetableBox } from './sections/ExecutionTimetableBox';
import { ShareholdingImpactBox } from './sections/ShareholdingImpactBox';
import { RegulatoryComplianceBox } from './sections/RegulatoryComplianceBox';
import { DealStructuringChatbox } from './sections/DealStructuringChatbox';

interface DealStructuringDashboardProps {
  results: AnalysisResults;
  onResultsUpdate: (updatedResults: AnalysisResults) => void;
}

export const DealStructuringDashboard = ({ results, onResultsUpdate }: DealStructuringDashboardProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:grid-rows-3 lg:items-start">
      {/* Row 1, Col 1: Structure Recommendation */}
      <div className="lg:col-start-1 lg:row-start-1">
        <StructureRecommendationBox results={results} />
      </div>
      
      {/* Row 1, Col 2: Cost Analysis */}
      <div className="lg:col-start-2 lg:row-start-1">
        <CostAnalysisBox results={results} />
      </div>
      
      {/* Row 1-3, Col 3: Chat (spans all 3 rows) */}
      <div className="lg:col-start-3 lg:row-start-1 lg:row-span-3">
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
      
      {/* Row 3, Col 1: Execution Timetable - moved up with larger negative margin */}
      <div className="lg:col-start-1 lg:row-start-3 lg:-mt-12">
        <ExecutionTimetableBox results={results} />
      </div>
    </div>
  );
};
