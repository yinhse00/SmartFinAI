
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { ShareholdingChanges, Shareholder, PaymentStructure, DealEconomics } from '@/types/dealStructuring'; // Corrected imports
import { useEffect, useState } from 'react';

interface ShareholdingDiagramVisualizationProps {
  shareholdingChanges?: ShareholdingChanges;
  fallbackData?: {
    before: Array<{ name: string; percentage: number; type?: string; }>; // Added optional type
    after: Array<{ name:string; percentage: number; type?: string; }>; // Added optional type
    impact?: string;
  };
  paymentStructure?: PaymentStructure;
  dealEconomics?: DealEconomics; // Kept for potential future use, though not directly used in current logic
  acquiringCompanyName?: string;
  targetCompanyName?: string; // Kept for potential future use
}

const COLORS = {
  individual: '#8884d8',
  institutional: '#82ca9d', 
  connected: '#ffc658',
  public: '#ff7300',
  fund: '#00c49f',
  new_equity_recipient: '#facc15' // Color for new equity recipients
};

const getChangeIcon = (change: number) => {
  if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
  return null;
};

const getShareholderTypeForColor = (type?: string): keyof typeof COLORS => {
  const lowerType = type?.toLowerCase();
  if (lowerType && lowerType in COLORS) {
    return lowerType as keyof typeof COLORS;
  }
  // Specific mapping for the new equity recipient type if it comes differently
  if (lowerType === 'target sellers (new equity in acquirer)' || type === 'new_equity_recipient') {
      return 'new_equity_recipient';
  }
  return 'institutional'; // Default color
};

export const ShareholdingDiagramVisualization = ({ 
  shareholdingChanges, 
  fallbackData,
  paymentStructure,
  acquiringCompanyName,
  // targetCompanyName // Not actively used, but kept in props
}: ShareholdingDiagramVisualizationProps) => {
  const [processedAfterData, setProcessedAfterData] = useState<Shareholder[]>([]);
  const [processedKeyChanges, setProcessedKeyChanges] = useState<ShareholdingChanges['keyChanges']>(shareholdingChanges?.keyChanges || []);

  const rawBeforeData: Shareholder[] = shareholdingChanges?.before || fallbackData?.before?.map(item => ({
    ...item,
    type: item.type || 'institutional' // Ensure type is present, default if not
  })) || [];
  
  // Use shareholdingChanges.after if available, otherwise fallback.
  // This rawAfterDataOriginal is the state of the ACQUIRER's shareholding BEFORE new equity is issued to target sellers
  const rawAfterDataOriginal: Shareholder[] = shareholdingChanges?.after || fallbackData?.after?.map(item => ({
    ...item,
    type: item.type || 'institutional' // Ensure type is present
  })) || [];

  useEffect(() => {
    let currentAfterData: Shareholder[] = JSON.parse(JSON.stringify(rawAfterDataOriginal));
    const stockPercentage = paymentStructure?.stockPercentage;

    if (stockPercentage && stockPercentage > 0 && acquiringCompanyName) {
      console.log(`Applying stock consideration effect: ${stockPercentage}% stock payment to target sellers.`);
      // This stockPercentage represents the portion of the deal paid in acquirer's stock.
      // The crucial missing piece is: what percentage of the ACQUIRER do these new shares represent?
      // For simplicity in visualization if this data isn't directly provided via `shareholdingChanges.after` reflecting dilution:
      // We assume the `stockPercentage` of the *deal value* results in new equity.
      // The `rawAfterDataOriginal` should ideally be the acquirer's shareholders *before* this new issuance.
      // Then, these shareholders are diluted.

      // Example: If Acquirer was worth 70M and issues 30M in new stock,
      // New total valuation is 100M. New shareholders own 30M/100M = 30% of the new entity.
      // Original shareholders owned 70M/70M = 100% of original, now own 70M/100M = 70% of new entity.
      // Their original percentages are scaled by 0.7.

      // Lacking pre-deal acquirer valuation and value of stock issued, we have to make an assumption
      // or rely on `shareholdingChanges.after` to *already* reflect this.
      // Given the problem description, it seems `shareholdingChanges.after` might NOT yet reflect this specific dilution event.
      // So, we simulate it.
      // Let's assume `stockPercentage` means X% of the *combined entity's equity* goes to target sellers.
      // This is a simplification. A more robust approach would need more financial inputs.
      
      const dilutionFactor = (100 - stockPercentage) / 100; // Original shareholders now own (100-X)% of their original stake in the combined pool.
      const newEquityRecipientPercentage = stockPercentage; // Target sellers get X% of the combined entity.

      currentAfterData = currentAfterData.map(sh => ({
        ...sh,
        percentage: parseFloat((sh.percentage * dilutionFactor).toFixed(2)),
      }));
      
      // Ensure 'type' is set for new equity recipient
      const newShareholderEntry: Shareholder = {
        name: `Target Sellers (New Equity in ${acquiringCompanyName})`,
        percentage: parseFloat(newEquityRecipientPercentage.toFixed(2)),
        type: 'new_equity_recipient', 
      };
      currentAfterData.push(newShareholderEntry);

      // Normalize percentages to sum to 100% due to potential floating point inaccuracies
      const currentTotal = currentAfterData.reduce((sum, sh) => sum + sh.percentage, 0);
      if (currentTotal !== 100 && currentAfterData.length > 0) {
        const diff = 100 - currentTotal;
        // Distribute discrepancy, often to the largest or new shareholder for simplicity here
        const newRecipientIndex = currentAfterData.findIndex(sh => sh.type === 'new_equity_recipient');
        if (newRecipientIndex !== -1) {
           currentAfterData[newRecipientIndex].percentage = parseFloat((currentAfterData[newRecipientIndex].percentage + diff).toFixed(2));
        } else if (currentAfterData.length > 0) { // Fallback if new recipient somehow not found
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

      if (Math.abs(change) > 0.01 || (beforeSh && !afterSh) || (!beforeSh && afterSh)) { // Capture new/exit too
        newKeyChangesCalculated.push({
          shareholder: name,
          before: beforePerc, // Store actual before percentage
          after: afterPerc,   // Store actual after percentage
          change: change,
        });
      }
    });
    newKeyChangesCalculated.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    setProcessedKeyChanges(newKeyChangesCalculated);
    console.log("Processed Key Changes: ", newKeyChangesCalculated);

  }, [rawAfterDataOriginal, paymentStructure, acquiringCompanyName, rawBeforeData]); // Added rawBeforeData

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload as Shareholder; // Cast to Shareholder
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
                data={rawBeforeData} // Should be acquirer's shareholders before this specific transaction's impact
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
                {processedKeyChanges.slice(0, 3).map((changeItem, index) => ( // Renamed 'change' to 'changeItem'
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
        {/* Color Legend */}
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

        {/* Control Implications */}
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
