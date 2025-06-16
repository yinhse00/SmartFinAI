
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';
import { useTransactionDataConsistency } from '@/hooks/useTransactionDataConsistency';

interface EnhancedShareholdingImpactBoxProps {
  results: AnalysisResults;
  reconciliationData?: {
    validation: {
      isValid: boolean;
      confidence: number;
      mismatches: any[];
      suggestions: string[];
    };
    reconciliationApplied: boolean;
    inputData: any;
  };
}

const ValidationStatusBadge = ({ reconciliationData }: { reconciliationData?: EnhancedShareholdingImpactBoxProps['reconciliationData'] }) => {
  if (!reconciliationData) {
    return (
      <Badge variant="outline" className="text-blue-600 border-blue-600">
        <Info className="h-3 w-3 mr-1" />
        Standard Analysis
      </Badge>
    );
  }

  const { validation, reconciliationApplied } = reconciliationData;

  if (validation.isValid && !reconciliationApplied) {
    return (
      <Badge variant="outline" className="text-green-600 border-green-600">
        <CheckCircle className="h-3 w-3 mr-1" />
        Input Validated
      </Badge>
    );
  }

  if (reconciliationApplied) {
    return (
      <Badge variant="outline" className="text-orange-600 border-orange-600">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Data Reconciled
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-red-600 border-red-600">
      <AlertTriangle className="h-3 w-3 mr-1" />
      Validation Issues
    </Badge>
  );
};

const EnlargedShareholdingContent = ({ results, reconciliationData }: { 
  results: AnalysisResults; 
  reconciliationData?: EnhancedShareholdingImpactBoxProps['reconciliationData'];
}) => (
  <div className="space-y-8 p-6">
    {/* Validation Status Section */}
    {reconciliationData && (
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="text-lg font-semibold mb-3">Data Validation Status</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Input Data Confidence:</span>
            <span className="font-medium">{(reconciliationData.validation.confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Reconciliation Applied:</span>
            <span className="font-medium">{reconciliationData.reconciliationApplied ? 'Yes' : 'No'}</span>
          </div>
          {reconciliationData.validation.suggestions.length > 0 && (
            <div className="mt-3">
              <p className="font-medium mb-2">Validation Notes:</p>
              <ul className="text-sm space-y-1">
                {reconciliationData.validation.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-gray-600">• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    )}

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h4 className="text-xl font-semibold mb-6 text-center">Before Transaction</h4>
        <div className="space-y-4">
          {results.shareholding.before.map((holder, index) => (
            <div key={index} className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div className="flex-1">
                <p className="font-semibold text-lg">{holder.name}</p>
                <p className="text-sm text-gray-600">Current shareholder</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{holder.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-xl font-semibold mb-6 text-center">After Transaction</h4>
        <div className="space-y-4">
          {results.shareholding.after.map((holder, index) => {
            const beforeHolder = results.shareholding.before.find(b => b.name === holder.name);
            const change = beforeHolder ? holder.percentage - beforeHolder.percentage : holder.percentage;
            
            return (
              <div key={index} className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-lg">{holder.name}</p>
                  <div className="flex items-center text-sm">
                    {change > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : change < 0 ? (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    ) : null}
                    <span className={change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'}>
                      {change > 0 ? '+' : ''}{change.toFixed(1)}% change
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{holder.percentage.toFixed(1)}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    
    <div>
      <h4 className="text-xl font-semibold mb-6">Detailed Impact Analysis</h4>
      <div className="prose max-w-none">
        <p className="text-lg leading-relaxed text-gray-700 mb-6">{results.shareholding.impact}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg">
          <h5 className="font-medium mb-3">Voting Power Changes</h5>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Majority control implications</p>
            <p>• Special resolution thresholds</p>
            <p>• Board representation impact</p>
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <h5 className="font-medium mb-3">Financial Implications</h5>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Dividend entitlement changes</p>
            <p>• Capital distribution rights</p>
            <p>• Liquidation preferences</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const EnhancedShareholdingImpactBox = ({ results, reconciliationData }: EnhancedShareholdingImpactBoxProps) => {
  const { validation } = useTransactionDataConsistency(results);

  return (
    <Card className="h-[300px] flex flex-col min-h-0">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-purple-500" />
            Shareholding Impact
          </CardTitle>
          <div className="flex items-center gap-2">
            <ValidationStatusBadge reconciliationData={reconciliationData} />
            <EnlargedContentDialog
              title="Detailed Shareholding Impact Analysis"
              enlargedContent={<EnlargedShareholdingContent results={results} reconciliationData={reconciliationData} />}
              size="large"
            >
              <div />
            </EnlargedContentDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full px-6 pb-6" type="always">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h5 className="font-medium mb-4 text-base">Before</h5>
              <div className="space-y-2">
                {results.shareholding.before.map((holder, index) => (
                  <div key={index} className="flex justify-between text-sm p-3 bg-gray-50 rounded">
                    <span className="truncate mr-2 font-medium">{holder.name}</span>
                    <span className="font-semibold">{holder.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="font-medium mb-4 text-base">After</h5>
              <div className="space-y-2">
                {results.shareholding.after.map((holder, index) => (
                  <div key={index} className="flex justify-between text-sm p-3 bg-gray-50 rounded">
                    <span className="truncate mr-2 font-medium">{holder.name}</span>
                    <span className="font-semibold">{holder.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h5 className="font-medium mb-4 text-base">Impact Summary</h5>
            <p className="text-sm text-gray-600 leading-relaxed">{results.shareholding.impact}</p>
            
            {reconciliationData && reconciliationData.reconciliationApplied && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                <p className="text-sm text-orange-800">
                  <Info className="h-4 w-4 inline mr-1" />
                  Data has been reconciled with your input to ensure accuracy.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
