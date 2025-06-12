
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
    <div className="space-y-8">
      {/* Top Row: Structure, Cost, and Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <StructureRecommendationBox results={results} />
        <CostAnalysisBox results={results} />
        <div className="lg:row-span-2">
          <DealStructuringChatbox results={results} onResultsUpdate={onResultsUpdate} />
        </div>
      </div>
      
      {/* Second Row: Shareholding and Regulatory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ShareholdingImpactBox results={results} />
        <RegulatoryComplianceBox results={results} />
      </div>
      
      {/* Third Row: Execution Timetable */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <ExecutionTimetableBox results={results} />
      </div>
    </div>
  );
};
