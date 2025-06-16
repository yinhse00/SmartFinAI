
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TransactionFlowDiagramBox } from './sections/TransactionFlowDiagramBox';
import { TransactionStructureDiagramBox } from './sections/TransactionStructureDiagramBox';
import { CostAnalysisBox } from './sections/CostAnalysisBox';
import { ExecutionTimetableBox } from './sections/ExecutionTimetableBox';
import { RegulatoryComplianceBox } from './sections/RegulatoryComplianceBox';
import { StructureRecommendationBox } from './sections/StructureRecommendationBox';
import { DealStructuringChatbox } from './sections/DealStructuringChatbox';
import { AnalysisResults } from './AIAnalysisResults';
import { OptimizationResult } from '@/services/dealStructuring/optimizationEngine';

interface DealStructuringDashboardProps {
  results: AnalysisResults;
  onResultsUpdate?: (results: AnalysisResults) => void;
  optimizationResult?: OptimizationResult;
  originalDescription?: string;
}

export const DealStructuringDashboard = ({ 
  results, 
  onResultsUpdate, 
  optimizationResult,
  originalDescription 
}: DealStructuringDashboardProps) => {
  const handleResultsChange = (updatedResults: AnalysisResults) => {
    onResultsUpdate?.(updatedResults);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left Side - Analysis Boxes */}
      <div className="flex-1 space-y-6">
        {/* Top-level Recommendations and Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StructureRecommendationBox results={results} />
          <CostAnalysisBox results={results} />
        </div>

        {/* Transaction Flow Diagrams */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TransactionFlowDiagramBox 
            results={results} 
            optimizationResult={optimizationResult}
            originalDescription={originalDescription}
          />
          <TransactionStructureDiagramBox results={results} />
        </div>

        {/* Detailed Analysis and Compliance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExecutionTimetableBox results={results} />
          <RegulatoryComplianceBox results={results} />
        </div>
      </div>

      {/* Right Side - Chat Box */}
      <div className="w-full lg:w-96 flex-shrink-0">
        <DealStructuringChatbox 
          results={results} 
          onResultsUpdate={handleResultsChange}
        />
      </div>
    </div>
  );
};
