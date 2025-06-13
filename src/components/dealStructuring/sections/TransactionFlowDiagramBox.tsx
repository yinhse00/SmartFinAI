
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';
import { grokStructureExtractor } from '@/services/dealStructuring/grokStructureExtractor';
import { Badge } from '@/components/ui/badge';
import EnhancedTransactionFlowDiagram from '../flow/EnhancedTransactionFlowDiagram';

interface TransactionFlowDiagramBoxProps {
  results: AnalysisResults;
}

const ValidationIndicator = ({ results }: { results: AnalysisResults }) => {
  const enhancedFlow = grokStructureExtractor.extractEnhancedTransactionFlow(results);
  const validation = enhancedFlow.validationResults;
  
  if (validation.isValid && validation.warnings.length === 0) {
    return (
      <Badge variant="outline" className="text-green-600 border-green-600">
        <CheckCircle className="h-3 w-3 mr-1" />
        Validated
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

  if (validation.errors.length > 0) {
    return (
      <Badge variant="outline" className="text-red-600 border-red-600">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {validation.errors.length} Error{validation.errors.length > 1 ? 's' : ''}
      </Badge>
    );
  }

  return null;
};

const EnlargedFlowContent = ({ results }: { results: AnalysisResults }) => {
  const enhancedFlow = grokStructureExtractor.extractEnhancedTransactionFlow(results);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <div className="h-[800px]">
          <EnhancedTransactionFlowDiagram transactionFlow={enhancedFlow} />
        </div>
      </div>
      
      {/* Transaction Details Panel */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-semibold text-gray-700">Transaction Type</div>
            <div className="text-gray-600">{enhancedFlow.transactionType}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700">Total Consideration</div>
            <div className="text-gray-600">
              {enhancedFlow.keyMetrics.currency} {(enhancedFlow.keyMetrics.totalConsideration / 1000000).toFixed(0)}M
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-700">Acquisition %</div>
            <div className="text-gray-600">{enhancedFlow.keyMetrics.acquisitionPercentage.toFixed(1)}%</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700">Control Change</div>
            <div className="text-gray-600">
              {enhancedFlow.keyMetrics.controlChange ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
        
        {enhancedFlow.validationResults.warnings.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="font-semibold text-yellow-800 mb-2">Data Validation Warnings:</div>
            <ul className="text-sm text-yellow-700 space-y-1">
              {enhancedFlow.validationResults.warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export const TransactionFlowDiagramBox: React.FC<TransactionFlowDiagramBoxProps> = ({ results }) => {
  const enhancedFlow = grokStructureExtractor.extractEnhancedTransactionFlow(results);

  return (
    <Card className="h-[500px]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-blue-500" />
              Enhanced Transaction Structure & Flow
            </CardTitle>
            <ValidationIndicator results={results} />
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              <Zap className="h-3 w-3 mr-1" />
              Grok 3 Powered
            </Badge>
          </div>
          <EnlargedContentDialog
            title="Complete Enhanced Transaction Structure & Flow Analysis"
            enlargedContent={<EnlargedFlowContent results={results} />}
            size="full"
          >
            <div />
          </EnlargedContentDialog>
        </div>
      </CardHeader>
      <CardContent className="h-[400px]">
        <div className="h-full">
          <EnhancedTransactionFlowDiagram transactionFlow={enhancedFlow} />
        </div>
      </CardContent>
    </Card>
  );
};
