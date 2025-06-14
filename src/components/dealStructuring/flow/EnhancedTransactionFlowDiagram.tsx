
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

    // Enhanced layout configuration for hierarchical positioning
    const SECTION_WIDTH = 350;
    const SECTION_SPACING = 200;
    const SHAREHOLDER_LEVEL_Y = 50;
    const COMPANY_LEVEL_Y = 200;
    const CONSIDERATION_LEVEL_Y = 350;
    const ENTITY_WIDTH = 180;
    const ENTITY_HEIGHT = 80;
    const HORIZONTAL_SPACING = 200;

    // Section positions
    const BEFORE_X = 50;
    const TRANSACTION_X = BEFORE_X + SECTION_WIDTH + SECTION_SPACING;
    const AFTER_X = TRANSACTION_X + SECTION_WIDTH + SECTION_SPACING;

    const beforeEntities = transactionFlow.before.entities;
    const afterEntities = transactionFlow.after.entities;
    const beforeRelationships = transactionFlow.before.relationships;
    const afterRelationships = transactionFlow.after.relationships;
    const transactionContext = transactionFlow.transactionContext;

    // Color schemes for different entity types with enhanced styling
    const getNodeColors = (type: string, isNewOwner?: boolean, isTransaction?: boolean) => {
      switch (type) {
        case 'target':
          return {
            backgroundColor: isTransaction ? '#fef3c7' : '#fef3c7',
            borderColor: isTransaction ? '#f59e0b' : '#f59e0b',
            textColor: '#92400e',
            borderWidth: isTransaction ? '3px' : '2px'
          };
        case 'buyer':
          return {
            backgroundColor: '#dbeafe',
            borderColor: '#2563eb',
            textColor: '#1e40af',
            borderWidth: '2px'
          };
        case 'stockholder':
          return isNewOwner ? {
            backgroundColor: '#ecfdf5',
            borderColor: '#10b981',
            textColor: '#047857',
            borderWidth: '2px'
          } : {
            backgroundColor: '#f3f4f6',
            borderColor: '#6b7280',
            textColor: '#374151',
            borderWidth: '2px'
          };
        case 'consideration':
          return {
            backgroundColor: '#f0fdf4',
            borderColor: '#16a34a',
            textColor: '#15803d',
            borderWidth: '2px'
          };
        default:
          return {
            backgroundColor: '#f3f4f6',
            borderColor: '#6b7280',
            textColor: '#374151',
            borderWidth: '2px'
          };
      }
    };

    // Helper function to create positioned entities with hierarchical layout
    const createEntityNode = (entity: any, x: number, y: number, label: string, isTransaction = false) => {
      const colors = getNodeColors(entity.type, entity.type === 'buyer', isTransaction);
      return {
        id: entity.id,
        type: 'default',
        position: { x, y },
        data: {
          label: (
            <div className="text-center p-3">
              <div className="font-semibold text-sm" style={{ color: colors.textColor }}>
                {entity.name}
              </div>
              <div className="text-xs text-gray-600">{label}</div>
              {entity.percentage && (
                <div className="text-xs font-medium text-blue-600">
                  {entity.percentage}%
                </div>
              )}
              {entity.value && (
                <div className="text-xs font-medium text-green-600">
                  {entity.currency} {(entity.value / 1000000).toFixed(0)}M
                </div>
              )}
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `${colors.borderWidth} solid ${colors.borderColor}`,
          borderRadius: '10px',
          width: `${ENTITY_WIDTH}px`,
          height: `${ENTITY_HEIGHT}px`,
          boxShadow: isTransaction ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)'
        }
      };
    };

    // BEFORE SECTION HEADER
    nodes.push({
      id: 'before-header',
      type: 'default',
      position: { x: BEFORE_X + 50, y: 10 },
      data: { 
        label: (
          <div className="text-lg font-bold text-gray-800 text-center">
            BEFORE TRANSACTION
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '250px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    // BEFORE STRUCTURE: Hierarchical layout with shareholders above companies
    const beforeTarget = beforeEntities.find(e => e.type === 'target');
    const beforeShareholders = beforeEntities.filter(e => e.type === 'stockholder');

    // Position target company
    if (beforeTarget) {
      nodes.push(createEntityNode(
        beforeTarget,
        BEFORE_X + 85,
        COMPANY_LEVEL_Y,
        'Target Company'
      ));
    }

    // Position shareholders above target company (same level, horizontally aligned)
    beforeShareholders.forEach((shareholder, index) => {
      const totalShareholders = beforeShareholders.length;
      const startX = BEFORE_X + 85 - ((totalShareholders - 1) * HORIZONTAL_SPACING / 2);
      const shareholderX = startX + (index * HORIZONTAL_SPACING);
      
      nodes.push(createEntityNode(
        shareholder,
        shareholderX,
        SHAREHOLDER_LEVEL_Y,
        `${shareholder.percentage}% Owner`
      ));
    });

    // TRANSACTION SECTION HEADER
    nodes.push({
      id: 'transaction-header',
      type: 'default',
      position: { x: TRANSACTION_X + 50, y: 10 },
      data: { 
        label: (
          <div className="text-lg font-bold text-purple-800 text-center">
            TRANSACTION
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '250px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    // Transaction process indicator
    nodes.push({
      id: 'transaction-process',
      type: 'default',
      position: { x: TRANSACTION_X + 85, y: COMPANY_LEVEL_Y },
      data: {
        label: (
          <div className="text-center p-3">
            <div className="font-semibold text-sm text-purple-700">
              {transactionContext?.type || 'Transaction'}
            </div>
            <div className="text-xs text-gray-600">In Progress</div>
            {transactionContext?.amount && (
              <div className="text-xs font-medium text-purple-600">
                {transactionContext.currency} {(transactionContext.amount / 1000000).toFixed(0)}M
              </div>
            )}
          </div>
        )
      },
      style: {
        backgroundColor: '#f3e8ff',
        border: '3px dashed #7c3aed',
        borderRadius: '10px',
        width: `${ENTITY_WIDTH}px`,
        height: `${ENTITY_HEIGHT}px`,
        boxShadow: '0 4px 12px rgba(124,58,237,0.2)'
      }
    });

    // AFTER SECTION HEADER
    nodes.push({
      id: 'after-header',
      type: 'default',
      position: { x: AFTER_X + 50, y: 10 },
      data: { 
        label: (
          <div className="text-lg font-bold text-gray-800 text-center">
            AFTER TRANSACTION
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '250px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    // AFTER STRUCTURE: Hierarchical layout with new ownership structure
    const afterTarget = afterEntities.find(e => e.type === 'target');
    const afterShareholders = afterEntities.filter(e => e.type === 'stockholder' || e.type === 'buyer');
    const considerationEntity = afterEntities.find(e => e.type === 'consideration');

    // Position target company (after)
    if (afterTarget) {
      nodes.push(createEntityNode(
        afterTarget,
        AFTER_X + 85,
        COMPANY_LEVEL_Y,
        'Post-Transaction',
        true
      ));
    }

    // Position new shareholders above target company (same level, horizontally aligned)
    afterShareholders.forEach((shareholder, index) => {
      const totalShareholders = afterShareholders.length;
      const startX = AFTER_X + 85 - ((totalShareholders - 1) * HORIZONTAL_SPACING / 2);
      const shareholderX = startX + (index * HORIZONTAL_SPACING);
      
      const label = shareholder.type === 'buyer' ? 'New Owner' : 'Continuing Owner';
      nodes.push(createEntityNode(
        shareholder,
        shareholderX,
        SHAREHOLDER_LEVEL_Y,
        `${shareholder.percentage}% ${label}`
      ));
    });

    // Position consideration entity
    if (considerationEntity) {
      nodes.push(createEntityNode(
        considerationEntity,
        AFTER_X + 85,
        CONSIDERATION_LEVEL_Y,
        'Transaction Consideration'
      ));
    }

    // EDGES - Enhanced relationship visualization

    // Before structure ownership relationships (shareholders → target)
    beforeRelationships.forEach((rel, index) => {
      if (nodes.find(n => n.id === rel.source) && nodes.find(n => n.id === rel.target)) {
        edges.push({
          id: `before-ownership-${index}`,
          source: rel.source,
          target: rel.target,
          type: 'straight',
          style: {
            stroke: '#6b7280',
            strokeWidth: 3
          },
          label: rel.percentage ? `${rel.percentage}%` : '',
          labelStyle: {
            fontSize: '11px',
            fontWeight: 'bold',
            fill: '#6b7280',
            backgroundColor: 'white',
            padding: '2px 6px',
            borderRadius: '4px'
          }
        });
      }
    });

    // After structure ownership relationships (new shareholders → target)
    afterRelationships.forEach((rel, index) => {
      if (nodes.find(n => n.id === rel.source) && nodes.find(n => n.id === rel.target)) {
        const isConsideration = rel.type === 'consideration';
        const isBuyer = afterEntities.find(e => e.id === rel.source)?.type === 'buyer';
        
        edges.push({
          id: `after-ownership-${index}`,
          source: rel.source,
          target: rel.target,
          type: 'straight',
          style: {
            stroke: isConsideration ? '#16a34a' : isBuyer ? '#2563eb' : '#6b7280',
            strokeWidth: isConsideration ? 4 : 3
          },
          label: rel.percentage ? `${rel.percentage}%` : rel.value ? `${transactionContext?.currency} ${(rel.value / 1000000).toFixed(0)}M` : '',
          labelStyle: {
            fontSize: '11px',
            fontWeight: 'bold',
            fill: isConsideration ? '#16a34a' : isBuyer ? '#2563eb' : '#6b7280',
            backgroundColor: 'white',
            padding: '2px 6px',
            borderRadius: '4px'
          }
        });
      }
    });

    // TRANSACTION FLOW CONNECTIONS (showing the transformation)
    
    // Connect before target to transaction process
    if (beforeTarget) {
      edges.push({
        id: 'before-to-transaction',
        source: beforeTarget.id,
        target: 'transaction-process',
        type: 'straight',
        style: {
          stroke: '#7c3aed',
          strokeWidth: 3,
          strokeDasharray: '8,4'
        },
        label: 'Acquisition',
        labelStyle: {
          fontSize: '11px',
          fontWeight: 'bold',
          fill: '#7c3aed',
          backgroundColor: 'white',
          padding: '2px 6px',
          borderRadius: '4px'
        }
      });
    }

    // Connect transaction process to after target
    if (afterTarget) {
      edges.push({
        id: 'transaction-to-after',
        source: 'transaction-process',
        target: afterTarget.id,
        type: 'straight',
        style: {
          stroke: '#7c3aed',
          strokeWidth: 3,
          strokeDasharray: '8,4'
        },
        label: 'Completion',
        labelStyle: {
          fontSize: '11px',
          fontWeight: 'bold',
          fill: '#7c3aed',
          backgroundColor: 'white',
          padding: '2px 6px',
          borderRadius: '4px'
        }
      });
    }

    // Connect continuing shareholders (before → after)
    beforeShareholders.forEach(beforeSh => {
      const afterSh = afterShareholders.find(afterSh => 
        afterSh.name === beforeSh.name && afterSh.type === 'stockholder'
      );
      
      if (afterSh) {
        edges.push({
          id: `shareholder-continuation-${beforeSh.id}`,
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
            fontSize: '10px',
            fontWeight: 'bold',
            fill: '#f59e0b',
            backgroundColor: 'white',
            padding: '1px 4px',
            borderRadius: '3px'
          }
        });
      }
    });

    // Connect consideration flows
    if (considerationEntity) {
      const buyer = afterShareholders.find(sh => sh.type === 'buyer');
      if (buyer) {
        edges.push({
          id: 'consideration-flow',
          source: buyer.id,
          target: considerationEntity.id,
          type: 'straight',
          style: {
            stroke: '#16a34a',
            strokeWidth: 3,
            strokeDasharray: '5,2'
          },
          label: 'Payment',
          labelStyle: {
            fontSize: '10px',
            fontWeight: 'bold',
            fill: '#16a34a',
            backgroundColor: 'white',
            padding: '1px 4px',
            borderRadius: '3px'
          }
        });
      }
    }

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
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
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
