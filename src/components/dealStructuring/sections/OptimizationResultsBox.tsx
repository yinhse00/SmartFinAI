
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { OptimizationResult } from '@/services/dealStructuring/optimizationEngine';
import { TrendingUp, Target, BarChart3, Lightbulb, Award, AlertTriangle } from 'lucide-react';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';

interface OptimizationResultsBoxProps {
  results: OptimizationResult;
}

const EnlargedOptimizationContent = ({ results }: { results: OptimizationResult }) => (
  <div className="space-y-8 p-6">
    <div>
      <h3 className="text-2xl font-semibold mb-4 text-green-700">
        Comprehensive Structure Optimization Analysis
      </h3>
      
      {/* Recommended Structure Detail */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xl font-semibold text-green-800">{results.recommendedStructure.name}</h4>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            <Badge variant="default" className="bg-green-600">
              Score: {results.recommendedStructure.optimizationScore}
            </Badge>
          </div>
        </div>
        
        <p className="text-gray-700 mb-4">{results.recommendedStructure.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-lg font-bold text-green-600">
              HKD {results.recommendedStructure.estimatedCost.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Estimated Cost</div>
          </div>
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-lg font-bold text-blue-600">
              {results.recommendedStructure.estimatedDuration}
            </div>
            <div className="text-sm text-gray-600">Duration</div>
          </div>
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-lg font-bold text-purple-600">
              {(results.recommendedStructure.successProbability * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-semibold mb-2 text-green-800">Key Advantages</h5>
            <ul className="space-y-1">
              {results.recommendedStructure.advantages.map((advantage, index) => (
                <li key={index} className="text-sm text-gray-700">• {advantage}</li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-semibold mb-2 text-orange-800">Risk Factors</h5>
            <ul className="space-y-1">
              {results.recommendedStructure.riskFactors.map((risk, index) => (
                <li key={index} className="text-sm text-gray-700">• {risk}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Alternative Structures */}
      {results.alternativeStructures.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xl font-semibold mb-4">Alternative Structures</h4>
          <div className="space-y-4">
            {results.alternativeStructures.map((structure, index) => (
              <div key={structure.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold">{structure.name}</h5>
                  <Badge variant="outline">Score: {structure.optimizationScore}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{structure.description}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Cost:</span>
                    <div className="font-medium">HKD {structure.estimatedCost.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <div className="font-medium">{structure.estimatedDuration}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Success Rate:</span>
                    <div className="font-medium">{(structure.successProbability * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Market Intelligence */}
      <div className="mb-6">
        <h4 className="text-xl font-semibold mb-4">Market Intelligence</h4>
        
        {results.marketIntelligence.precedentTransactions.length > 0 && (
          <div className="mb-4">
            <h5 className="font-semibold mb-2">Precedent Transactions</h5>
            <div className="space-y-2">
              {results.marketIntelligence.precedentTransactions.map((transaction, index) => (
                <div key={index} className="bg-gray-50 rounded p-3 border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{transaction.description}</p>
                    <Badge variant="secondary" className="text-xs">
                      {(transaction.relevanceScore * 100).toFixed(0)}% match
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{transaction.structure} - {transaction.outcome}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {results.marketIntelligence.marketTrends.length > 0 && (
          <div>
            <h5 className="font-semibold mb-2">Current Market Trends</h5>
            <ul className="space-y-1">
              {results.marketIntelligence.marketTrends.map((trend, index) => (
                <li key={index} className="text-sm text-gray-700">• {trend}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Optimization Insights */}
      <div>
        <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Key Optimization Insights
        </h4>
        <div className="space-y-2">
          {results.optimizationInsights.map((insight, index) => (
            <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
              <p className="text-sm text-gray-700">{insight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const OptimizationResultsBox = ({ results }: OptimizationResultsBoxProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="h-[380px]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Optimized Structure
          </CardTitle>
          <EnlargedContentDialog
            title="Comprehensive Optimization Analysis"
            enlargedContent={<EnlargedOptimizationContent results={results} />}
            size="large"
          >
            <div />
          </EnlargedContentDialog>
        </div>
      </CardHeader>
      <CardContent className="h-[280px] overflow-y-auto space-y-4">
        {/* Recommended Structure */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-blue-800">{results.recommendedStructure.name}</h4>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <Badge variant="default" className="bg-blue-600">
                Score: {results.recommendedStructure.optimizationScore}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-blue-700 mb-3">{results.recommendedStructure.description}</p>
          
          <div className="grid grid-cols-3 gap-2 text-xs mb-3">
            <div className="bg-white rounded p-2 border">
              <div className="text-gray-500">Cost</div>
              <div className="font-semibold text-blue-600">
                {formatCurrency(results.recommendedStructure.estimatedCost)}
              </div>
            </div>
            <div className="bg-white rounded p-2 border">
              <div className="text-gray-500">Duration</div>
              <div className="font-semibold text-blue-600">
                {results.recommendedStructure.estimatedDuration}
              </div>
            </div>
            <div className="bg-white rounded p-2 border">
              <div className="text-gray-500">Success Rate</div>
              <div className="font-semibold text-blue-600">
                {(results.recommendedStructure.successProbability * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Key Advantages */}
          <div className="mb-3">
            <h6 className="font-medium text-sm mb-1">Key Advantages</h6>
            <div className="space-y-1">
              {results.recommendedStructure.advantages.slice(0, 3).map((advantage, index) => (
                <div key={index} className="text-xs text-blue-700 bg-white rounded p-1 border">
                  • {advantage}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Parameter Analysis */}
        <div>
          <h5 className="font-medium mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-500" />
            Sensitivity Analysis
          </h5>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Cost Sensitivity</span>
                <span>{(results.parameterAnalysis.costSensitivity * 100).toFixed(0)}%</span>
              </div>
              <Progress value={results.parameterAnalysis.costSensitivity * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Time Sensitivity</span>
                <span>{(results.parameterAnalysis.timeSensitivity * 100).toFixed(0)}%</span>
              </div>
              <Progress value={results.parameterAnalysis.timeSensitivity * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Risk Sensitivity</span>
                <span>{(results.parameterAnalysis.riskSensitivity * 100).toFixed(0)}%</span>
              </div>
              <Progress value={results.parameterAnalysis.riskSensitivity * 100} className="h-2" />
            </div>
          </div>
        </div>

        {/* Market Intelligence Summary */}
        {results.marketIntelligence.precedentTransactions.length > 0 && (
          <div>
            <h5 className="font-medium mb-2 text-sm">Market Intelligence</h5>
            <div className="bg-gray-50 rounded p-3 border">
              <p className="text-xs text-gray-600 mb-2">
                Analysis based on {results.marketIntelligence.precedentTransactions.length} precedent transactions
              </p>
              {results.marketIntelligence.marketTrends.slice(0, 2).map((trend, index) => (
                <div key={index} className="text-xs text-gray-700 mb-1">• {trend}</div>
              ))}
            </div>
          </div>
        )}

        {/* Key Insights */}
        <div>
          <h5 className="font-medium mb-2 text-sm flex items-center gap-1">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Key Insights
          </h5>
          <div className="space-y-1">
            {results.optimizationInsights.slice(0, 3).map((insight, index) => (
              <div key={index} className="text-xs text-gray-600 bg-yellow-50 rounded p-2 border-l-2 border-yellow-400">
                {insight}
              </div>
            ))}
            {results.optimizationInsights.length > 3 && (
              <div className="text-xs text-gray-500 italic text-center">
                +{results.optimizationInsights.length - 3} more insights available
              </div>
            )}
          </div>
        </div>

        {/* Alternative Structures Summary */}
        {results.alternativeStructures.length > 0 && (
          <div>
            <h5 className="font-medium mb-2 text-sm">Alternative Structures</h5>
            <div className="space-y-2">
              {results.alternativeStructures.slice(0, 2).map((structure, index) => (
                <div key={structure.id} className="bg-gray-50 border rounded p-2">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-medium text-xs">{structure.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {structure.optimizationScore}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{structure.description}</p>
                </div>
              ))}
              {results.alternativeStructures.length > 2 && (
                <div className="text-xs text-gray-500 italic text-center">
                  +{results.alternativeStructures.length - 2} more alternatives available
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
