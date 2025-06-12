
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
    <Card className="h-[400px] flex flex-col min-h-0">
      <CardHeader className="pb-4 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5 text-green-500" />
          Cost Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full px-6 pb-6" type="always">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-base">{formatCurrency(results.costs.regulatory)}</p>
              <p className="text-sm text-gray-500 mt-1">Regulatory</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-base">{formatCurrency(results.costs.professional)}</p>
              <p className="text-sm text-gray-500 mt-1">Professional</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-base">{formatCurrency(results.costs.timing)}</p>
              <p className="text-sm text-gray-500 mt-1">Timing</p>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="font-medium text-primary text-base">{formatCurrency(results.costs.total)}</p>
              <p className="text-sm text-gray-500 mt-1">Total</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h5 className="font-medium text-base">Breakdown</h5>
            <div className="space-y-3">
              {results.costs.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-start py-3 text-sm border-b last:border-b-0">
                  <div className="flex-1 mr-3">
                    <p className="font-medium text-base">{item.category}</p>
                    <p className="text-gray-500 text-sm mt-1 leading-relaxed">{item.description}</p>
                  </div>
                  <p className="font-medium text-right text-base">{formatCurrency(item.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
