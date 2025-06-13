
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Building2, Users, Target, Briefcase, Crown } from 'lucide-react';
import { EnhancedTransactionEntity } from '@/types/enhancedTransactionFlow';

interface EnhancedTransactionNodeProps {
  data: {
    entity: EnhancedTransactionEntity;
    phase: 'before' | 'after';
    hierarchyLevel: number;
  };
}

const EnhancedTransactionNode = memo(({ data }: EnhancedTransactionNodeProps) => {
  const { entity } = data;

  const getIcon = () => {
    switch (entity.type) {
      case 'target':
        return <Target className="h-4 w-4 text-orange-600" />;
      case 'buyer':
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'stockholder':
        return entity.isControlling ? <Crown className="h-4 w-4 text-purple-600" /> : <Users className="h-4 w-4 text-gray-600" />;
      case 'management':
        return <Briefcase className="h-4 w-4 text-indigo-600" />;
      default:
        return <Building2 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNodeStyle = () => {
    const baseStyle = "border rounded-lg min-w-[120px] max-w-[160px] bg-white shadow-sm";
    
    switch (entity.type) {
      case 'target':
        return `${baseStyle} border-orange-400`;
      case 'buyer':
        return `${baseStyle} border-blue-400`;
      case 'stockholder':
        return entity.isControlling 
          ? `${baseStyle} border-purple-400`
          : `${baseStyle} border-gray-400`;
      case 'management':
        return `${baseStyle} border-indigo-400`;
      default:
        return `${baseStyle} border-gray-300`;
    }
  };

  return (
    <div className={`px-3 py-2 ${getNodeStyle()}`}>
      {/* Hide handles to reduce visual clutter */}
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <Handle type="source" position={Position.Right} className="!opacity-0" />
      
      <div className="flex items-center gap-2">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate" title={entity.name}>
            {entity.name}
          </div>
          
          {entity.listingStatus && entity.listingStatus === 'listed' && (
            <div className="text-xs text-blue-600 mt-1">
              Listed Entity
            </div>
          )}
          
          {entity.isControlling && (
            <div className="flex items-center text-xs text-purple-600 mt-1">
              <Crown className="h-3 w-3 mr-1" />
              Controlling
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

EnhancedTransactionNode.displayName = 'EnhancedTransactionNode';

export default EnhancedTransactionNode;
