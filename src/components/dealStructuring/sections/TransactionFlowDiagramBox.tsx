
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisResults } from '../AIAnalysisResults';
import { convertAnalysisToTransactionFlow } from '@/services/dealStructuring/transactionFlowConverter';
import EnhancedTransactionFlowDiagram from '../flow/EnhancedTransactionFlowDiagram';
import { OptimizationResult } from '@/services/dealStructuring/optimizationEngine';
import { useMemo, useState } from 'react';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';
import { Maximize2 } from 'lucide-react';
import { extractEntityNames } from '@/services/dealStructuring/converterUtils/entityHelpers';
import { ExtractedUserInputs } from '@/services/dealStructuring/enhancedAiAnalysisService';
import { CalculationDebugger } from '../CalculationDebugger';
import Mermaid from '@/components/mermaid/Mermaid';
import { buildMermaidTransactionFlowVertical } from '../flow/mermaid/buildMermaidTransactionFlowVertical';

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

  const [view, setView] = useState<'mermaid' | 'interactive'>('mermaid');
  const mermaidChart = useMemo(() => buildMermaidTransactionFlowVertical(transactionFlow), [transactionFlow]);

  const diagramContent = (
    <div className="h-full w-full">
      {view === 'mermaid' ? (
        <Mermaid chart={mermaidChart} />
      ) : (
        <EnhancedTransactionFlowDiagram transactionFlow={transactionFlow} />
      )}
    </div>
  );


  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Transaction Flow</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex rounded border">
              <button
                onClick={() => setView('mermaid')}
                className={`px-2 py-1 text-sm ${view === 'mermaid' ? 'bg-gray-100' : ''}`}
                title="Mermaid (Vertical)"
              >
                Mermaid
              </button>
              <button
                onClick={() => setView('interactive')}
                className={`px-2 py-1 text-sm border-l ${view === 'interactive' ? 'bg-gray-100' : ''}`}
                title="Interactive (ReactFlow)"
              >
                Interactive
              </button>
            </div>
            <EnlargedContentDialog
              title="Transaction Flow Diagram"
              size="full"
              enlargedContent={
                <div className="h-[80vh] w-full">
                  {view === 'mermaid' ? (
                    <Mermaid chart={mermaidChart} />
                  ) : (
                    <EnhancedTransactionFlowDiagram transactionFlow={transactionFlow} />
                  )}
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
