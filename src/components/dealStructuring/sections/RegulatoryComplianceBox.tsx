
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertTriangle, Shield, FileText } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';

interface RegulatoryComplianceBoxProps {
  results: AnalysisResults;
}

const EnlargedComplianceContent = ({ results }: { results: AnalysisResults }) => (
  <div className="space-y-8 p-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {results.compliance?.listingRules?.length > 0 && (
        <div className="p-6 border rounded-lg">
          <div className="flex items-center mb-4">
            <FileText className="h-6 w-6 text-blue-500 mr-2" />
            <h4 className="text-xl font-semibold">Listing Rules Compliance</h4>
          </div>
          <div className="space-y-3">
            {results.compliance.listingRules.map((rule, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg">
                <Badge variant="outline" className="text-base px-4 py-2 mb-2">{rule}</Badge>
                <p className="text-sm text-gray-600">
                  Specific compliance requirements and procedures under this rule.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {results.compliance?.takeoversCode?.length > 0 && (
        <div className="p-6 border rounded-lg">
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 text-purple-500 mr-2" />
            <h4 className="text-xl font-semibold">Takeovers Code Requirements</h4>
          </div>
          <div className="space-y-3">
            {results.compliance.takeoversCode.map((code, index) => (
              <div key={index} className="p-3 bg-purple-50 rounded-lg">
                <Badge variant="outline" className="text-base px-4 py-2 mb-2">{code}</Badge>
                <p className="text-sm text-gray-600">
                  Mandatory offer and disclosure obligations under this provision.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    
    {results.compliance?.risks?.length > 0 && (
      <div>
        <div className="flex items-center mb-6">
          <AlertTriangle className="h-6 w-6 text-orange-500 mr-2" />
          <h4 className="text-xl font-semibold">Regulatory Risk Assessment</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.compliance.risks.map((risk, index) => (
            <div key={index} className="p-4 border-l-4 border-orange-400 bg-orange-50">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">{risk}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Mitigation strategies should be developed to address this risk.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    
    {results.compliance?.recommendations?.length > 0 && (
      <div>
        <div className="flex items-center mb-6">
          <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
          <h4 className="text-xl font-semibold">Compliance Recommendations</h4>
        </div>
        <div className="space-y-4">
          {results.compliance.recommendations.map((rec, index) => (
            <div key={index} className="p-4 border-l-4 border-green-400 bg-green-50">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">{rec}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Implementation of this recommendation will enhance compliance posture.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    
    <div>
      <h4 className="text-xl font-semibold mb-4">Compliance Timeline</h4>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <span className="font-medium">Initial Compliance Review</span>
          <span className="text-sm text-gray-600">Week 1-2</span>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <span className="font-medium">Regulatory Submissions</span>
          <span className="text-sm text-gray-600">Week 3-4</span>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <span className="font-medium">Approval Process</span>
          <span className="text-sm text-gray-600">Week 5-8</span>
        </div>
      </div>
    </div>
  </div>
);

export const RegulatoryComplianceBox = ({ results }: RegulatoryComplianceBoxProps) => {
  // Ensure compliance object exists with default values
  const compliance = results.compliance || {
    listingRules: [],
    takeoversCode: [],
    risks: [],
    recommendations: []
  };

  return (
    <Card className="h-[300px] flex flex-col min-h-0">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5 text-red-500" />
            Regulatory Compliance
          </CardTitle>
          <EnlargedContentDialog
            title="Comprehensive Regulatory Compliance Analysis"
            enlargedContent={<EnlargedComplianceContent results={results} />}
            size="large"
          >
            <div />
          </EnlargedContentDialog>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full px-6 pb-6" type="always">
          <div className="space-y-6">
            {compliance.listingRules?.length > 0 && (
              <div>
                <h5 className="font-medium mb-4 text-base">Listing Rules</h5>
                <div className="flex flex-wrap gap-2">
                  {compliance.listingRules.map((rule, index) => (
                    <Badge key={index} variant="outline" className="text-sm px-3 py-1">{rule}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {compliance.takeoversCode?.length > 0 && (
              <div>
                <h5 className="font-medium mb-4 text-base">Takeovers Code</h5>
                <div className="flex flex-wrap gap-2">
                  {compliance.takeoversCode.map((code, index) => (
                    <Badge key={index} variant="outline" className="text-sm px-3 py-1">{code}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {compliance.risks?.length > 0 && (
              <div>
                <h5 className="font-medium mb-4 flex items-center gap-1 text-base">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Key Risks
                </h5>
                <ul className="space-y-2">
                  {compliance.risks.map((risk, index) => (
                    <li key={index} className="text-sm text-gray-600 leading-relaxed">• {risk}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {compliance.recommendations?.length > 0 && (
              <div>
                <h5 className="font-medium mb-4 text-base">Recommendations</h5>
                <ul className="space-y-2">
                  {compliance.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-600 leading-relaxed">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {(!compliance.listingRules?.length && !compliance.takeoversCode?.length && 
              !compliance.risks?.length && !compliance.recommendations?.length) && (
              <div className="text-center text-gray-500 py-8">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Compliance analysis will appear here after transaction analysis</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
