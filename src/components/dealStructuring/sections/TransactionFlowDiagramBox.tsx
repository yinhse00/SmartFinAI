
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisResults } from '../AIAnalysisResults';
import { transactionFlowConverter } from '@/services/dealStructuring/transactionFlowConverter';
import EnhancedTransactionFlowDiagram from '../flow/EnhancedTransactionFlowDiagram';
import { OptimizationResult } from '@/services/dealStructuring/optimizationEngine';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';
import { Maximize2 } from 'lucide-react';

interface TransactionFlowDiagramBoxProps {
  results: AnalysisResults;
  optimizationResult?: OptimizationResult;
  originalDescription?: string; // Add original description prop
}

export const TransactionFlowDiagramBox = ({ 
  results, 
  optimizationResult, 
  originalDescription 
}: TransactionFlowDiagramBoxProps) => {
  // Convert analysis results to transaction flow format with original description
  const transactionFlow = transactionFlowConverter.convertToTransactionFlow(
    results, 
    optimizationResult, 
    undefined, // classification
    originalDescription
  );

  const diagramContent = (
    <div className="h-full w-full">
      <EnhancedTransactionFlowDiagram transactionFlow={transactionFlow} />
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Transaction Flow</CardTitle>
          <EnlargedContentDialog
            title="Transaction Flow Diagram"
            size="full"
            enlargedContent={
              <div className="h-[80vh] w-full">
                <EnhancedTransactionFlowDiagram transactionFlow={transactionFlow} />
              </div>
            }
          >
            <button
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Expand diagram"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </EnlargedContentDialog>
        </div>
      </CardHeader>
      <CardContent className="p-4 h-[400px]">
        {diagramContent}
      </CardContent>
    </Card>
  );
};
