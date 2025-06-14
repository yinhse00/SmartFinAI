import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { ShareholdingChanges, Shareholder, PaymentStructure, DealEconomics } from '@/types/dealStructuring';
import { useEffect, useState } from 'react';

interface ShareholdingDiagramVisualizationProps {
  shareholdingChanges?: ShareholdingChanges;
  fallbackData?: {
    before: Array<{ name: string; percentage: number }>;
    after: Array<{ name: string; percentage: number }>;
    impact: string;
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

const getShareholderTypeForColor = (type?: string): keyof typeof COLORS => {
  const lowerType = type?.toLowerCase();
  if (lowerType && lowerType in COLORS) {
    return lowerType as keyof typeof COLORS;
  }
  if (lowerType === 'target sellers (new equity in acquirer)') return 'new_equity_recipient';
  return 'institutional';
};

export const ShareholdingDiagramVisualization = ({ 
  shareholdingChanges, 
  fallbackData,
  paymentStructure,
  acquiringCompanyName,
  targetCompanyName
}: ShareholdingDiagramVisualizationProps) => {
  const [processedAfterData, setProcessedAfterData] = useState<Shareholder[]>([]);
  const [processedKeyChanges, setProcessedKeyChanges] = useState(shareholdingChanges?.keyChanges || []);

  const rawBeforeData = shareholdingChanges?.before || fallbackData?.before?.map(item => ({
    ...item,
    type: getShareholderTypeForColor(item['type'])
  })) || [];
  
  const rawAfterDataOriginal = shareholdingChanges?.after || fallbackData?.after?.map(item => ({
    ...item,
    type: getShareholderTypeForColor(item['type'])
  })) || [];

  useEffect(() => {
    let currentAfterData: Shareholder[] = JSON.parse(JSON.stringify(rawAfterDataOriginal));
    const stockPercentage = paymentStructure?.stockPercentage;

    if (stockPercentage && stockPercentage > 0 && stockPercentage < 100) {
      console.log(`Applying stock consideration effect: ${stockPercentage}% stock payment.`);
      const dilutionFactor = (100 - stockPercentage) / 100;
      const newEquityRecipientPercentage = stockPercentage;

      currentAfterData = currentAfterData.map(sh => ({
        ...sh,
        percentage: parseFloat((sh.percentage * dilutionFactor).toFixed(2)),
      }));

      currentAfterData.push({
        name: `Target Sellers (New Equity in ${acquiringCompanyName || 'Acquirer'})`,
        percentage: parseFloat(newEquityRecipientPercentage.toFixed(2)),
        type: 'new_equity_recipient',
        change: newEquityRecipientPercentage,
      });

      const currentTotal = currentAfterData.reduce((sum, sh) => sum + sh.percentage, 0);
      if (currentTotal !== 100 && currentAfterData.length > 0) {
        const diff = 100 - currentTotal;
        if (currentAfterData.findIndex(sh => sh.type === 'new_equity_recipient') !== -1) {
          currentAfterData[currentAfterData.findIndex(sh => sh.type === 'new_equity_recipient')].percentage = parseFloat((currentAfterData[currentAfterData.findIndex(sh => sh.type === 'new_equity_recipient')].percentage + diff).toFixed(2));
        } else {
          currentAfterData[0].percentage = parseFloat((currentAfterData[0].percentage + diff).toFixed(2));
        }
      }
    } else {
      console.log("No stock consideration or full stock payment, using original after data for pie chart.");
    }
    setProcessedAfterData(currentAfterData);

    const newKeyChanges: ShareholdingChanges['keyChanges'] = [];
    const allShareholderNames = new Set([...rawBeforeData.map(s => s.name), ...currentAfterData.map(s => s.name)]);

    allShareholderNames.forEach(name => {
      const beforeSh = rawBeforeData.find(s => s.name === name);
      const afterSh = currentAfterData.find(s => s.name === name);
      const beforePerc = beforeSh?.percentage || 0;
      const afterPerc = afterSh?.percentage || 0;
      const change = afterPerc - beforePerc;

      if (Math.abs(change) > 0.01) {
        newKeyChanges.push({
          shareholder: name,
          before: beforePerc,
          after: afterPerc,
          change: parseFloat(change.toFixed(2)),
        });
      }
    });
    newKeyChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    setProcessedKeyChanges(newKeyChanges);
  }, [rawAfterDataOriginal, paymentStructure, acquiringCompanyName, rawBeforeData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
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
        <p>No shareholding data available</p>
      </div>
    );
  }

  return (
    <div className="h-full space-y-4">
      {/* Before and After Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[250px]">
        {/* Before Transaction */}
        <div className="text-center">
          <h4 className="font-medium mb-2">Before Transaction</h4>
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
            <p className="text-sm font-medium">Transaction Impact</p>
            {processedKeyChanges.length > 0 && (
              <div className="space-y-1 mt-2">
                {processedKeyChanges.slice(0, 3).map((change, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {getChangeIcon(change.change)}
                    <span className="truncate" title={`${change.shareholder}: ${change.before?.toFixed(1)}% -> ${change.after?.toFixed(1)}% (${change.change > 0 ? '+' : ''}${change.change.toFixed(1)}%)`}>
                      {change.shareholder}: {change.change > 0 ? '+' : ''}{change.change.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* After Transaction */}
        <div className="text-center">
          <h4 className="font-medium mb-2">After Transaction</h4>
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

        {/* Key Changes Summary / Control Implications */}
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
