
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calculator, DollarSign, Target, Maximize2 } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';

interface ValuationAnalysisBoxProps {
  results: AnalysisResults;
}

const EnlargedValuationContent = ({ results }: { results: AnalysisResults }) => (
  <div className="space-y-6 p-6">
    <div>
      <h3 className="text-2xl font-semibold mb-4 text-blue-700">
        Transaction Valuation Analysis
      </h3>
    </div>

    {/* Transaction Value */}
    <div className="p-4 border rounded-lg">
      <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-green-600" />
        Transaction Value
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-3 bg-green-50 rounded border">
          <div className="text-2xl font-bold text-green-600">
            {results.valuation.transactionValue.currency} {results.valuation.transactionValue.amount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Value</div>
        </div>
        {results.valuation.transactionValue.pricePerShare && (
          <div className="text-center p-3 bg-blue-50 rounded border">
            <div className="text-2xl font-bold text-blue-600">
              {results.valuation.transactionValue.currency} {results.valuation.transactionValue.pricePerShare}
            </div>
            <div className="text-sm text-gray-600">Price per Share</div>
          </div>
        )}
      </div>
    </div>

    {/* Valuation Metrics */}
    <div className="p-4 border rounded-lg">
      <h4 className="text-xl font-semibold mb-3">Valuation Metrics</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {results.valuation.valuationMetrics.peRatio && (
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-lg font-bold">{results.valuation.valuationMetrics.peRatio}x</div>
            <div className="text-xs text-gray-600">P/E Ratio</div>
          </div>
        )}
        {results.valuation.valuationMetrics.pbRatio && (
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-lg font-bold">{results.valuation.valuationMetrics.pbRatio}x</div>
            <div className="text-xs text-gray-600">P/B Ratio</div>
          </div>
        )}
        {results.valuation.valuationMetrics.evEbitda && (
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-lg font-bold">{results.valuation.valuationMetrics.evEbitda}x</div>
            <div className="text-xs text-gray-600">EV/EBITDA</div>
          </div>
        )}
      </div>
    </div>

    {/* Market Comparables */}
    {results.valuation.marketComparables.length > 0 && (
      <div className="p-4 border rounded-lg">
        <h4 className="text-xl font-semibold mb-3">Market Comparables</h4>
        <div className="space-y-2">
          {results.valuation.marketComparables.map((comp, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-medium">{comp.company}</span>
              <div className="text-right">
                <div className="font-bold">{comp.value}</div>
                <div className="text-xs text-gray-600">{comp.metric}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Fairness Assessment */}
    <div className="p-4 border-l-4 border-blue-400 bg-blue-50">
      <h4 className="font-semibold mb-2">Fairness Assessment</h4>
      <p className="text-blue-800 font-medium mb-2">{results.valuation.fairnessAssessment.conclusion}</p>
      <p className="text-blue-700 text-sm">{results.valuation.fairnessAssessment.reasoning}</p>
      {results.valuation.fairnessAssessment.premium && (
        <div className="mt-2">
          <span className="text-sm text-blue-600">Premium: </span>
          <span className="font-bold text-blue-800">{results.valuation.fairnessAssessment.premium}%</span>
        </div>
      )}
    </div>

    {/* Valuation Range */}
    <div className="p-4 border rounded-lg">
      <h4 className="text-xl font-semibold mb-3">Valuation Range</h4>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-red-50 rounded border">
          <div className="text-lg font-bold text-red-600">
            {results.valuation.transactionValue.currency} {results.valuation.valuationRange.low.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Low</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded border">
          <div className="text-lg font-bold text-blue-600">
            {results.valuation.transactionValue.currency} {results.valuation.valuationRange.midpoint.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Midpoint</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded border">
          <div className="text-lg font-bold text-green-600">
            {results.valuation.transactionValue.currency} {results.valuation.valuationRange.high.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">High</div>
        </div>
      </div>
    </div>
  </div>
);

export const ValuationAnalysisBox = ({ results }: ValuationAnalysisBoxProps) => {
  return (
    <Card className="h-[500px]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-blue-500" />
            Valuation Analysis
          </CardTitle>
          <EnlargedContentDialog 
            title="Comprehensive Valuation Analysis" 
            enlargedContent={<EnlargedValuationContent results={results} />} 
            size="large"
          >
            <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Expand valuation">
              <Maximize2 className="h-4 w-4" />
            </button>
          </EnlargedContentDialog>
        </div>
      </CardHeader>
      <CardContent className="h-[400px] overflow-y-auto space-y-4">
        {/* Transaction Value */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Transaction Value
          </h5>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {results.valuation.transactionValue.currency} {results.valuation.transactionValue.amount.toLocaleString()}
            </div>
            {results.valuation.transactionValue.pricePerShare && (
              <div className="text-sm text-blue-700 mt-1">
                @ {results.valuation.transactionValue.currency} {results.valuation.transactionValue.pricePerShare} per share
              </div>
            )}
          </div>
        </div>

        {/* Valuation Metrics */}
        <div>
          <h5 className="font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Key Metrics
          </h5>
          <div className="grid grid-cols-2 gap-2">
            {results.valuation.valuationMetrics.peRatio && (
              <div className="text-center p-2 bg-gray-50 rounded text-xs">
                <div className="font-bold">{results.valuation.valuationMetrics.peRatio}x</div>
                <div className="text-gray-600">P/E</div>
              </div>
            )}
            {results.valuation.valuationMetrics.pbRatio && (
              <div className="text-center p-2 bg-gray-50 rounded text-xs">
                <div className="font-bold">{results.valuation.valuationMetrics.pbRatio}x</div>
                <div className="text-gray-600">P/B</div>
              </div>
            )}
            {results.valuation.valuationMetrics.evEbitda && (
              <div className="text-center p-2 bg-gray-50 rounded text-xs">
                <div className="font-bold">{results.valuation.valuationMetrics.evEbitda}x</div>
                <div className="text-gray-600">EV/EBITDA</div>
              </div>
            )}
          </div>
        </div>

        {/* Fairness Assessment */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h5 className="font-medium text-green-800 mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Fairness Assessment
          </h5>
          <div className="text-sm">
            <Badge variant="outline" className="border-green-600 text-green-700 mb-2">
              {results.valuation.fairnessAssessment.conclusion}
            </Badge>
            <p className="text-green-700 text-xs leading-relaxed">
              {results.valuation.fairnessAssessment.reasoning}
            </p>
            {results.valuation.fairnessAssessment.premium && (
              <div className="mt-2 text-xs">
                <span className="text-green-600">Premium: </span>
                <span className="font-bold text-green-800">{results.valuation.fairnessAssessment.premium}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Valuation Range */}
        <div>
          <h5 className="font-medium mb-2">Valuation Range</h5>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-red-50 rounded border">
              <div className="text-red-600 font-semibold">
                {results.valuation.valuationRange.low.toLocaleString()}
              </div>
              <div className="text-gray-500">Low</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded border">
              <div className="text-blue-600 font-semibold">
                {results.valuation.valuationRange.midpoint.toLocaleString()}
              </div>
              <div className="text-gray-500">Mid</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded border">
              <div className="text-green-600 font-semibold">
                {results.valuation.valuationRange.high.toLocaleString()}
              </div>
              <div className="text-gray-500">High</div>
            </div>
          </div>
        </div>

        {/* Market Comparables Summary */}
        {results.valuation.marketComparables.length > 0 && (
          <div className="bg-gray-100 rounded-lg p-3">
            <h5 className="font-medium mb-2 text-sm">Market Comparables</h5>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {results.valuation.marketComparables.length}
              </div>
              <div className="text-xs text-gray-600">Comparable Companies</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
