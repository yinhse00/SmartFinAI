
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Users, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Calculator,
  Target,
  Banknote
} from 'lucide-react';
import { ShareholdingChanges, CorporateStructure } from '@/types/dealStructuring';

export interface AnalysisResults {
  transactionType: string;
  structure: {
    recommended: string;
    majorTerms?: {
      pricingMechanism: string;
      paymentStructure: {
        cashPercentage: number;
        stockPercentage: number;
        paymentSchedule: string;
        escrowArrangements: string;
      };
      keyConditions: string[];
      structuralDecisions: string[];
      suggestionConsideration?: string;
      targetPercentage?: number;
    };
    alternatives: Array<{ structure: string; tradeOffs: string }> | string[];
    rationale: string;
  };
  costs: {
    regulatory: number;
    professional: number;
    timing: number;
    total: number;
    majorDrivers?: string[];
    optimizationOpportunities?: string[];
    breakdown: Array<{ 
      category: string; 
      amount: number; 
      description: string;
      impact?: 'high' | 'medium' | 'low';
    }>;
  };
  timetable: {
    totalDuration: string;
    criticalPath?: Array<{ 
      date: string; 
      milestone: string; 
      description: string; 
      impact?: 'high' | 'medium' | 'low'; 
    }>;
    keyMilestones: Array<{ date: string; event: string; description: string }>;
    keyDependencies?: string[];
    timingRisks?: string[];
  };
  shareholding: {
    before: Array<{ name: string; percentage: number }>;
    after: Array<{ name: string; percentage: number }>;
    majorChanges?: string[];
    controlImplications?: string[];
    dilutionImpact?: string;
    impact: string;
  };
  compliance: {
    keyListingRules?: string[];
    materialApprovals?: string[];
    criticalRisks?: string[];
    actionableRecommendations?: string[];
    listingRules: string[];
    takeoversCode: string[];
    risks: string[];
    recommendations: string[];
  };
  risks?: {
    executionRisks: Array<{ risk: string; probability: 'high' | 'medium' | 'low'; mitigation: string }>;
    marketRisks: string[];
    regulatoryRisks: string[];
  };
  confidence: number;
  // Enhanced diagram-specific data
  shareholdingChanges?: ShareholdingChanges;
  corporateStructure?: CorporateStructure;
  // Enhanced transaction flow data
  transactionFlow?: {
    before: {
      entities: Array<{
        id: string;
        name: string;
        type: 'target' | 'buyer' | 'stockholder' | 'subsidiary' | 'newco' | 'consideration';
        value?: number;
        percentage?: number;
        description?: string;
        role?: string;
      }>;
      relationships: Array<{
        source: string;
        target: string;
        type: 'ownership' | 'control' | 'subsidiary';
        percentage?: number;
        nature?: string;
      }>;
    };
    after: {
      entities: Array<{
        id: string;
        name: string;
        type: 'target' | 'buyer' | 'stockholder' | 'subsidiary' | 'newco' | 'consideration';
        value?: number;
        percentage?: number;
        description?: string;
        role?: string;
      }>;
      relationships: Array<{
        source: string;
        target: string;
        type: 'ownership' | 'control' | 'subsidiary' | 'consideration';
        percentage?: number;
        value?: number;
        nature?: string;
      }>;
    };
    majorTransactionSteps?: Array<{
      id: string;
      title: string;
      description: string;
      entities: string[];
      criticalPath?: boolean;
    }>;
    transactionSteps: Array<{
      id: string;
      title: string;
      description: string;
      entities: string[];
    }>;
    paymentFlows?: Array<{
      from: string;
      to: string;
      amount: number;
      mechanism: string;
      timing: string;
    }>;
  };
}

interface AIAnalysisResultsProps {
  results: AnalysisResults;
}

