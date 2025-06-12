
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
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-purple-500" />
          Shareholding Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full px-4 pb-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <h5 className="font-medium mb-2 text-sm">Before</h5>
              <div className="space-y-1">
                {results.shareholding.before.map((holder, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="truncate">{holder.name}</span>
                    <span className="font-medium">{holder.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="font-medium mb-2 text-sm">After</h5>
              <div className="space-y-1">
                {results.shareholding.after.map((holder, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="truncate">{holder.name}</span>
                    <span className="font-medium">{holder.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="border-t pt-2">
            <h5 className="font-medium mb-2 text-sm">Impact Summary</h5>
            <p className="text-xs text-gray-600">{results.shareholding.impact}</p>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
