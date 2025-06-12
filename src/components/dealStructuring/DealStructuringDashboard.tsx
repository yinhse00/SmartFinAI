
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
    <div className="space-y-6">
      {/* Top Row: Structure, Cost, and Chat (Chat spans 2 rows) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StructureRecommendationBox results={results} />
        <CostAnalysisBox results={results} />
        
        <div className="lg:row-span-3">
          <DealStructuringChatbox results={results} onResultsUpdate={onResultsUpdate} />
        </div>
      </div>
      
      {/* Second Row: Shareholding and Regulatory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ShareholdingImpactBox results={results} />
        <RegulatoryComplianceBox results={results} />
        <div></div> {/* Empty space for chat column */}
      </div>
      
      {/* Third Row: Execution Timetable */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ExecutionTimetableBox results={results} />
        <div></div> {/* Empty space */}
        <div></div> {/* Empty space for chat column */}
      </div>
    </div>
  );
};