export const AIAnalysisResults = ({ results }: AIAnalysisResultsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Transaction Analysis Summary
            </CardTitle>
            <Badge variant={results.confidence > 0.8 ? "default" : "secondary"}>
              {Math.round(results.confidence * 100)}% Confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="font-medium">{results.transactionType}</p>
              <p className="text-sm text-gray-500">Transaction Type</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="font-medium">{formatCurrency(results.costs.total)}</p>
              <p className="text-sm text-gray-500">Estimated Total Cost</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <p className="font-medium">{results.timetable.totalDuration}</p>
              <p className="text-sm text-gray-500">Estimated Duration</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Structure Recommendations with Major Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Recommended Structure & Major Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium text-lg mb-2">{results.structure.recommended}</h4>
            <p className="text-gray-600">{results.structure.rationale}</p>
          </div>

          {/* Major Deal Terms Section */}
          {results.structure.majorTerms && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h5 className="font-medium text-lg flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Major Deal Terms
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pricing Mechanism */}
                <div>
                  <h6 className="font-medium mb-2">Pricing Mechanism</h6>
                  <Badge variant="outline" className="capitalize">
                    {results.structure.majorTerms.pricingMechanism}
                  </Badge>
                </div>

                {/* Payment Structure */}
                <div>
                  <h6 className="font-medium mb-2">Payment Structure</h6>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Cash:</span>
                      <span className="font-medium">{results.structure.majorTerms.paymentStructure.cashPercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stock:</span>
                      <span className="font-medium">{results.structure.majorTerms.paymentStructure.stockPercentage}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Schedule */}
              {results.structure.majorTerms.paymentStructure.paymentSchedule && (
                <div>
                  <h6 className="font-medium mb-2">Payment Schedule</h6>
                  <p className="text-sm text-gray-600">{results.structure.majorTerms.paymentStructure.paymentSchedule}</p>
                </div>
              )}

              {/* Escrow Arrangements */}
              {results.structure.majorTerms.paymentStructure.escrowArrangements && (
                <div>
                  <h6 className="font-medium mb-2">Escrow Arrangements</h6>
                  <p className="text-sm text-gray-600">{results.structure.majorTerms.paymentStructure.escrowArrangements}</p>
                </div>
              )}

              {/* Key Conditions */}
              {results.structure.majorTerms.keyConditions.length > 0 && (
                <div>
                  <h6 className="font-medium mb-2">Key Conditions Precedent</h6>
                  <ul className="space-y-1">
                    {results.structure.majorTerms.keyConditions.map((condition, index) => (
                      <li key={index} className="text-sm text-gray-600">• {condition}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Structural Decisions */}
              {results.structure.majorTerms.structuralDecisions.length > 0 && (
                <div>
                  <h6 className="font-medium mb-2">Key Structural Decisions</h6>
                  <div className="flex flex-wrap gap-2">
                    {results.structure.majorTerms.structuralDecisions.map((decision, index) => (
                      <Badge key={index} variant="secondary">{decision}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Alternative Structures */}
          {results.structure.alternatives.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Alternative Structures</h5>
              <div className="space-y-2">
                {results.structure.alternatives.map((alt, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    {typeof alt === 'string' ? (
                      <Badge variant="outline">{alt}</Badge>
                    ) : (
                      <div>
                        <p className="font-medium">{alt.structure}</p>
                        <p className="text-sm text-gray-600 mt-1">{alt.tradeOffs}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cost Analysis & Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{formatCurrency(results.costs.regulatory)}</p>
              <p className="text-sm text-gray-500">Regulatory Fees</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{formatCurrency(results.costs.professional)}</p>
              <p className="text-sm text-gray-500">Professional Fees</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{formatCurrency(results.costs.timing)}</p>
              <p className="text-sm text-gray-500">Timing Costs</p>
            </div>
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <p className="font-medium text-primary">{formatCurrency(results.costs.total)}</p>
              <p className="text-sm text-gray-500">Total Cost</p>
            </div>
          </div>

          {/* Major Cost Drivers */}
          {results.costs.majorDrivers && results.costs.majorDrivers.length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium mb-2">Major Cost Drivers</h5>
              <div className="flex flex-wrap gap-2">
                {results.costs.majorDrivers.map((driver, index) => (
                  <Badge key={index} variant="outline">{driver}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Optimization Opportunities */}
          {results.costs.optimizationOpportunities && results.costs.optimizationOpportunities.length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium mb-2">Cost Optimization Opportunities</h5>
              <ul className="space-y-1">
                {results.costs.optimizationOpportunities.map((opportunity, index) => (
                  <li key={index} className="text-sm text-gray-600">• {opportunity}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="space-y-3">
            <h5 className="font-medium">Detailed Breakdown</h5>
            {results.costs.breakdown.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.category}</p>
                    {item.impact && (
                      <Badge 
                        variant={item.impact === 'high' ? 'destructive' : item.impact === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {item.impact}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <p className="font-medium">{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Timetable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Critical Path Execution Timetable
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Critical Path Milestones */}
          {results.timetable.criticalPath && results.timetable.criticalPath.length > 0 && (
            <div className="mb-6">
              <h5 className="font-medium mb-3">Critical Path Milestones</h5>
              <div className="space-y-4">
                {results.timetable.criticalPath.map((milestone, index) => (
                  <div key={index} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
                    <div className="flex-shrink-0 w-20 text-sm font-medium text-gray-500">
                      {milestone.date}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{milestone.milestone}</p>
                        {milestone.impact && (
                          <Badge 
                            variant={milestone.impact === 'high' ? 'destructive' : milestone.impact === 'medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {milestone.impact}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Dependencies */}
          {results.timetable.keyDependencies && results.timetable.keyDependencies.length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium mb-2">Key Dependencies</h5>
              <ul className="space-y-1">
                {results.timetable.keyDependencies.map((dependency, index) => (
                  <li key={index} className="text-sm text-gray-600">• {dependency}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Timing Risks */}
          {results.timetable.timingRisks && results.timetable.timingRisks.length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Timing Risks
              </h5>
              <ul className="space-y-1">
                {results.timetable.timingRisks.map((risk, index) => (
                  <li key={index} className="text-sm text-gray-600">• {risk}</li>
                ))}
              </ul>
            </div>
          )}

          {/* All Milestones */}
          <div className="space-y-4">
            <h5 className="font-medium">All Key Milestones</h5>
            {results.timetable.keyMilestones.map((milestone, index) => (
              <div key={index} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
                <div className="flex-shrink-0 w-20 text-sm font-medium text-gray-500">
                  {milestone.date}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{milestone.event}</p>
                  <p className="text-sm text-gray-600">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Shareholding Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Major Shareholding Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium mb-3">Before Transaction</h5>
              <div className="space-y-2">
                {results.shareholding.before.map((holder, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{holder.name}</span>
                    <span className="font-medium">{holder.percentage.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="font-medium mb-3">After Transaction</h5>
              <div className="space-y-2">
                {results.shareholding.after.map((holder, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{holder.name}</span>
                    <span className="font-medium">{holder.percentage.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Major Changes */}
          {results.shareholding.majorChanges && results.shareholding.majorChanges.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium mb-2">Major Changes</h5>
              <ul className="space-y-1">
                {results.shareholding.majorChanges.map((change, index) => (
                  <li key={index} className="text-sm text-gray-600">• {change}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Control Implications */}
          {results.shareholding.controlImplications && results.shareholding.controlImplications.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium mb-2">Control Implications</h5>
              <ul className="space-y-1">
                {results.shareholding.controlImplications.map((implication, index) => (
                  <li key={index} className="text-sm text-gray-600">• {implication}</li>
                ))}
              </ul>
            </div>
          )}

          <Separator className="my-4" />
          <p className="text-gray-600">{results.shareholding.impact}</p>
        </CardContent>
      </Card>

      {/* Enhanced Compliance Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Key Regulatory Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Listing Rules */}
          {results.compliance.keyListingRules && results.compliance.keyListingRules.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Key Listing Rules Requirements</h5>
              <div className="flex flex-wrap gap-2">
                {results.compliance.keyListingRules.map((rule, index) => (
                  <Badge key={index} variant="outline">{rule}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Material Approvals */}
          {results.compliance.materialApprovals && results.compliance.materialApprovals.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Material Regulatory Approvals</h5>
              <div className="flex flex-wrap gap-2">
                {results.compliance.materialApprovals.map((approval, index) => (
                  <Badge key={index} variant="outline">{approval}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Standard compliance sections */}
          {results.compliance.listingRules.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Listing Rules Requirements</h5>
              <div className="flex flex-wrap gap-2">
                {results.compliance.listingRules.map((rule, index) => (
                  <Badge key={index} variant="outline">{rule}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {results.compliance.takeoversCode.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Takeovers Code Requirements</h5>
              <div className="flex flex-wrap gap-2">
                {results.compliance.takeoversCode.map((code, index) => (
                  <Badge key={index} variant="outline">{code}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Critical Risks */}
          {(results.compliance.criticalRisks && results.compliance.criticalRisks.length > 0) || results.compliance.risks.length > 0 && (
            <div>
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Critical Regulatory Risks
              </h5>
              <ul className="space-y-1">
                {(results.compliance.criticalRisks || results.compliance.risks).map((risk, index) => (
                  <li key={index} className="text-sm text-gray-600">• {risk}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Actionable Recommendations */}
          {(results.compliance.actionableRecommendations && results.compliance.actionableRecommendations.length > 0) || results.compliance.recommendations.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Actionable Recommendations</h5>
              <ul className="space-y-1">
                {(results.compliance.actionableRecommendations || results.compliance.recommendations).map((rec, index) => (
                  <li key={index} className="text-sm text-gray-600">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Risk Analysis */}
      {results.risks && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Risk Analysis & Mitigation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Execution Risks */}
            {results.risks.executionRisks.length > 0 && (
              <div>
                <h5 className="font-medium mb-3">Execution Risks</h5>
                <div className="space-y-3">
                  {results.risks.executionRisks.map((riskItem, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{riskItem.risk}</p>
                        <Badge 
                          variant={riskItem.probability === 'high' ? 'destructive' : riskItem.probability === 'medium' ? 'default' : 'secondary'}
                        >
                          {riskItem.probability} probability
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        <strong>Mitigation:</strong> {riskItem.mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market Risks */}
            {results.risks.marketRisks.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Market Risks</h5>
                <ul className="space-y-1">
                  {results.risks.marketRisks.map((risk, index) => (
                    <li key={index} className="text-sm text-gray-600">• {risk}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Regulatory Risks */}
            {results.risks.regulatoryRisks.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Regulatory Risks</h5>
                <ul className="space-y-1">
                  {results.risks.regulatoryRisks.map((risk, index) => (
                    <li key={index} className="text-sm text-gray-600">• {risk}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
