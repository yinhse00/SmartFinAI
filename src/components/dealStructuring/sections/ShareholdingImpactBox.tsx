
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';

interface ShareholdingImpactBoxProps {
  results: AnalysisResults;
}

export const ShareholdingImpactBox = ({ results }: ShareholdingImpactBoxProps) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-purple-500" />
          Shareholding Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
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
          
          <div className="border-t pt-3">
            <h5 className="font-medium mb-2 text-sm">Impact Summary</h5>
            <p className="text-xs text-gray-600">{results.shareholding.impact}</p>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
