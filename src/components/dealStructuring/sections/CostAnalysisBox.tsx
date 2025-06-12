
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calculator } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';

interface CostAnalysisBoxProps {
  results: AnalysisResults;
}

export const CostAnalysisBox = ({ results }: CostAnalysisBoxProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="h-full flex flex-col min-h-0">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4 text-green-500" />
          Cost Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full px-4 pb-4">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="font-medium text-xs">{formatCurrency(results.costs.regulatory)}</p>
              <p className="text-xs text-gray-500">Regulatory</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="font-medium text-xs">{formatCurrency(results.costs.professional)}</p>
              <p className="text-xs text-gray-500">Professional</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="font-medium text-xs">{formatCurrency(results.costs.timing)}</p>
              <p className="text-xs text-gray-500">Timing</p>
            </div>
            <div className="text-center p-2 bg-primary/10 rounded-lg">
              <p className="font-medium text-primary text-xs">{formatCurrency(results.costs.total)}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h5 className="font-medium text-sm">Breakdown</h5>
            <div className="space-y-1">
              {results.costs.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1 text-xs border-b">
                  <div>
                    <p className="font-medium">{item.category}</p>
                    <p className="text-gray-500 text-xs">{item.description}</p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
