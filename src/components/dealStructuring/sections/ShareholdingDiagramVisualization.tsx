import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { ShareholdingChanges, Shareholder, PaymentStructure, DealEconomics, ShareholderData } from '@/types/dealStructuring'; // Added ShareholderData
import { useEffect, useState } from 'react';

interface ShareholdingDiagramVisualizationProps {
  shareholdingChanges?: ShareholdingChanges;
  fallbackData?: {
    before: Array<{ name: string; percentage: number; type?: string; }>;
    after: Array<{ name:string; percentage: number; type?: string; }>;
    impact?: string;
  };
  paymentStructure?: PaymentStructure;
  dealEconomics?: DealEconomics;
  acquiringCompanyName?: string;
  targetCompanyName?: string;
}

const COLORS = {
  individual: '#8884d8',
  institutional: '#82ca9d', 
  connected: '#ffc658',
  public: '#ff7300',
  fund: '#00c49f',
  new_equity_recipient: '#facc15'
};

const getChangeIcon = (change: number) => {
  if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
  return null;
};

const getShareholderTypeForColor = (type?: ShareholderData['type'] | string): keyof typeof COLORS => { // Allow string for flexibility but prioritize ShareholderData['type']
  const lowerType = type?.toLowerCase();
  if (lowerType === 'new_equity_recipient') { // Specific check for new_equity_recipient
      return 'new_equity_recipient';
  }
  if (lowerType && lowerType in COLORS) {
    // Ensure the type is one of the keys of COLORS
    const validColorKeys = Object.keys(COLORS) as Array<keyof typeof COLORS>;
    if (validColorKeys.includes(lowerType as keyof typeof COLORS)) {
       return lowerType as keyof typeof COLORS;
    }
  }
  return 'institutional'; // Default color
};

