
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, AlertTriangle, CheckCircle } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import CombinedTransactionFlowDiagram from '../flow/CombinedTransactionFlowDiagram';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';
import { transactionFlowConverter } from '@/services/dealStructuring/transactionFlowConverter';
import { transactionDataValidator } from '@/services/dealStructuring/transactionDataValidator';
import { Badge } from '@/components/ui/badge';

interface TransactionFlowDiagramBoxProps {
  results: AnalysisResults;
}

const ValidationIndicator = ({ results }: { results: AnalysisResults }) => {
  const validation = transactionDataValidator.validateConsistency(results);
  
  if (validation.isValid && validation.warnings.length === 0) {
    return (
      <Badge variant="outline" className="text-green-600 border-green-600">
        <CheckCircle className="h-3 w-3 mr-1" />
        Data Validated
      </Badge>
    );
  }

  if (validation.warnings.length > 0) {
    return (
      <Badge variant="outline" className="text-orange-600 border-orange-600">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {validation.warnings.length} Warning{validation.warnings.length > 1 ? 's' : ''}
      </Badge>
    );
  }

  return null;
};

const EnlargedFlowContent = ({ results }: { results: AnalysisResults }) => {
  const transactionFlow = transactionFlowConverter.convertToTransactionFlow(results);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <div className="h-[700px]">
          <CombinedTransactionFlowDiagram 
            transactionFlow={transactionFlow}
          />
        </div>
      </div>
    </div>
  );
};

export const TransactionFlowDiagramBox: React.FC<TransactionFlowDiagramBoxProps> = ({ results }) => {
  const transactionFlow = transactionFlowConverter.convertToTransactionFlow(results);

  return (
    <Card className="h-[500px]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-blue-500" />
              Transaction Structure Diagram
            </CardTitle>
            <ValidationIndicator results={results} />
          </div>
          <EnlargedContentDialog
            title="Complete Transaction Structure & Flow"
            enlargedContent={<EnlargedFlowContent results={results} />}
            size="full"
          >
            <div />
          </EnlargedContentDialog>
        </div>
      </CardHeader>
      <CardContent className="h-[400px]">
        <div className="h-full">
          <CombinedTransactionFlowDiagram 
            transactionFlow={transactionFlow}
          />
        </div>
      </CardContent>
    </Card>
  );
};
