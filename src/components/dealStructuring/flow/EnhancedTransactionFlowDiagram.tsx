
import React, { useMemo } from 'react';
import { ReactFlow, Node, Edge, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TransactionFlow } from '@/types/transactionFlow';

interface EnhancedTransactionFlowDiagramProps {
  transactionFlow?: TransactionFlow;
}

const EnhancedTransactionFlowDiagram: React.FC<EnhancedTransactionFlowDiagramProps> = ({
  transactionFlow
}) => {
  const { nodes, edges } = useMemo(() => {
    if (!transactionFlow) {
      return { nodes: [], edges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Layout configuration
    const SECTION_WIDTH = 300;
    const SECTION_SPACING = 150;
    const VERTICAL_SPACING = 80;
    const START_Y = 50;
    const ENTITY_HEIGHT = 70;

    // Section positions
    const BEFORE_X = 50;
    const AFTER_X = BEFORE_X + SECTION_WIDTH + SECTION_SPACING;

    const beforeEntities = transactionFlow.before.entities;
    const afterEntities = transactionFlow.after.entities;
    const beforeRelationships = transactionFlow.before.relationships;
    const afterRelationships = transactionFlow.after.relationships;
    const transactionContext = transactionFlow.transactionContext;

    // Color schemes for different entity types
    const getNodeColors = (type: string, isNewOwner?: boolean) => {
      switch (type) {
        case 'target':
          return {
            backgroundColor: '#fef3c7',
            borderColor: '#f59e0b',
            textColor: '#92400e'
          };
        case 'buyer':
          return {
            backgroundColor: '#dbeafe',
            borderColor: '#2563eb',
            textColor: '#1e40af'
          };
        case 'stockholder':
          return isNewOwner ? {
            backgroundColor: '#ecfdf5',
            borderColor: '#10b981',
            textColor: '#047857'
          } : {
            backgroundColor: '#f3f4f6',
            borderColor: '#6b7280',
            textColor: '#374151'
          };
        case 'consideration':
          return {
            backgroundColor: '#f0fdf4',
            borderColor: '#16a34a',
            textColor: '#15803d'
          };
        default:
          return {
            backgroundColor: '#f3f4f6',
            borderColor: '#6b7280',
            textColor: '#374151'
          };
      }
    };

    // BEFORE SECTION
    // Section Header
    nodes.push({
      id: 'before-header',
      type: 'default',
      position: { x: BEFORE_X, y: START_Y },
      data: { 
        label: (
          <div className="text-lg font-bold text-gray-800">
            BEFORE TRANSACTION
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '250px',
        height: '40px'
      },
      draggable: false,
      selectable: false
    });

    // Target Company (Before)
    const beforeTarget = beforeEntities.find(e => e.type === 'target');
    if (beforeTarget) {
      const colors = getNodeColors('target');
      nodes.push({
        id: beforeTarget.id,
        type: 'default',
        position: { x: BEFORE_X + 75, y: START_Y + 60 },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-sm" style={{ color: colors.textColor }}>
                {beforeTarget.name}
              </div>
              <div className="text-xs text-gray-600">Target Company</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '150px',
          height: `${ENTITY_HEIGHT}px`
        }
      });
    }

    // Before Shareholders
    const beforeShareholders = beforeEntities.filter(e => e.type === 'stockholder');
    beforeShareholders.forEach((shareholder, index) => {
      const colors = getNodeColors('stockholder');
      const yPosition = START_Y + 160 + (index * (ENTITY_HEIGHT + 20));
      
      nodes.push({
        id: shareholder.id,
        type: 'default',
        position: { x: BEFORE_X + 75, y: yPosition },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs" style={{ color: colors.textColor }}>
                {shareholder.name}
              </div>
              <div className="text-xs text-gray-600">
                {shareholder.percentage}%
              </div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '150px',
          height: `${ENTITY_HEIGHT}px`
        }
      });
    });

    // AFTER SECTION
    // Section Header
    nodes.push({
      id: 'after-header',
      type: 'default',
      position: { x: AFTER_X, y: START_Y },
      data: { 
        label: (
          <div className="text-lg font-bold text-gray-800">
            AFTER TRANSACTION
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '250px',
        height: '40px'
      },
      draggable: false,
      selectable: false
    });

    // Target Company (After)
    const afterTarget = afterEntities.find(e => e.type === 'target');
    if (afterTarget) {
      const colors = getNodeColors('target');
      nodes.push({
        id: afterTarget.id,
        type: 'default',
        position: { x: AFTER_X + 75, y: START_Y + 60 },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-sm" style={{ color: colors.textColor }}>
                {afterTarget.name}
              </div>
              <div className="text-xs text-gray-600">Post-Transaction</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `3px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '150px',
          height: `${ENTITY_HEIGHT}px`
        }
      });
    }

    // After Shareholders
    const afterShareholders = afterEntities.filter(e => e.type === 'stockholder' || e.type === 'buyer');
    afterShareholders.forEach((shareholder, index) => {
      const colors = getNodeColors(shareholder.type, true);
      const yPosition = START_Y + 160 + (index * (ENTITY_HEIGHT + 20));
      
      nodes.push({
        id: shareholder.id,
        type: 'default',
        position: { x: AFTER_X + 75, y: yPosition },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs" style={{ color: colors.textColor }}>
                {shareholder.name}
              </div>
              <div className="text-xs text-gray-600">
                {shareholder.percentage}%
              </div>
              {shareholder.type === 'buyer' && (
                <div className="text-xs text-blue-600 font-medium">New Owner</div>
              )}
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '150px',
          height: `${ENTITY_HEIGHT}px`
        }
      });
    });

    // Consideration Entity
    const considerationEntity = afterEntities.find(e => e.type === 'consideration');
    if (considerationEntity) {
      const colors = getNodeColors('consideration');
      const considerationY = START_Y + 160 + (afterShareholders.length * (ENTITY_HEIGHT + 20));
      
      nodes.push({
        id: considerationEntity.id,
        type: 'default',
        position: { x: AFTER_X + 75, y: considerationY },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs" style={{ color: colors.textColor }}>
                {considerationEntity.name}
              </div>
              <div className="text-xs text-gray-600">Consideration</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '150px',
          height: `${ENTITY_HEIGHT}px`
        }
      });
    }

    // EDGES - Before Structure (Solid Lines)
    beforeRelationships.forEach((rel, index) => {
      if (nodes.find(n => n.id === rel.source) && nodes.find(n => n.id === rel.target)) {
        edges.push({
          id: `before-edge-${index}`,
          source: rel.source,
          target: rel.target,
          type: 'straight',
          style: {
            stroke: '#6b7280',
            strokeWidth: 2
          },
          label: rel.percentage ? `${rel.percentage}%` : '',
          labelStyle: {
            fontSize: '10px',
            fontWeight: 'bold',
            fill: '#6b7280'
          }
        });
      }
    });

    // EDGES - After Structure (Solid Lines)
    afterRelationships.forEach((rel, index) => {
      if (nodes.find(n => n.id === rel.source) && nodes.find(n => n.id === rel.target)) {
        const isConsideration = rel.type === 'consideration';
        const isBuyer = afterEntities.find(e => e.id === rel.source)?.type === 'buyer';
        
        edges.push({
          id: `after-edge-${index}`,
          source: rel.source,
          target: rel.target,
          type: 'straight',
          style: {
            stroke: isConsideration ? '#16a34a' : isBuyer ? '#2563eb' : '#6b7280',
            strokeWidth: isConsideration ? 3 : 2
          },
          label: rel.percentage ? `${rel.percentage}%` : rel.value ? `${transactionContext?.currency} ${(rel.value / 1000000).toFixed(0)}M` : '',
          labelStyle: {
            fontSize: '10px',
            fontWeight: 'bold',
            fill: isConsideration ? '#16a34a' : isBuyer ? '#2563eb' : '#6b7280'
          }
        });
      }
    });

    // TRANSACTION FLOW EDGES (Dotted Lines)
    // Connect before target to after target
    if (beforeTarget && afterTarget) {
      edges.push({
        id: 'transaction-flow-target',
        source: beforeTarget.id,
        target: afterTarget.id,
        type: 'straight',
        style: {
          stroke: '#7c3aed',
          strokeWidth: 3,
          strokeDasharray: '8,4'
        },
        label: 'Transaction',
        labelStyle: {
          fontSize: '11px',
          fontWeight: 'bold',
          fill: '#7c3aed',
          backgroundColor: 'white',
          padding: '2px 4px',
          borderRadius: '3px'
        }
      });
    }

    // Connect shareholders that exist in both before and after (continuing shareholders)
    beforeShareholders.forEach(beforeSh => {
      const afterSh = afterShareholders.find(afterSh => 
        afterSh.name === beforeSh.name && afterSh.type === 'stockholder'
      );
      
      if (afterSh) {
        edges.push({
          id: `shareholder-flow-${beforeSh.id}`,
          source: beforeSh.id,
          target: afterSh.id,
          type: 'straight',
          style: {
            stroke: '#f59e0b',
            strokeWidth: 2,
            strokeDasharray: '6,3'
          },
          label: 'Continues',
          labelStyle: {
            fontSize: '9px',
            fontWeight: 'bold',
            fill: '#f59e0b'
          }
        });
      }
    });

    return { nodes, edges };
  }, [transactionFlow]);

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        zoomOnScroll={true}
        panOnDrag={true}
        className="bg-gray-50"
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

export default EnhancedTransactionFlowDiagram;
