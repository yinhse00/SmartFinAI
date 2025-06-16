
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';
import { ShareholdingDataProcessor } from '@/services/dealStructuring/shareholdingDataProcessor';

interface ShareholdingImpactBoxProps {
  results: AnalysisResults;
}

const EnlargedShareholdingContent = ({ results }: { results: AnalysisResults }) => {
  // Check transaction type to determine processing approach
  const transactionType = ShareholdingDataProcessor.inferTransactionType(results);
  const isCapitalRaising = transactionType === 'CAPITAL_RAISING';

  let beforeData, afterData, impactDescription;

  if (isCapitalRaising) {
    // Use processed data for capital raising
    const processedData = ShareholdingDataProcessor.processShareholdingData(results, transactionType);
    beforeData = processedData.before;
    afterData = processedData.after;
    impactDescription = processedData.impactDescription;
  } else {
    // Use raw data for M&A transactions
    beforeData = (results.shareholding?.before || []).map(sh => ({
      name: sh.name,
      percentage: sh.percentage,
      description: `${sh.percentage}% stake`
    }));
    afterData = (results.shareholding?.after || []).map(sh => ({
      name: sh.name,
      percentage: sh.percentage,
      description: `${sh.percentage}% stake`
    }));
    impactDescription = results.shareholding?.impact || 'Transaction will result in changes to ownership structure.';
  }

  return (
    <div className="space-y-8 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="text-xl font-semibold mb-6 text-center">Before Transaction</h4>
          <div className="space-y-4">
            {beforeData.map((holder, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-lg">{holder.name}</p>
                  <p className="text-sm text-gray-600">{holder.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{holder.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-xl font-semibold mb-6 text-center">After Transaction</h4>
          <div className="space-y-4">
            {afterData.map((holder, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-lg">{holder.name}</p>
                  <div className="flex items-center text-sm">
                    {isCapitalRaising && holder.changeType === 'increase' ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : isCapitalRaising && holder.changeType === 'decrease' ? (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    ) : null}
                    <span className={
                      isCapitalRaising && holder.changeType === 'increase' ? 'text-green-600' : 
                      isCapitalRaising && holder.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                    }>
                      {holder.description}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{holder.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-xl font-semibold mb-6">Detailed Impact Analysis</h4>
        <div className="prose max-w-none">
          <p className="text-lg leading-relaxed text-gray-700 mb-6">{impactDescription}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border rounded-lg">
            <h5 className="font-medium mb-3">Voting Power Changes</h5>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Majority control implications</p>
              <p>• Special resolution thresholds</p>
              <p>• Board representation impact</p>
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <h5 className="font-medium mb-3">Financial Implications</h5>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Dividend entitlement changes</p>
              <p>• Capital distribution rights</p>
              <p>• Liquidation preferences</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ShareholdingImpactBox = ({ results }: ShareholdingImpactBoxProps) => {
  // Check transaction type to determine processing approach
  const transactionType = ShareholdingDataProcessor.inferTransactionType(results);
  const isCapitalRaising = transactionType === 'CAPITAL_RAISING';

  let beforeData, afterData, impactDescription;

  if (isCapitalRaising) {
    // Use processed data for capital raising
    const processedData = ShareholdingDataProcessor.processShareholdingData(results, transactionType);
    beforeData = processedData.before;
    afterData = processedData.after;
    impactDescription = processedData.impactDescription;
  } else {
    // Use raw data for M&A transactions
    beforeData = (results.shareholding?.before || []).map(sh => ({
      name: sh.name,
      percentage: sh.percentage,
      description: `${sh.percentage}% stake`
    }));
    afterData = (results.shareholding?.after || []).map(sh => ({
      name: sh.name,
      percentage: sh.percentage,
      description: `${sh.percentage}% stake`
    }));
    impactDescription = results.shareholding?.impact || 'Transaction will result in changes to ownership structure.';
  }

  return (
    <Card className="h-[300px] flex flex-col min-h-0">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-purple-500" />
            Shareholding Impact
          </CardTitle>
          <EnlargedContentDialog
            title="Detailed Shareholding Impact Analysis"
            enlargedContent={<EnlargedShareholdingContent results={results} />}
            size="large"
          >
            <div />
          </EnlargedContentDialog>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full px-6 pb-6" type="always">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h5 className="font-medium mb-4 text-base">Before</h5>
              <div className="space-y-2">
                {beforeData.map((holder, index) => (
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
                {afterData.map((holder, index) => (
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
            <p className="text-sm text-gray-600 leading-relaxed">{impactDescription}</p>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
