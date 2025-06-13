
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import CombinedTransactionFlowDiagram from '../flow/CombinedTransactionFlowDiagram';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';
import { transactionFlowConverter } from '@/services/dealStructuring/transactionFlowConverter';
import { transactionDataValidator } from '@/services/dealStructuring/transactionDataValidator';
import { Badge } from '@/components/ui/badge';
import { OptimizationResult } from '@/services/dealStructuring/optimizationEngine';

interface TransactionFlowDiagramBoxProps {
  results: AnalysisResults;
  optimizationResult?: OptimizationResult;
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

const OptimizationIndicator = ({ optimizationResult }: { optimizationResult?: OptimizationResult }) => {
  if (!optimizationResult) return null;

  const score = optimizationResult.recommendedStructure.optimizationScore;
  const precedentCount = optimizationResult.marketIntelligence.precedentTransactions.length;

  return (
    <div className="flex gap-2">
      <Badge variant="outline" className="text-blue-600 border-blue-600">
        <TrendingUp className="h-3 w-3 mr-1" />
        Optimized: {(score * 100).toFixed(0)}%
      </Badge>
      {precedentCount > 0 && (
        <Badge variant="outline" className="text-purple-600 border-purple-600">
          {precedentCount} Precedents
        </Badge>
      )}
    </div>
  );
};

const EnlargedFlowContent = ({ results, optimizationResult }: { results: AnalysisResults; optimizationResult?: OptimizationResult }) => {
  const transactionFlow = transactionFlowConverter.convertToTransactionFlow(results, optimizationResult);

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

export const TransactionFlowDiagramBox: React.FC<TransactionFlowDiagramBoxProps> = ({ 
  results, 
  optimizationResult 
}) => {
  const transactionFlow = transactionFlowConverter.convertToTransactionFlow(results, optimizationResult);

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
            <OptimizationIndicator optimizationResult={optimizationResult} />
          </div>
          <EnlargedContentDialog
            title="Complete Transaction Structure & Flow"
            enlargedContent={<EnlargedFlowContent results={results} optimizationResult={optimizationResult} />}
            size="full"
          >
            <div />
          </EnlargedContentDialog>
        </div>
        {optimizationResult && (
          <div className="text-xs text-gray-600 mt-1">
            Showing: {optimizationResult.recommendedStructure.name}
          </div>
        )}
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
