import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Banknote, FileCheck, TrendingUp, Percent } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';
import { analysisPostProcessor, ProcessedAnalysisResults } from '@/services/dealStructuring/analysisPostProcessor';
import { ExtractedUserInputs } from '@/services/dealStructuring/enhancedAiAnalysisService';
interface StructureRecommendationBoxProps {
  results: AnalysisResults;
  userInputs?: ExtractedUserInputs;
  description?: string;
}
const EnlargedStructureContent = ({
  results
}: {
  results: ProcessedAnalysisResults;
}) => <div className="space-y-8 p-6">
    <div>
      <h3 className="text-2xl font-semibold mb-4 text-green-700">
        {results.structure.recommended}
      </h3>
      <p className="text-base text-gray-600 leading-relaxed mb-6">
        {results.structure.rationale}
      </p>
    </div>

    {results.structure.majorTerms && <div className="space-y-6">
        <h4 className="text-xl font-semibold flex items-center gap-2">
          <Banknote className="h-5 w-5 text-green-600" />
          Major Deal Terms - Detailed View
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pricing Mechanism */}
          <div className="p-4 border rounded-lg">
            <h5 className="font-semibold mb-3">Pricing Mechanism</h5>
            <Badge variant="outline" className="capitalize border-green-600 text-green-700 text-base px-4 py-2">
              {results.structure.majorTerms.pricingMechanism}
            </Badge>
            <p className="text-sm text-gray-600 mt-2">
              The valuation methodology determines how the transaction value is established and adjusted.
            </p>
          </div>

          {/* Target Percentage */}
          {results.structure.majorTerms.targetPercentage && <div className="p-4 border rounded-lg">
              <h5 className="font-semibold mb-3 flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Target Percentage
              </h5>
              <div className="text-2xl font-bold text-green-600">
                {results.structure.majorTerms.targetPercentage}%
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Percentage of the target company being acquired or affected by this transaction.
              </p>
            </div>}

          {/* Payment Structure */}
          <div className="p-4 border rounded-lg md:col-span-2">
            <h5 className="font-semibold mb-3">Payment Structure</h5>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 rounded p-3 border">
                <div className="text-gray-600 text-sm">Cash Component</div>
                <div className="text-xl font-bold text-green-600">
                  {results.structure.majorTerms.paymentStructure.cashPercentage}%
                </div>
              </div>
              <div className="bg-blue-50 rounded p-3 border">
                <div className="text-gray-600 text-sm">Stock Component</div>
                <div className="text-xl font-bold text-blue-600">
                  {results.structure.majorTerms.paymentStructure.stockPercentage}%
                </div>
              </div>
            </div>
            
            {results.structure.majorTerms.paymentStructure.paymentSchedule && <div className="mt-4">
                <h6 className="font-medium mb-2">Payment Schedule</h6>
                <p className="text-sm text-gray-600 bg-gray-50 rounded p-3 border">
                  {results.structure.majorTerms.paymentStructure.paymentSchedule}
                </p>
              </div>}
          </div>
        </div>

        {/* Suggestion Consideration */}
        {results.structure.majorTerms.suggestionConsideration && <div className="p-4 border-l-4 border-green-400 bg-green-50">
            <h5 className="font-semibold mb-2">Strategic Considerations</h5>
            <p className="text-gray-700 leading-relaxed">
              {results.structure.majorTerms.suggestionConsideration}
            </p>
          </div>}

        {/* Key Conditions */}
        {results.structure.majorTerms.keyConditions.length > 0 && <div>
            <h5 className="font-semibold mb-3 flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Key Conditions Precedent
            </h5>
            <div className="space-y-2">
              {results.structure.majorTerms.keyConditions.map((condition, index) => <div key={index} className="p-3 bg-gray-50 rounded border">
                  <p className="text-sm text-gray-700">• {condition}</p>
                </div>)}
            </div>
          </div>}

        {/* Structural Decisions */}
        {results.structure.majorTerms.structuralDecisions.length > 0 && <div>
            <h5 className="font-semibold mb-3">Key Structural Decisions</h5>
            <div className="flex flex-wrap gap-2">
              {results.structure.majorTerms.structuralDecisions.map((decision, index) => <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                  {decision}
                </Badge>)}
            </div>
          </div>}
      </div>}

    {/* Alternative Structures */}
    {results.structure.alternatives.length > 0 && <div>
        <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Alternative Structures
        </h4>
        <div className="space-y-4">
          {results.structure.alternatives.map((alt, index) => <div key={index} className="p-4 border rounded-lg">
              {typeof alt === 'string' ? <Badge variant="outline" className="border-blue-600 text-blue-700 text-base px-4 py-2">
                  {alt}
                </Badge> : <div>
                  <h5 className="font-semibold text-blue-800 mb-2">{alt.structure}</h5>
                  <p className="text-gray-600">{alt.tradeOffs}</p>
                </div>}
            </div>)}
        </div>
      </div>}
  </div>;
