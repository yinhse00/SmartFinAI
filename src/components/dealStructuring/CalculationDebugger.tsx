import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ExtractedUserInputs } from '@/services/dealStructuring/enhancedAiAnalysisService';

interface CalculationDebuggerProps {
  userInputs?: ExtractedUserInputs;
  finalAmount?: number;
  calculationDetails?: any;
}

export const CalculationDebugger = ({ userInputs, finalAmount, calculationDetails }: CalculationDebuggerProps) => {
  if (!userInputs && !finalAmount) {
    return null;
  }

  const isCalculated = userInputs?.amount && userInputs?.acquisitionPercentage && 
                      calculationDetails?.calculationMethod === 'calculated';

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-sm">Consideration Calculation</CardTitle>
          <Badge variant={isCalculated ? "default" : "secondary"} className="text-xs">
            {isCalculated ? "Calculated" : "Direct Input"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Show extracted values */}
        {userInputs && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700">Extracted Values:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {userInputs.amount && (
                <div className="flex items-center gap-1">
                  <Info className="h-3 w-3 text-blue-500" />
                  <span>Amount: {userInputs.amount.toLocaleString()}</span>
                </div>
              )}
              {userInputs.acquisitionPercentage && (
                <div className="flex items-center gap-1">
                  <Info className="h-3 w-3 text-blue-500" />
                  <span>Percentage: {userInputs.acquisitionPercentage}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show calculation if applicable */}
        {isCalculated && calculationDetails && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-green-700">Calculation:</div>
            <div className="bg-green-50 p-2 rounded text-xs">
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="font-medium">Formula Applied</span>
              </div>
              <div className="font-mono">
                {calculationDetails.calculationDetails?.calculationFormula || 
                 `${userInputs.amount?.toLocaleString()} × ${userInputs.acquisitionPercentage}% = ${finalAmount?.toLocaleString()}`}
              </div>
            </div>
          </div>
        )}

        {/* Show final amount */}
        {finalAmount && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700">Final Consideration:</div>
            <div className="bg-white p-2 rounded border text-sm font-medium">
              {userInputs?.currency || 'HKD'} {finalAmount.toLocaleString()}
            </div>
          </div>
        )}

        {/* Show warning if amounts don't match expectation */}
        {userInputs?.amount && finalAmount && userInputs.amount !== finalAmount && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Calculation Applied</div>
              <div>Input amount ({userInputs.amount.toLocaleString()}) was interpreted as target valuation. Consideration calculated as {finalAmount.toLocaleString()}.</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};