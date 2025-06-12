
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
    <Card className="h-[300px] flex flex-col min-h-0">
      <CardHeader className="pb-4 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle className="h-5 w-5 text-red-500" />
          Regulatory Compliance
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full px-6 pb-6" type="always">
          <div className="space-y-6">
            {results.compliance.listingRules.length > 0 && (
              <div>
                <h5 className="font-medium mb-4 text-base">Listing Rules</h5>
                <div className="flex flex-wrap gap-2">
                  {results.compliance.listingRules.map((rule, index) => (
                    <Badge key={index} variant="outline" className="text-sm px-3 py-1">{rule}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {results.compliance.takeoversCode.length > 0 && (
              <div>
                <h5 className="font-medium mb-4 text-base">Takeovers Code</h5>
                <div className="flex flex-wrap gap-2">
                  {results.compliance.takeoversCode.map((code, index) => (
                    <Badge key={index} variant="outline" className="text-sm px-3 py-1">{code}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {results.compliance.risks.length > 0 && (
              <div>
                <h5 className="font-medium mb-4 flex items-center gap-1 text-base">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Key Risks
                </h5>
                <ul className="space-y-2">
                  {results.compliance.risks.map((risk, index) => (
                    <li key={index} className="text-sm text-gray-600 leading-relaxed">• {risk}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {results.compliance.recommendations.length > 0 && (
              <div>
                <h5 className="font-medium mb-4 text-base">Recommendations</h5>
                <ul className="space-y-2">
                  {results.compliance.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-600 leading-relaxed">• {rec}</li>
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