export const StructureRecommendationBox = ({
  results,
  userInputs,
  description
}: StructureRecommendationBoxProps) => {
  // Post-process results to fix pricing misuse and apply calculated values
  const processedResults = analysisPostProcessor.processAnalysisResults(results, userInputs, description);
  
  return <Card className="-bottom-">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-green-500" />
            Structure & Major Terms
          </CardTitle>
          <EnlargedContentDialog title="Comprehensive Structure & Major Terms Analysis" enlargedContent={<EnlargedStructureContent results={processedResults} />} size="large">
            <div />
          </EnlargedContentDialog>
        </div>
      </CardHeader>
      <CardContent className="h-[400px] overflow-y-auto space-y-4">
        {/* Recommended Structure */}
        <div>
          <h4 className="font-semibold text-lg mb-2 text-green-700">
            {processedResults.structure.recommended}
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {processedResults.structure.rationale}
          </p>
        </div>

        {/* Major Deal Terms */}
        {processedResults.structure.majorTerms && <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
            <h5 className="font-medium text-green-800 flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Major Deal Terms
            </h5>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Pricing Mechanism */}
              <div>
                <h6 className="font-medium text-sm mb-1">Pricing Mechanism</h6>
                <Badge variant="outline" className="capitalize border-green-600 text-green-700">
                  {processedResults.structure.majorTerms.pricingMechanism}
                </Badge>
              </div>

              {/* Target Percentage */}
              {processedResults.structure.majorTerms.targetPercentage && <div>
                  <h6 className="font-medium text-sm mb-1 flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    Target %
                  </h6>
                  <div className="text-lg font-bold text-green-600">
                    {processedResults.structure.majorTerms.targetPercentage}%
                  </div>
                </div>}
            </div>

            {/* Payment Structure */}
            <div>
              <h6 className="font-medium text-sm mb-2">Payment Structure</h6>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white rounded p-2 border">
                  <div className="text-gray-500">Cash Component</div>
                  <div className="font-semibold text-green-600">
                    {processedResults._calculatedConsideration ? 
                      `${userInputs?.currency || 'HKD'} ${Math.round(processedResults._calculatedConsideration * (processedResults.structure.majorTerms.paymentStructure.cashPercentage / 100)).toLocaleString()}` :
                      `${processedResults.structure.majorTerms.paymentStructure.cashPercentage}%`
                    }
                  </div>
                </div>
                <div className="bg-white rounded p-2 border">
                  <div className="text-gray-500">Stock Component</div>
                  <div className="font-semibold text-green-600">
                    {processedResults._calculatedConsideration ? 
                      `${userInputs?.currency || 'HKD'} ${Math.round(processedResults._calculatedConsideration * (processedResults.structure.majorTerms.paymentStructure.stockPercentage / 100)).toLocaleString()}` :
                      `${processedResults.structure.majorTerms.paymentStructure.stockPercentage}%`
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Consideration Calculation Display */}
            {processedResults._calculatedConsideration && (
              <div>
                <h6 className="font-medium text-sm mb-2">Consideration Calculation</h6>
                <div className="text-xs text-green-700 bg-green-50 rounded p-2 border border-green-200">
                  <div className="font-semibold mb-1">Total Consideration: {userInputs?.currency || 'HKD'} {processedResults._calculatedConsideration.toLocaleString()}</div>
                  {userInputs && description && (
                    <div className="text-gray-600">
                      Calculated from transaction parameters
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Strategic Considerations - Using processed results */}
            {processedResults.structure.majorTerms.suggestionConsideration && <div>
                <h6 className="font-medium text-sm mb-1">Strategic Considerations</h6>
                <p className="text-xs text-gray-600 bg-white rounded p-2 border">
                  {processedResults.structure.majorTerms.suggestionConsideration}
                </p>
                
              </div>}

            {/* Payment Schedule */}
            {processedResults.structure.majorTerms.paymentStructure.paymentSchedule && <div>
                <h6 className="font-medium text-sm mb-1">Payment Schedule</h6>
                <p className="text-xs text-gray-600 bg-white rounded p-2 border">
                  {processedResults.structure.majorTerms.paymentStructure.paymentSchedule}
                </p>
              </div>}

            {/* Key Conditions */}
            {processedResults.structure.majorTerms.keyConditions.length > 0 && <div>
                <h6 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <FileCheck className="h-3 w-3" />
                  Key Conditions
                </h6>
                <div className="space-y-1">
                  {processedResults.structure.majorTerms.keyConditions.slice(0, 3).map((condition, index) => <div key={index} className="text-xs text-gray-600 bg-white rounded p-2 border">
                      • {condition}
                    </div>)}
                  {processedResults.structure.majorTerms.keyConditions.length > 3 && <div className="text-xs text-gray-500 italic">
                      +{processedResults.structure.majorTerms.keyConditions.length - 3} more conditions
                    </div>}
                </div>
              </div>}

            {/* Structural Decisions */}
            {processedResults.structure.majorTerms.structuralDecisions.length > 0 && <div>
                <h6 className="font-medium text-sm mb-2">Key Structural Decisions</h6>
                <div className="flex flex-wrap gap-1">
                  {processedResults.structure.majorTerms.structuralDecisions.slice(0, 2).map((decision, index) => <Badge key={index} variant="secondary" className="text-xs">
                      {decision}
                    </Badge>)}
                  {processedResults.structure.majorTerms.structuralDecisions.length > 2 && <Badge variant="outline" className="text-xs">
                      +{processedResults.structure.majorTerms.structuralDecisions.length - 2} more
                    </Badge>}
                </div>
              </div>}
          </div>}

        {/* Alternative Structures */}
        {processedResults.structure.alternatives.length > 0 && <div>
            <h5 className="font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Alternative Structures
            </h5>
            <div className="space-y-2">
              {processedResults.structure.alternatives.slice(0, 2).map((alt, index) => <div key={index} className="bg-blue-50 border border-blue-200 rounded p-3">
                  {typeof alt === 'string' ? <Badge variant="outline" className="border-blue-600 text-blue-700">
                      {alt}
                    </Badge> : <div>
                      <p className="font-medium text-sm text-blue-800">{alt.structure}</p>
                      <p className="text-xs text-blue-600 mt-1">{alt.tradeOffs}</p>
                    </div>}
                </div>)}
              {processedResults.structure.alternatives.length > 2 && <div className="text-xs text-gray-500 italic text-center">
                  +{processedResults.structure.alternatives.length - 2} more alternatives available
                </div>}
            </div>
          </div>}
      </CardContent>
    </Card>;
};