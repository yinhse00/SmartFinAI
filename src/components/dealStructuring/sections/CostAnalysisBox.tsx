
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calculator, TrendingUp, DollarSign } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';

interface CostAnalysisBoxProps {
  results: AnalysisResults;
}

const EnlargedCostContent = ({ results }: { results: AnalysisResults }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8 p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center p-6 bg-blue-50 rounded-lg">
          <DollarSign className="h-8 w-8 mx-auto mb-3 text-blue-600" />
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(results.costs.regulatory)}</p>
          <p className="text-sm text-gray-600 mt-1">Regulatory Fees</p>
          <p className="text-xs text-gray-500 mt-2">HKEX, SFC, and other regulatory charges</p>
        </div>
        <div className="text-center p-6 bg-green-50 rounded-lg">
          <TrendingUp className="h-8 w-8 mx-auto mb-3 text-green-600" />
          <p className="text-2xl font-bold text-green-600">{formatCurrency(results.costs.professional)}</p>
          <p className="text-sm text-gray-600 mt-1">Professional Fees</p>
          <p className="text-xs text-gray-500 mt-2">Legal, accounting, and advisory services</p>
        </div>
        <div className="text-center p-6 bg-orange-50 rounded-lg">
          <Calculator className="h-8 w-8 mx-auto mb-3 text-orange-600" />
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(results.costs.timing)}</p>
          <p className="text-sm text-gray-600 mt-1">Timing Costs</p>
          <p className="text-xs text-gray-500 mt-2">Market-related and delay costs</p>
        </div>
        <div className="text-center p-6 bg-primary/10 rounded-lg">
          <DollarSign className="h-8 w-8 mx-auto mb-3 text-primary" />
          <p className="text-2xl font-bold text-primary">{formatCurrency(results.costs.total)}</p>
          <p className="text-sm text-gray-600 mt-1">Total Estimated</p>
          <p className="text-xs text-gray-500 mt-2">All-inclusive project cost</p>
        </div>
      </div>
      
      <div>
        <h4 className="text-xl font-semibold mb-6">Detailed Cost Breakdown</h4>
        <div className="space-y-4">
          {results.costs.breakdown.map((item, index) => (
            <div key={index} className="flex justify-between items-start py-4 px-6 bg-gray-50 rounded-lg">
              <div className="flex-1 mr-4">
                <h5 className="font-semibold text-lg mb-2">{item.category}</h5>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {((item.amount / results.costs.total) * 100).toFixed(1)}% of total cost
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{formatCurrency(item.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-xl font-semibold mb-4">Cost Optimization Recommendations</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border rounded-lg">
            <h5 className="font-medium mb-2">Potential Savings</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Early engagement with advisors</li>
              <li>• Streamlined documentation process</li>
              <li>• Efficient regulatory coordination</li>
            </ul>
          </div>
          <div className="p-4 border rounded-lg">
            <h5 className="font-medium mb-2">Cost Control Measures</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Fixed-fee arrangements where possible</li>
              <li>• Regular cost monitoring and reporting</li>
              <li>• Competitive bidding for services</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-green-500" />
            Cost Analysis
          </CardTitle>
          <EnlargedContentDialog
            title="Detailed Cost Analysis"
            enlargedContent={<EnlargedCostContent results={results} />}
            size="large"
          >
            <div />
          </EnlargedContentDialog>
        </div>
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
