
import { Building2, ArrowDown, Users } from 'lucide-react';
import { CorporateStructure } from '@/types/dealStructuring';

interface CorporateStructureDiagramProps {
  corporateStructure?: CorporateStructure;
  transactionType: string;
}

export const CorporateStructureDiagram = ({ 
  corporateStructure, 
  transactionType 
}: CorporateStructureDiagramProps) => {
  if (!corporateStructure || corporateStructure.entities.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
        <Building2 className="h-12 w-12 text-gray-300" />
        <div className="text-center">
          <p className="font-medium">Corporate Structure Diagram</p>
          <p className="text-sm">Transaction: {transactionType}</p>
          <p className="text-xs mt-2">Detailed structure analysis will be generated based on your transaction requirements</p>
        </div>
      </div>
    );
  }

  const { entities, relationships = [], mainIssuer, targetEntities } = corporateStructure;
  
  // Group entities by type
  const entityGroups = entities.reduce((groups, entity) => {
    if (!groups[entity.type]) {
      groups[entity.type] = [];
    }
    groups[entity.type].push(entity);
    return groups;
  }, {} as Record<string, typeof entities>);

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'parent':
        return <Building2 className="h-5 w-5 text-blue-600" />;
      case 'subsidiary':
        return <Building2 className="h-4 w-4 text-green-600" />;
      case 'target':
        return <Building2 className="h-5 w-5 text-orange-600" />;
      case 'issuer':
        return <Building2 className="h-5 w-5 text-purple-600" />;
      default:
        return <Building2 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEntityStyle = (entityId: string) => {
    if (entityId === mainIssuer) {
      return 'border-2 border-purple-500 bg-purple-50';
    }
    if (targetEntities?.includes(entityId)) {
      return 'border-2 border-orange-500 bg-orange-50';
    }
    return 'border border-gray-300 bg-white';
  };

  // Find relationships for an entity
  const getChildEntities = (parentId: string) => {
    return relationships
      .filter(rel => rel.parent === parentId)
      .map(rel => {
        const childEntity = entities.find(e => e.id === rel.child);
        return { ...childEntity, ownershipPercentage: rel.ownershipPercentage };
      })
      .filter(Boolean);
  };

  // Render entity hierarchy
  const renderEntityTree = (entity: any, level = 0) => {
    const children = getChildEntities(entity.id);
    
    return (
      <div key={entity.id} className={`ml-${level * 6}`}>
        <div className={`p-3 rounded-lg mb-2 ${getEntityStyle(entity.id)}`}>
          <div className="flex items-center gap-2">
            {getEntityIcon(entity.type)}
            <div className="flex-1">
              <p className="font-medium text-sm">{entity.name}</p>
              <p className="text-xs text-gray-600 capitalize">{entity.type}</p>
              {entity.ownershipPercentage && (
                <p className="text-xs text-blue-600 font-medium">
                  {entity.ownershipPercentage}% ownership
                </p>
              )}
            </div>
          </div>
        </div>
        
        {children.length > 0 && (
          <div className="ml-4 border-l-2 border-gray-200 pl-4">
            {children.map(child => renderEntityTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Find root entities (entities with no parent) - Fixed the error here
  const rootEntities = entities.filter(entity => 
    !relationships.some(rel => rel.child === entity.id)
  );

  return (
    <div className="h-full overflow-y-auto space-y-4">
      <div className="text-center pb-3 border-b">
        <h4 className="font-medium">Corporate Structure</h4>
        <p className="text-sm text-gray-600">{transactionType}</p>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-purple-500 bg-purple-50 rounded"></div>
          <span>Main Issuer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-orange-500 bg-orange-50 rounded"></div>
          <span>Target Entity</span>
        </div>
      </div>

      {/* Entity Tree */}
      <div className="space-y-3">
        {rootEntities.length > 0 ? (
          rootEntities.map(entity => renderEntityTree(entity))
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Corporate structure will be displayed here</p>
          </div>
        )}
      </div>

      {/* Key Relationships Summary */}
      {relationships.length > 0 && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <h5 className="font-medium text-sm mb-2">Key Relationships:</h5>
          <div className="space-y-1 text-xs">
            {relationships.map((rel, index) => {
              const parent = entities.find(e => e.id === rel.parent);
              const child = entities.find(e => e.id === rel.child);
              return (
                <div key={index} className="flex items-center gap-2">
                  <span className="font-medium">{parent?.name}</span>
                  <ArrowDown className="h-3 w-3 text-gray-400" />
                  <span>{child?.name}</span>
                  <span className="text-blue-600 ml-auto">
                    {rel.ownershipPercentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
