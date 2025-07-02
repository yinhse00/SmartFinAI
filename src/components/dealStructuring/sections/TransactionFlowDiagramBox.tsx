
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisResults } from '../AIAnalysisResults';
import { convertAnalysisToTransactionFlow } from '@/services/dealStructuring/transactionFlowConverter';
import EnhancedTransactionFlowDiagram from '../flow/EnhancedTransactionFlowDiagram';
import { OptimizationResult } from '@/services/dealStructuring/optimizationEngine';
import { useState } from 'react';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';
import { Maximize2 } from 'lucide-react';
import { extractEntityNames } from '@/services/dealStructuring/converterUtils/entityHelpers';
import { ExtractedUserInputs } from '@/services/dealStructuring/enhancedAiAnalysisService';
import { CalculationDebugger } from '../CalculationDebugger';

interface TransactionFlowDiagramBoxProps {
  results: AnalysisResults;
  optimizationResult?: OptimizationResult;
  userInputs?: ExtractedUserInputs;
}

export const TransactionFlowDiagramBox = ({ results, optimizationResult, userInputs }: TransactionFlowDiagramBoxProps) => {
  // Extract entity names using the proper helper function that returns EntityNames interface
  const entityNames = extractEntityNames(results);
  
  // CRITICAL: Pass userInputs to the converter for proper normalization 
  const transactionFlow = convertAnalysisToTransactionFlow(results, entityNames, userInputs);

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
      <CardContent className="space-y-4 p-4">
        {/* Transaction flow diagram */}
        <div className="h-[400px]">
          {diagramContent}
        </div>
      </CardContent>
    </Card>
  );
};
