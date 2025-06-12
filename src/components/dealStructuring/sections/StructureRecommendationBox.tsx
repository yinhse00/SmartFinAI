
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
    <Card className="h-[400px] flex flex-col min-h-0">
      <CardHeader className="pb-4 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-blue-500" />
          Recommended Structure
        </CardTitle>
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
