
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';

interface ShareholdingImpactBoxProps {
  results: AnalysisResults;
}

export const ShareholdingImpactBox = ({ results }: ShareholdingImpactBoxProps) => {
  return (
    <Card className="h-[300px] flex flex-col min-h-0">
      <CardHeader className="pb-4 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-purple-500" />
          Shareholding Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full px-6 pb-6" type="always">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h5 className="font-medium mb-4 text-base">Before</h5>
              <div className="space-y-2">
                {results.shareholding.before.map((holder, index) => (
                  <div key={index} className="flex justify-between text-sm p-3 bg-gray-50 rounded">
                    <span className="truncate mr-2 font-medium">{holder.name}</span>
                    <span className="font-semibold">{holder.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="font-medium mb-4 text-base">After</h5>
              <div className="space-y-2">
                {results.shareholding.after.map((holder, index) => (
                  <div key={index} className="flex justify-between text-sm p-3 bg-gray-50 rounded">
                    <span className="truncate mr-2 font-medium">{holder.name}</span>
                    <span className="font-semibold">{holder.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h5 className="font-medium mb-4 text-base">Impact Summary</h5>
            <p className="text-sm text-gray-600 leading-relaxed">{results.shareholding.impact}</p>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
