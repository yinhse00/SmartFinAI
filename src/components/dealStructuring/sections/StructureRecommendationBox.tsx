
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';

interface StructureRecommendationBoxProps {
  results: AnalysisResults;
}

const EnlargedStructureContent = ({ results }: { results: AnalysisResults }) => (
  <div className="space-y-8 p-6">
    <div>
      <h3 className="text-2xl font-bold mb-6">{results.structure.recommended}</h3>
      <div className="prose max-w-none">
        <p className="text-lg leading-relaxed text-gray-700">{results.structure.rationale}</p>
      </div>
    </div>
    
    {results.structure.alternatives.length > 0 && (
      <div>
        <h4 className="text-xl font-semibold mb-6">Alternative Structures</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.structure.alternatives.map((alt, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50">
              <Badge variant="outline" className="text-base px-4 py-2 mb-3">{alt}</Badge>
              <p className="text-sm text-gray-600">
                Alternative approach that could be considered based on specific requirements and constraints.
              </p>
            </div>
          ))}
        </div>
      </div>
    )}
    
    <div>
      <h4 className="text-xl font-semibold mb-4">Key Considerations</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h5 className="font-medium text-lg">Advantages</h5>
          <ul className="space-y-2 text-gray-700">
            <li>• Optimal regulatory compliance path</li>
            <li>• Cost-effective implementation</li>
            <li>• Minimized execution timeline</li>
            <li>• Enhanced stakeholder acceptance</li>
          </ul>
        </div>
        <div className="space-y-3">
          <h5 className="font-medium text-lg">Potential Challenges</h5>
          <ul className="space-y-2 text-gray-700">
            <li>• Regulatory approval requirements</li>
            <li>• Market timing considerations</li>
            <li>• Stakeholder coordination needs</li>
            <li>• Documentation complexity</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

export const StructureRecommendationBox = ({ results }: StructureRecommendationBoxProps) => {
  return (
    <Card className="h-[400px] flex flex-col min-h-0">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-blue-500" />
            Recommended Structure
          </CardTitle>
          <EnlargedContentDialog
            title="Transaction Structure Recommendation"
            enlargedContent={<EnlargedStructureContent results={results} />}
            size="large"
          >
            <div />
          </EnlargedContentDialog>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full px-6 pb-6" type="always">
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-lg mb-4">{results.structure.recommended}</h4>
              <p className="text-gray-600 text-base leading-relaxed">{results.structure.rationale}</p>
            </div>
            
            {results.structure.alternatives.length > 0 && (
              <div>
                <h5 className="font-medium mb-4 text-base">Alternative Structures</h5>
                <div className="flex flex-wrap gap-2">
                  {results.structure.alternatives.map((alt, index) => (
                    <Badge key={index} variant="outline" className="text-sm px-3 py-1">{alt}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
