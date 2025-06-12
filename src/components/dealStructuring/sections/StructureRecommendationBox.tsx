
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';

interface StructureRecommendationBoxProps {
  results: AnalysisResults;
}

export const StructureRecommendationBox = ({ results }: StructureRecommendationBoxProps) => {
  return (
    <Card className="h-full flex flex-col min-h-0">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-blue-500" />
          Recommended Structure
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full px-4 pb-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-base mb-2">{results.structure.recommended}</h4>
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
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
