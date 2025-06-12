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
  Calculator
} from 'lucide-react';
import { ShareholdingChanges, CorporateStructure } from '@/types/dealStructuring';

export interface AnalysisResults {
  transactionType: string;
  structure: {
    recommended: string;
    alternatives: string[];
    rationale: string;
  };
  costs: {
    regulatory: number;
    professional: number;
    timing: number;
    total: number;
    breakdown: Array<{ category: string; amount: number; description: string }>;
  };
  timetable: {
    totalDuration: string;
    keyMilestones: Array<{ date: string; event: string; description: string }>;
  };
  shareholding: {
    before: Array<{ name: string; percentage: number }>;
    after: Array<{ name: string; percentage: number }>;
    impact: string;
  };
  compliance: {
    listingRules: string[];
    takeoversCode: string[];
    risks: string[];
    recommendations: string[];
  };
  confidence: number;
  // New diagram-specific data
  shareholdingChanges?: ShareholdingChanges;
  corporateStructure?: CorporateStructure;
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

      {/* Structure Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-lg mb-2">{results.structure.recommended}</h4>
            <p className="text-gray-600">{results.structure.rationale}</p>
          </div>
          
          {results.structure.alternatives.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Alternative Structures</h5>
              <div className="flex flex-wrap gap-2">
                {results.structure.alternatives.map((alt, index) => (
                  <Badge key={index} variant="outline">{alt}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cost Analysis
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
          
          <div className="space-y-3">
            <h5 className="font-medium">Detailed Breakdown</h5>
            {results.costs.breakdown.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">{item.category}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <p className="font-medium">{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timetable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Execution Timetable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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

      {/* Shareholding Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Shareholding Impact
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
          <Separator className="my-4" />
          <p className="text-gray-600">{results.shareholding.impact}</p>
        </CardContent>
      </Card>

      {/* Compliance Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Regulatory Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          
          {results.compliance.risks.length > 0 && (
            <div>
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Key Risks
              </h5>
              <ul className="space-y-1">
                {results.compliance.risks.map((risk, index) => (
                  <li key={index} className="text-sm text-gray-600">• {risk}</li>
                ))}
              </ul>
            </div>
          )}
          
          {results.compliance.recommendations.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Recommendations</h5>
              <ul className="space-y-1">
                {results.compliance.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-600">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
