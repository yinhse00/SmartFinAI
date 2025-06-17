
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Clock, AlertCircle, Maximize2 } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';

interface DocumentPreparationBoxProps {
  results: AnalysisResults;
}

const EnlargedDocumentContent = ({ results }: { results: AnalysisResults }) => (
  <div className="space-y-6 p-6">
    <div>
      <h3 className="text-2xl font-semibold mb-4 text-purple-700">
        Document Preparation & Key Parties
      </h3>
    </div>

    {/* Required Documents */}
    <div className="p-4 border rounded-lg">
      <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-purple-600" />
        Required Documents
      </h4>
      <div className="space-y-3">
        {results.documentPreparation.requiredDocuments.map((doc, index) => (
          <div key={index} className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-semibold text-purple-800">{doc.document}</h5>
              <div className="flex items-center gap-2">
                <Badge variant={doc.priority === 'high' ? 'destructive' : doc.priority === 'medium' ? 'default' : 'secondary'}>
                  {doc.priority}
                </Badge>
                <span className="text-sm text-gray-600">{doc.timeline}</span>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-2">{doc.description}</p>
            <div className="text-xs text-purple-600">
              <strong>Responsible:</strong> {doc.responsibleParty}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Key Parties */}
    <div className="p-4 border rounded-lg">
      <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-blue-600" />
        Key Parties
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.documentPreparation.keyParties.map((party, index) => (
          <div key={index} className="p-3 bg-blue-50 rounded-lg border">
            <h5 className="font-semibold text-blue-800 mb-1">{party.party}</h5>
            <p className="text-sm text-blue-700 font-medium mb-1">{party.role}</p>
            <p className="text-xs text-blue-600">{party.involvement}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Preparation Timeline */}
    <div className="p-4 border rounded-lg">
      <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
        <Clock className="h-5 w-5 text-orange-600" />
        Preparation Timeline
      </h4>
      <div className="mb-4">
        <div className="text-lg font-bold text-orange-600">
          {results.documentPreparation.preparationTimeline.totalDuration}
        </div>
        <div className="text-sm text-gray-600">Total preparation time</div>
      </div>
      
      {results.documentPreparation.preparationTimeline.criticalPath.length > 0 && (
        <div>
          <h5 className="font-semibold mb-2">Critical Path Items</h5>
          <div className="space-y-2">
            {results.documentPreparation.preparationTimeline.criticalPath.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-orange-50 rounded border">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Regulatory Filings */}
    {results.documentPreparation.regulatoryFilings.length > 0 && (
      <div className="p-4 border-l-4 border-red-400 bg-red-50">
        <h4 className="font-semibold mb-2 text-red-800">Regulatory Filings Required</h4>
        <div className="space-y-1">
          {results.documentPreparation.regulatoryFilings.map((filing, index) => (
            <div key={index} className="text-sm text-red-700">• {filing}</div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export const DocumentPreparationBox = ({ results }: DocumentPreparationBoxProps) => {
  const highPriorityDocs = results.documentPreparation.requiredDocuments.filter(doc => doc.priority === 'high');
  
  return (
    <Card className="h-[500px]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-purple-500" />
            Document Preparation
          </CardTitle>
          <EnlargedContentDialog 
            title="Comprehensive Document Preparation Guide" 
            enlargedContent={<EnlargedDocumentContent results={results} />} 
            size="large"
          >
            <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Expand documents">
              <Maximize2 className="h-4 w-4" />
            </button>
          </EnlargedContentDialog>
        </div>
      </CardHeader>
      <CardContent className="h-[400px] overflow-y-auto space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-purple-50 rounded border">
            <div className="text-lg font-bold text-purple-600">
              {results.documentPreparation.requiredDocuments.length}
            </div>
            <div className="text-xs text-gray-600">Documents</div>
          </div>
          <div className="p-2 bg-blue-50 rounded border">
            <div className="text-lg font-bold text-blue-600">
              {results.documentPreparation.keyParties.length}
            </div>
            <div className="text-xs text-gray-600">Key Parties</div>
          </div>
          <div className="p-2 bg-orange-50 rounded border">
            <div className="text-lg font-bold text-orange-600">
              {highPriorityDocs.length}
            </div>
            <div className="text-xs text-gray-600">High Priority</div>
          </div>
        </div>

        {/* High Priority Documents */}
        {highPriorityDocs.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h5 className="font-medium text-red-800 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              High Priority Documents
            </h5>
            <div className="space-y-2">
              {highPriorityDocs.slice(0, 3).map((doc, index) => (
                <div key={index} className="text-xs">
                  <div className="font-medium text-red-700">{doc.document}</div>
                  <div className="text-red-600">Timeline: {doc.timeline}</div>
                </div>
              ))}
              {highPriorityDocs.length > 3 && (
                <div className="text-xs text-red-600 italic">
                  +{highPriorityDocs.length - 3} more high priority items
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key Parties Summary */}
        <div>
          <h5 className="font-medium mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Key Parties Required
          </h5>
          <div className="space-y-2">
            {results.documentPreparation.keyParties.slice(0, 4).map((party, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-blue-50 rounded text-xs">
                <span className="font-medium text-blue-800">{party.party}</span>
                <span className="text-blue-600">{party.role}</span>
              </div>
            ))}
            {results.documentPreparation.keyParties.length > 4 && (
              <div className="text-xs text-gray-500 italic text-center">
                +{results.documentPreparation.keyParties.length - 4} more parties
              </div>
            )}
          </div>
        </div>

        {/* Timeline Summary */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <h5 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Preparation Timeline
          </h5>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {results.documentPreparation.preparationTimeline.totalDuration}
            </div>
            <div className="text-xs text-orange-700">
              {results.documentPreparation.preparationTimeline.criticalPath.length} critical path items
            </div>
          </div>
        </div>

        {/* Regulatory Filings */}
        {results.documentPreparation.regulatoryFilings.length > 0 && (
          <div className="bg-gray-100 rounded-lg p-3">
            <h5 className="font-medium mb-2 text-sm">Regulatory Filings</h5>
            <div className="space-y-1">
              {results.documentPreparation.regulatoryFilings.slice(0, 2).map((filing, index) => (
                <div key={index} className="text-xs text-gray-700">• {filing}</div>
              ))}
              {results.documentPreparation.regulatoryFilings.length > 2 && (
                <div className="text-xs text-gray-500 italic">
                  +{results.documentPreparation.regulatoryFilings.length - 2} more filings
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
