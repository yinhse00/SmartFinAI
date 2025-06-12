
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px]">
      {/* Top Row - Main Analysis Sections */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 h-80">
        <StructureRecommendationBox results={results} />
        <CostAnalysisBox results={results} />
        <ExecutionTimetableBox results={results} />
      </div>
      
      {/* Bottom Row - Impact, Compliance, and Chat */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 h-96">
        <ShareholdingImpactBox results={results} />
        <RegulatoryComplianceBox results={results} />
        <DealStructuringChatbox results={results} onResultsUpdate={onResultsUpdate} />
      </div>
    </div>
  );
};
