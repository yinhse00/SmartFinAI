
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';

interface ShareholdingImpactBoxProps {
  results: AnalysisResults;
}

export const ShareholdingImpactBox = ({ results }: ShareholdingImpactBoxProps) => {
  return (
    <Card className="h-full flex flex-col min-h-0">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-purple-500" />
          Shareholding Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full px-4 pb-4" type="always">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h5 className="font-medium mb-3 text-sm">Before</h5>
              <div className="space-y-2">
                {results.shareholding.before.map((holder, index) => (
                  <div key={index} className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                    <span className="truncate mr-2">{holder.name}</span>
                    <span className="font-medium">{holder.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="font-medium mb-3 text-sm">After</h5>
              <div className="space-y-2">
                {results.shareholding.after.map((holder, index) => (
                  <div key={index} className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                    <span className="truncate mr-2">{holder.name}</span>
                    <span className="font-medium">{holder.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="border-t pt-3">
            <h5 className="font-medium mb-3 text-sm">Impact Summary</h5>
            <p className="text-xs text-gray-600 leading-relaxed">{results.shareholding.impact}</p>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
