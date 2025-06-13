
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Banknote, FileCheck, TrendingUp } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';

interface StructureRecommendationBoxProps {
  results: AnalysisResults;
}

export const StructureRecommendationBox = ({ results }: StructureRecommendationBoxProps) => {
  return (
    <Card className="h-[500px]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-green-500" />
          Structure & Major Terms
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] overflow-y-auto space-y-4">
        {/* Recommended Structure */}
        <div>
          <h4 className="font-semibold text-lg mb-2 text-green-700">
            {results.structure.recommended}
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {results.structure.rationale}
          </p>
        </div>

        {/* Major Deal Terms */}
        {results.structure.majorTerms && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
            <h5 className="font-medium text-green-800 flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Major Deal Terms
            </h5>
            
            {/* Pricing Mechanism */}
            <div>
              <h6 className="font-medium text-sm mb-1">Pricing Mechanism</h6>
              <Badge variant="outline" className="capitalize border-green-600 text-green-700">
                {results.structure.majorTerms.pricingMechanism}
              </Badge>
            </div>

            {/* Payment Structure */}
            <div>
              <h6 className="font-medium text-sm mb-2">Payment Structure</h6>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white rounded p-2 border">
                  <div className="text-gray-500">Cash</div>
                  <div className="font-semibold text-green-600">
                    {results.structure.majorTerms.paymentStructure.cashPercentage}%
                  </div>
                </div>
                <div className="bg-white rounded p-2 border">
                  <div className="text-gray-500">Stock</div>
                  <div className="font-semibold text-green-600">
                    {results.structure.majorTerms.paymentStructure.stockPercentage}%
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Schedule */}
            {results.structure.majorTerms.paymentStructure.paymentSchedule && (
              <div>
                <h6 className="font-medium text-sm mb-1">Payment Schedule</h6>
                <p className="text-xs text-gray-600 bg-white rounded p-2 border">
                  {results.structure.majorTerms.paymentStructure.paymentSchedule}
                </p>
              </div>
            )}

            {/* Key Conditions */}
            {results.structure.majorTerms.keyConditions.length > 0 && (
              <div>
                <h6 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <FileCheck className="h-3 w-3" />
                  Key Conditions
                </h6>
                <div className="space-y-1">
                  {results.structure.majorTerms.keyConditions.slice(0, 3).map((condition, index) => (
                    <div key={index} className="text-xs text-gray-600 bg-white rounded p-2 border">
                      • {condition}
                    </div>
                  ))}
                  {results.structure.majorTerms.keyConditions.length > 3 && (
                    <div className="text-xs text-gray-500 italic">
                      +{results.structure.majorTerms.keyConditions.length - 3} more conditions
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Structural Decisions */}
            {results.structure.majorTerms.structuralDecisions.length > 0 && (
              <div>
                <h6 className="font-medium text-sm mb-2">Key Structural Decisions</h6>
                <div className="flex flex-wrap gap-1">
                  {results.structure.majorTerms.structuralDecisions.slice(0, 2).map((decision, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {decision}
                    </Badge>
                  ))}
                  {results.structure.majorTerms.structuralDecisions.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{results.structure.majorTerms.structuralDecisions.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alternative Structures */}
        {results.structure.alternatives.length > 0 && (
          <div>
            <h5 className="font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Alternative Structures
            </h5>
            <div className="space-y-2">
              {results.structure.alternatives.slice(0, 2).map((alt, index) => (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded p-3">
                  {typeof alt === 'string' ? (
                    <Badge variant="outline" className="border-blue-600 text-blue-700">
                      {alt}
                    </Badge>
                  ) : (
                    <div>
                      <p className="font-medium text-sm text-blue-800">{alt.structure}</p>
                      <p className="text-xs text-blue-600 mt-1">{alt.tradeOffs}</p>
                    </div>
                  )}
                </div>
              ))}
              {results.structure.alternatives.length > 2 && (
                <div className="text-xs text-gray-500 italic text-center">
                  +{results.structure.alternatives.length - 2} more alternatives available
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
