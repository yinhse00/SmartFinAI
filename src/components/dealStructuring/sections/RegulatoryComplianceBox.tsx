
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';

interface RegulatoryComplianceBoxProps {
  results: AnalysisResults;
}

export const RegulatoryComplianceBox = ({ results }: RegulatoryComplianceBoxProps) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle className="h-5 w-5 text-red-500" />
          Regulatory Compliance
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="space-y-3">
            {results.compliance.listingRules.length > 0 && (
              <div>
                <h5 className="font-medium mb-2 text-sm">Listing Rules</h5>
                <div className="flex flex-wrap gap-1">
                  {results.compliance.listingRules.map((rule, index) => (
                    <Badge key={index} variant="outline" className="text-xs">{rule}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {results.compliance.takeoversCode.length > 0 && (
              <div>
                <h5 className="font-medium mb-2 text-sm">Takeovers Code</h5>
                <div className="flex flex-wrap gap-1">
                  {results.compliance.takeoversCode.map((code, index) => (
                    <Badge key={index} variant="outline" className="text-xs">{code}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {results.compliance.risks.length > 0 && (
              <div>
                <h5 className="font-medium mb-2 flex items-center gap-1 text-sm">
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                  Key Risks
                </h5>
                <ul className="space-y-1">
                  {results.compliance.risks.map((risk, index) => (
                    <li key={index} className="text-xs text-gray-600">• {risk}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {results.compliance.recommendations.length > 0 && (
              <div>
                <h5 className="font-medium mb-2 text-sm">Recommendations</h5>
                <ul className="space-y-1">
                  {results.compliance.recommendations.map((rec, index) => (
                    <li key={index} className="text-xs text-gray-600">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
