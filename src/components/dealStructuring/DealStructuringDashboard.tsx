import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TransactionFlowDiagramBox } from './sections/TransactionFlowDiagramBox';
import { TransactionStructureDiagramBox } from './sections/TransactionStructureDiagramBox';
import { CostsBreakdownBox } from './sections/CostsBreakdownBox';
import { TimetableAnalysisBox } from './sections/TimetableAnalysisBox';
import { ComplianceConsiderationsBox } from './sections/ComplianceConsiderationsBox';
import { StructureRecommendationBox } from './sections/StructureRecommendationBox';
import { AnalysisResults } from '../AIAnalysisResults';
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
    <div className="space-y-6">
      {/* Top-level Recommendations and Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StructureRecommendationBox results={results} />
        <CostsBreakdownBox results={results} />
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
        <TimetableAnalysisBox results={results} />
        <ComplianceConsiderationsBox results={results} />
      </div>
    </div>
  );
};