export const ShareholdingDiagramVisualization = ({ 
  shareholdingChanges, 
  fallbackData,
  paymentStructure,
  acquiringCompanyName,
}: ShareholdingDiagramVisualizationProps) => {
  const [processedAfterData, setProcessedAfterData] = useState<Shareholder[]>([]);
  const [processedKeyChanges, setProcessedKeyChanges] = useState<ShareholdingChanges['keyChanges']>(shareholdingChanges?.keyChanges || []);

  const rawBeforeData: Shareholder[] = shareholdingChanges?.before || fallbackData?.before?.map(item => ({
    ...item,
    type: (item.type || 'institutional') as ShareholderData['type'] // Cast to valid type
  })) || [];
  
  const rawAfterDataOriginal: Shareholder[] = shareholdingChanges?.after || fallbackData?.after?.map(item => ({
    ...item,
    type: (item.type || 'institutional') as ShareholderData['type'] // Cast to valid type
  })) || [];

  useEffect(() => {
    let currentAfterData: Shareholder[] = JSON.parse(JSON.stringify(rawAfterDataOriginal));
    const stockPercentage = paymentStructure?.stockPercentage;

    if (stockPercentage && stockPercentage > 0 && acquiringCompanyName) {
      console.log(`Applying stock consideration effect: ${stockPercentage}% stock payment to target sellers.`);
      
      const dilutionFactor = (100 - stockPercentage) / 100;
      const newEquityRecipientPercentage = stockPercentage;

      currentAfterData = currentAfterData.map(sh => ({
        ...sh,
        percentage: parseFloat((sh.percentage * dilutionFactor).toFixed(2)),
      }));
      
      const newShareholderEntry: Shareholder = {
        name: `Target Sellers (New Equity in ${acquiringCompanyName})`,
        percentage: parseFloat(newEquityRecipientPercentage.toFixed(2)),
        type: 'new_equity_recipient' as const, // Use 'as const' for literal type
      };
      currentAfterData.push(newShareholderEntry);

      const currentTotal = currentAfterData.reduce((sum, sh) => sum + sh.percentage, 0);
      if (currentTotal !== 100 && currentAfterData.length > 0) {
        const diff = 100 - currentTotal;
        const newRecipientIndex = currentAfterData.findIndex(sh => sh.type === 'new_equity_recipient');
        if (newRecipientIndex !== -1) {
           currentAfterData[newRecipientIndex].percentage = parseFloat((currentAfterData[newRecipientIndex].percentage + diff).toFixed(2));
        } else if (currentAfterData.length > 0) {
            currentAfterData[0].percentage = parseFloat((currentAfterData[0].percentage + diff).toFixed(2));
        }
      }
      console.log("Processed After Data with dilution: ", currentAfterData);

    } else {
      console.log("No stock consideration or insufficient data, using original after data for pie chart:", currentAfterData);
    }
    setProcessedAfterData(currentAfterData);

    // Re-calculate keyChanges based on rawBeforeData and the potentially modified currentAfterData
    const newKeyChangesCalculated: ShareholdingChanges['keyChanges'] = [];
    const allShareholderNames = new Set([...rawBeforeData.map(s => s.name), ...currentAfterData.map(s => s.name)]);

    allShareholderNames.forEach(name => {
      const beforeSh = rawBeforeData.find(s => s.name === name);
      const afterSh = currentAfterData.find(s => s.name === name);
      const beforePerc = beforeSh?.percentage || 0;
      const afterPerc = afterSh?.percentage || 0;
      const change = parseFloat((afterPerc - beforePerc).toFixed(2));

      if (Math.abs(change) > 0.01 || (beforeSh && !afterSh) || (!beforeSh && afterSh)) {
        newKeyChangesCalculated.push({
          shareholder: name,
          before: beforePerc,
          after: afterPerc,
          change: change,
        });
      }
    });
    newKeyChangesCalculated.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    setProcessedKeyChanges(newKeyChangesCalculated);
    console.log("Processed Key Changes: ", newKeyChangesCalculated);

  }, [rawAfterDataOriginal, paymentStructure, acquiringCompanyName, rawBeforeData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload as Shareholder;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">{data.percentage.toFixed(2)}%</p>
          <p className="text-xs text-gray-500 capitalize">{data.type?.replace(/_/g, ' ') || 'N/A'}</p>
        </div>
      );
    }
    return null;
  };

  if (rawBeforeData.length === 0 && processedAfterData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>No shareholding data available for acquirer.</p>
      </div>
    );
  }

  return (
    <div className="h-full space-y-4">
      {/* Before and After Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[250px]">
        {/* Before Transaction (Acquirer's Shareholders) */}
        <div className="text-center">
          <h4 className="font-medium mb-2">Acquirer: Before New Equity</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rawBeforeData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={80}
                paddingAngle={2}
                dataKey="percentage"
                nameKey="name"
              >
                {rawBeforeData.map((entry, index) => (
                  <Cell 
                    key={`before-${index}`} 
                    fill={COLORS[getShareholderTypeForColor(entry.type)] || '#8884d8'} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Arrow and Summary */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <ArrowRight className="h-8 w-8 text-blue-500" />
          <div className="text-center">
            <p className="text-sm font-medium">Shareholding Impact</p>
            {processedKeyChanges.length > 0 && (
              <div className="space-y-1 mt-2">
                {processedKeyChanges.slice(0, 3).map((changeItem, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {getChangeIcon(changeItem.change)}
                    <span 
                      className="truncate" 
                      title={`${changeItem.shareholder}: ${changeItem.before?.toFixed(1)}% -> ${changeItem.after?.toFixed(1)}% (${changeItem.change > 0 ? '+' : ''}${changeItem.change.toFixed(1)}%)`}
                    >
                      {changeItem.shareholder}: {changeItem.change > 0 ? '+' : ''}{changeItem.change.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* After Transaction (Acquirer's Shareholders) */}
        <div className="text-center">
          <h4 className="font-medium mb-2">Acquirer: After New Equity</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedAfterData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={80}
                paddingAngle={2}
                dataKey="percentage"
                nameKey="name"
              >
                {processedAfterData.map((entry, index) => (
                  <Cell 
                    key={`after-${index}`} 
                    fill={COLORS[getShareholderTypeForColor(entry.type)] || '#8884d8'} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend and Key Changes */}
      <div className="space-y-3">
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          {Object.entries(COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{type.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>

        {shareholdingChanges?.controlImplications && shareholdingChanges.controlImplications.length > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <h5 className="font-medium text-sm mb-2">Control Implications:</h5>
            <ul className="text-xs space-y-1">
              {shareholdingChanges.controlImplications.map((implication, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>{implication}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
