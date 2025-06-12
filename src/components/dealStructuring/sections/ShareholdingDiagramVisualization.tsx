
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ArrowRight, TrendingUp, TrendingDown, Plus, Minus } from 'lucide-react';
import { ShareholdingChanges } from '@/types/dealStructuring';

interface ShareholdingDiagramVisualizationProps {
  shareholdingChanges?: ShareholdingChanges;
  fallbackData?: {
    before: Array<{ name: string; percentage: number }>;
    after: Array<{ name: string; percentage: number }>;
    impact: string;
  };
}

const COLORS = {
  individual: '#8884d8',
  institutional: '#82ca9d', 
  connected: '#ffc658',
  public: '#ff7300',
  fund: '#00c49f'
};

const getChangeIcon = (change: number) => {
  if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
  return null;
};

export const ShareholdingDiagramVisualization = ({ 
  shareholdingChanges, 
  fallbackData 
}: ShareholdingDiagramVisualizationProps) => {
  // Use enhanced data if available, otherwise fallback to basic data
  const beforeData = shareholdingChanges?.before || fallbackData?.before?.map(item => ({
    ...item,
    type: 'institutional' as const
  })) || [];
  
  const afterData = shareholdingChanges?.after || fallbackData?.after?.map(item => ({
    ...item,
    type: 'institutional' as const
  })) || [];

  const keyChanges = shareholdingChanges?.keyChanges || [];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">{data.percentage.toFixed(2)}%</p>
          <p className="text-xs text-gray-500 capitalize">{data.type}</p>
        </div>
      );
    }
    return null;
  };

  if (beforeData.length === 0 && afterData.length === 0) {
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
                data={beforeData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={80}
                paddingAngle={2}
                dataKey="percentage"
              >
                {beforeData.map((entry, index) => (
                  <Cell 
                    key={`before-${index}`} 
                    fill={COLORS[entry.type] || '#8884d8'} 
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
            {keyChanges.length > 0 && (
              <div className="space-y-1 mt-2">
                {keyChanges.slice(0, 3).map((change, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {getChangeIcon(change.change)}
                    <span className="truncate">
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
                data={afterData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={80}
                paddingAngle={2}
                dataKey="percentage"
              >
                {afterData.map((entry, index) => (
                  <Cell 
                    key={`after-${index}`} 
                    fill={COLORS[entry.type] || '#8884d8'} 
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
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>

        {/* Key Changes Summary */}
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
