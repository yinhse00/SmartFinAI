
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Building2, Users, DollarSign, Target } from 'lucide-react';

interface TransactionFlowNodeProps {
  data: {
    label: string;
    entityType: 'target' | 'buyer' | 'stockholder' | 'subsidiary' | 'newco' | 'consideration';
    value?: number;
    percentage?: number;
    description?: string;
  };
}

const TransactionFlowNode = memo(({ data }: TransactionFlowNodeProps) => {
  const getIcon = () => {
    switch (data.entityType) {
      case 'target':
        return <Target className="h-4 w-4 text-red-600" />;
      case 'buyer':
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'stockholder':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'consideration':
        return <DollarSign className="h-4 w-4 text-yellow-600" />;
      default:
        return <Building2 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNodeStyle = () => {
    switch (data.entityType) {
      case 'target':
        return 'border-red-500 bg-red-50';
      case 'buyer':
        return 'border-blue-500 bg-blue-50';
      case 'stockholder':
        return 'border-green-500 bg-green-50';
      case 'consideration':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className={`px-4 py-3 rounded-lg border-2 min-w-[120px] ${getNodeStyle()}`}>
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />
      
      <div className="flex items-center gap-2 mb-1">
        {getIcon()}
        <span className="text-sm font-medium">{data.label}</span>
      </div>
      
      {data.percentage && (
        <div className="text-xs text-gray-600">
          {data.percentage.toFixed(1)}%
        </div>
      )}
      
      {data.value && (
        <div className="text-xs text-gray-600">
          HK${data.value.toLocaleString()}M
        </div>
      )}
      
      {data.description && (
        <div className="text-xs text-gray-500 mt-1">
          {data.description}
        </div>
      )}
    </div>
  );
});

TransactionFlowNode.displayName = 'TransactionFlowNode';

export default TransactionFlowNode;
