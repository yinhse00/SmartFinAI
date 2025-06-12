
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';

interface StructureRecommendationBoxProps {
  results: AnalysisResults;
}

export const StructureRecommendationBox = ({ results }: StructureRecommendationBoxProps) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-blue-500" />
          Recommended Structure
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        <div>
          <h4 className="font-medium text-lg mb-2">{results.structure.recommended}</h4>
          <p className="text-gray-600 text-sm">{results.structure.rationale}</p>
        </div>
        
        {results.structure.alternatives.length > 0 && (
          <div>
            <h5 className="font-medium mb-2 text-sm">Alternative Structures</h5>
            <div className="flex flex-wrap gap-2">
              {results.structure.alternatives.map((alt, index) => (
                <Badge key={index} variant="outline" className="text-xs">{alt}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
