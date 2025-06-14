import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { ShareholdingChanges, PaymentStructure, DealEconomics, ShareholderData } from '@/types/dealStructuring';
import { AnalysisResults } from '../AIAnalysisResults';

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
  transactionFlow?: AnalysisResults['transactionFlow'];
}

const COLORS = {
  individual: '#8884d8',
  institutional: '#82ca9d', 
  connected: '#ffc658',
  public: '#ff7300',
  fund: '#00c49f',
  new_equity_recipient: '#facc15',
  buyer: '#3b82f6', // Color for the acquirer in the target chart
  target: '#ef4444', // Color for the target
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
  dealEconomics,
  acquiringCompanyName,
  targetCompanyName,
  transactionFlow,
}: ShareholdingDiagramVisualizationProps) => {

  const beforeData: ShareholderData[] = shareholdingChanges?.before || fallbackData?.before?.map(item => ({
    ...item,
    type: (item.type || 'institutional') as ShareholderData['type']
  })) || [];
  
  const afterData: ShareholderData[] = shareholdingChanges?.after || fallbackData?.after?.map(item => ({
    ...item,
    type: (item.type || 'institutional') as ShareholderData['type']
  })) || [];

  const keyChanges = shareholdingChanges?.keyChanges || [];

  // --- New logic for Target Ownership ---
  const targetBeforeData: ShareholderData[] = [];
  const targetAfterData: ShareholderData[] = [];
  const acquiredPercentage = dealEconomics?.targetPercentage || 100;

  if (transactionFlow?.before && targetCompanyName) {
    const targetEntity = transactionFlow.before.entities.find(e => 
      e.name?.toLowerCase() === targetCompanyName.toLowerCase() && (e.type === 'target' || e.role === 'target')
    );
    if (targetEntity) {
      transactionFlow.before.relationships?.forEach(r => {
        if (r.target === targetEntity.id && (r.type === 'ownership' || r.type === 'owner')) {
          const shareholderEntity = transactionFlow.before.entities.find(e => e.id === r.source);
          if (shareholderEntity) {
            targetBeforeData.push({
              name: shareholderEntity.name,
              percentage: r.percentage || shareholderEntity.percentage || 0,
              type: (shareholderEntity.type as ShareholderData['type']) || 'institutional'
            });
          }
        }
      });
    }
  }

  // Fallback if no specific shareholders are found for the target
  if (targetBeforeData.length === 0 && targetCompanyName) {
    targetBeforeData.push({ name: `Original Shareholders`, percentage: 100, type: 'institutional' });
  }
  
  // Calculate target's ownership *after* the transaction
  if (acquiringCompanyName) {
    targetAfterData.push({
      name: acquiringCompanyName,
      percentage: acquiredPercentage,
      type: 'buyer' as ShareholderData['type'],
    });
  }
  if (acquiredPercentage < 100) {
    targetAfterData.push({
      name: 'Remaining Original Shareholders',
      percentage: 100 - acquiredPercentage,
      type: 'institutional',
    });
  }
  // --- End of new logic ---


  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload as ShareholderData;
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

  const renderPieChart = (data: ShareholderData[], title: string) => (
    <div className="text-center h-full flex flex-col">
      <h4 className="font-medium mb-2 text-sm">{title}</h4>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={60}
            paddingAngle={2}
            dataKey="percentage"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[getShareholderTypeForColor(entry.type)] || '#8884d8'} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  if (beforeData.length === 0 && afterData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>No shareholding data available for acquirer.</p>
      </div>
    );
  }

  return (
    <div className="h-full space-y-4 overflow-y-auto p-1">
      {/* Acquirer Shareholding Section */}
      <div className="border-b pb-4">
        <h3 className="text-md font-semibold text-center mb-2">Acquirer Shareholding Impact</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[200px]">
          {renderPieChart(beforeData, "Before New Equity")}
          
          <div className="flex flex-col items-center justify-center space-y-3">
            <ArrowRight className="h-8 w-8 text-blue-500" />
            <div className="text-center">
              <p className="text-sm font-medium">Shareholding Impact</p>
              {keyChanges.length > 0 && (
                <div className="space-y-1 mt-2">
                  {keyChanges.slice(0, 2).map((changeItem, index) => (
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
          
          {renderPieChart(afterData, "After New Equity")}
        </div>
      </div>
      
      {/* Target Ownership Section */}
      <div className="pt-4 border-b pb-4">
         <h3 className="text-md font-semibold text-center mb-2">Target Ownership Change</h3>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[200px]">
           {renderPieChart(targetBeforeData, `Before Acquisition`)}
           <div className="flex flex-col items-center justify-center space-y-3">
             <ArrowRight className="h-8 w-8 text-blue-500" />
             <p className="text-sm font-medium">Acquisition ({acquiredPercentage}%)</p>
           </div>
           {renderPieChart(targetAfterData, `After Acquisition`)}
         </div>
      </div>

      {/* Legend and Key Changes */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
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
