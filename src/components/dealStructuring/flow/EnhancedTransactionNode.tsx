
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Building2, Users, DollarSign, Target, Briefcase, Crown, TrendingUp } from 'lucide-react';
import { EnhancedTransactionEntity } from '@/types/enhancedTransactionFlow';

interface EnhancedTransactionNodeProps {
  data: {
    entity: EnhancedTransactionEntity;
    phase: 'before' | 'after';
    hierarchyLevel: number;
  };
}

const EnhancedTransactionNode = memo(({ data }: EnhancedTransactionNodeProps) => {
  const { entity, phase, hierarchyLevel } = data;

  const getIcon = () => {
    switch (entity.type) {
      case 'target':
        return <Target className="h-4 w-4 text-orange-600" />;
      case 'buyer':
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'stockholder':
        return entity.isControlling ? <Crown className="h-4 w-4 text-purple-600" /> : <Users className="h-4 w-4 text-green-600" />;
      case 'consideration':
        return <DollarSign className="h-4 w-4 text-yellow-600" />;
      case 'management':
        return <Briefcase className="h-4 w-4 text-indigo-600" />;
      case 'holdingco':
        return <Building2 className="h-4 w-4 text-gray-600" />;
      default:
        return <Building2 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNodeStyle = () => {
    const baseStyle = "border-2 rounded-lg min-w-[140px] max-w-[180px]";
    
    switch (entity.type) {
      case 'target':
        return `${baseStyle} border-orange-500 bg-orange-50 shadow-md`;
      case 'buyer':
        return `${baseStyle} border-blue-500 bg-blue-50 shadow-md`;
      case 'stockholder':
        return entity.isControlling 
          ? `${baseStyle} border-purple-500 bg-purple-50 shadow-md`
          : `${baseStyle} border-green-500 bg-green-50 shadow-sm`;
      case 'consideration':
        return `${baseStyle} border-yellow-500 bg-yellow-50 shadow-lg`;
      case 'management':
        return `${baseStyle} border-indigo-500 bg-indigo-50 shadow-sm`;
      default:
        return `${baseStyle} border-gray-400 bg-gray-50 shadow-sm`;
    }
  };

  const getEntityClassBadge = () => {
    switch (entity.entityClass) {
      case 'institutional':
        return <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Institutional</span>;
      case 'public':
        return <span className="text-xs bg-green-100 text-green-800 px-1 rounded">Public</span>;
      case 'fund':
        return <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded">Fund</span>;
      case 'connected':
        return <span className="text-xs bg-orange-100 text-orange-800 px-1 rounded">Connected</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`px-3 py-2 ${getNodeStyle()}`}>
      <Handle type="target" position={Position.Top} className="!bg-gray-400 !border-gray-600" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !border-gray-600" />
      <Handle type="target" position={Position.Left} className="!bg-gray-400 !border-gray-600" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400 !border-gray-600" />
      
      <div className="flex items-start gap-2 mb-1">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate" title={entity.name}>
            {entity.name}
          </div>
          {getEntityClassBadge()}
        </div>
      </div>
      
      {entity.percentage !== undefined && (
        <div className="text-xs font-medium text-gray-700 mb-1">
          {entity.percentage.toFixed(1)}% ownership
        </div>
      )}

      {entity.votingRights !== undefined && entity.votingRights !== entity.percentage && (
        <div className="text-xs text-gray-600">
          {entity.votingRights.toFixed(1)}% voting
        </div>
      )}
      
      {entity.value && (
        <div className="text-xs font-medium text-green-700">
          {entity.currency} {(entity.value / 1000000).toFixed(0)}M
        </div>
      )}

      {entity.listingStatus && (
        <div className="text-xs text-gray-500 mt-1">
          {entity.listingStatus === 'listed' ? '📈 Listed' : '🏢 Private'}
        </div>
      )}
      
      {entity.description && (
        <div className="text-xs text-gray-500 mt-1 truncate" title={entity.description}>
          {entity.description}
        </div>
      )}

      {entity.isControlling && (
        <div className="flex items-center text-xs text-purple-600 mt-1">
          <Crown className="h-3 w-3 mr-1" />
          Controlling
        </div>
      )}
    </div>
  );
});

EnhancedTransactionNode.displayName = 'EnhancedTransactionNode';

export default EnhancedTransactionNode;
