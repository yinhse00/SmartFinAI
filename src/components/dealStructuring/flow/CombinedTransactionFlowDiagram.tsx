
import React, { useMemo } from 'react';
import { ReactFlow, Node, Edge, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TransactionFlow } from '@/types/transactionFlow';

interface CombinedTransactionFlowDiagramProps {
  transactionFlow?: TransactionFlow;
}

const CombinedTransactionFlowDiagram: React.FC<CombinedTransactionFlowDiagramProps> = ({
  transactionFlow
}) => {
  const { nodes, edges } = useMemo(() => {
    if (!transactionFlow) {
      return { nodes: [], edges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Layout configuration
    const SECTION_WIDTH = 400;
    const SECTION_SPACING = 80;
    const VERTICAL_SPACING = 80;
    const START_Y = 50;

    // Section positions
    const BEFORE_X = 50;
    const TRANSACTION_X = BEFORE_X + SECTION_WIDTH + SECTION_SPACING;
    const AFTER_X = TRANSACTION_X + SECTION_WIDTH + SECTION_SPACING;

    // Color schemes for different entity types
    const getNodeColors = (type: string, ownership?: number) => {
      switch (type) {
        case 'target':
          return {
            backgroundColor: '#fef3c7',
            borderColor: '#f59e0b'
          };
        case 'buyer':
          return {
            backgroundColor: '#dbeafe',
            borderColor: '#2563eb'
          };
        case 'stockholder':
          if (ownership && ownership > 50) {
            return {
              backgroundColor: '#dbeafe',
              borderColor: '#2563eb'
            };
          }
          return {
            backgroundColor: '#f3f4f6',
            borderColor: '#6b7280'
          };
        case 'consideration':
          return {
            backgroundColor: '#f0fdf4',
            borderColor: '#16a34a'
          };
        default:
          return {
            backgroundColor: '#f3f4f6',
            borderColor: '#6b7280'
          };
      }
    };

    const beforeEntities = transactionFlow.before.entities;
    const afterEntities = transactionFlow.after.entities;
    const beforeRelationships = transactionFlow.before.relationships;
    const afterRelationships = transactionFlow.after.relationships;
    const transactionContext = transactionFlow.transactionContext;

    // BEFORE SECTION
    let currentY = START_Y;

    // Before Section Header
    nodes.push({
      id: 'before-header',
      type: 'default',
      position: { x: BEFORE_X, y: currentY },
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
        width: '350px',
        height: '40px'
      },
      draggable: false,
      selectable: false
    });

    currentY += 60;

    // Acquiring Company Section Header
    nodes.push({
      id: 'acquiring-section-header',
      type: 'default',
      position: { x: BEFORE_X, y: currentY },
      data: { 
        label: (
          <div className="text-sm font-semibold text-blue-700">
            ACQUIRING COMPANY STRUCTURE
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '350px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    currentY += 50;

    // Acquiring Company Shareholders (Y-level 1)
    const beforeShareholdersY = currentY;
    
    // Controlling Shareholder
    const controllingEntity = beforeEntities.find(e => e.id === 'before-controlling-shareholder');
    if (controllingEntity) {
      const colors = getNodeColors('stockholder', controllingEntity.percentage);
      nodes.push({
        id: 'before-controlling-shareholder',
        type: 'default',
        position: { x: BEFORE_X, y: beforeShareholdersY },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{controllingEntity.name}</div>
              <div className="text-xs text-gray-600">{controllingEntity.percentage}%</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '150px',
          height: '60px'
        }
      });
    }

    // Public Shareholders
    const publicEntity = beforeEntities.find(e => e.id === 'before-public-shareholders');
    if (publicEntity) {
      const colors = getNodeColors('stockholder', publicEntity.percentage);
      nodes.push({
        id: 'before-public-shareholders',
        type: 'default',
        position: { x: BEFORE_X + 200, y: beforeShareholdersY },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{publicEntity.name}</div>
              <div className="text-xs text-gray-600">{publicEntity.percentage}%</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '150px',
          height: '60px'
        }
      });
    }

    currentY += 80;

    // Acquiring Company (Y-level 2)
    const beforeAcquiringCompanyY = currentY;
    const acquiringEntity = beforeEntities.find(e => e.id === 'before-acquiring-company');
    if (acquiringEntity) {
      const colors = getNodeColors('buyer');
      nodes.push({
        id: 'before-acquiring-company',
        type: 'default',
        position: { x: BEFORE_X + 100, y: beforeAcquiringCompanyY },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-sm">{acquiringEntity.name}</div>
              <div className="text-xs text-gray-600">Listed Entity</div>
              {acquiringEntity.description && (
                <div className="text-xs text-gray-500">{acquiringEntity.description}</div>
              )}
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '180px',
          height: '80px'
        }
      });
    }

    currentY += 120;

    // Target Company Section Header
    nodes.push({
      id: 'target-section-header',
      type: 'default',
      position: { x: BEFORE_X, y: currentY },
      data: { 
        label: (
          <div className="text-sm font-semibold text-orange-700">
            TARGET COMPANY STRUCTURE
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '350px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    currentY += 50;

    // Target Existing Shareholders (Y-level 3)
    const beforeTargetShareholdersY = currentY;
    const targetShareholdersEntity = beforeEntities.find(e => e.id === 'before-target-shareholders');
    if (targetShareholdersEntity) {
      const colors = getNodeColors('stockholder');
      nodes.push({
        id: 'before-target-shareholders',
        type: 'default',
        position: { x: BEFORE_X + 100, y: beforeTargetShareholdersY },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{targetShareholdersEntity.name}</div>
              <div className="text-xs text-gray-600">{targetShareholdersEntity.percentage}%</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '160px',
          height: '60px'
        }
      });
    }

    currentY += 80;

    // Target Company (Y-level 4)
    const beforeTargetCompanyY = currentY;
    const targetEntity = beforeEntities.find(e => e.id === 'before-target-company');
    if (targetEntity) {
      const colors = getNodeColors('target');
      nodes.push({
        id: 'before-target-company',
        type: 'default',
        position: { x: BEFORE_X + 100, y: beforeTargetCompanyY },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-sm">{targetEntity.name}</div>
              <div className="text-xs text-gray-600">Target Entity</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '160px',
          height: '70px'
        }
      });
    }

    // TRANSACTION SECTION
    const transactionY = START_Y + 200;

    // Transaction Header
    nodes.push({
      id: 'transaction-header',
      type: 'default',
      position: { x: TRANSACTION_X, y: START_Y },
      data: { 
        label: (
          <div className="text-lg font-bold text-blue-800">
            TRANSACTION
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '350px',
        height: '40px'
      },
      draggable: false,
      selectable: false
    });

    // Transaction Details
    nodes.push({
      id: 'transaction-details',
      type: 'default',
      position: { x: TRANSACTION_X, y: transactionY },
      data: {
        label: (
          <div className="text-center p-4">
            <div className="text-lg font-bold mb-3 text-blue-900">
              {transactionContext?.type || 'Acquisition'}
            </div>
            <div className="space-y-2 text-xs text-left">
              <div className="bg-blue-50 p-2 rounded">
                <strong className="text-blue-800">Transaction:</strong>
                <div className="text-blue-700">{transactionContext?.description}</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <strong className="text-green-800">Consideration:</strong>
                <div className="text-green-700">
                  {transactionContext?.currency} {(transactionContext?.amount || 0) / 1000000}M
                </div>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <strong className="text-orange-800">Ownership:</strong>
                <div className="text-orange-700">
                  {afterRelationships.find(r => r.source.includes('acquiring'))?.percentage}% stake acquired
                </div>
              </div>
            </div>
          </div>
        )
      },
      style: {
        backgroundColor: '#f8fafc',
        border: '3px solid #2563eb',
        borderRadius: '12px',
        width: '320px',
        height: '200px'
      },
      draggable: false,
      selectable: false
    });

    // AFTER SECTION - MIRROR THE BEFORE LAYOUT
    
    // After Section Header
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
        width: '350px',
        height: '40px'
      },
      draggable: false,
      selectable: false
    });

    // Acquiring Company Section Header (After)
    nodes.push({
      id: 'after-acquiring-section-header',
      type: 'default',
      position: { x: AFTER_X, y: START_Y + 60 },
      data: { 
        label: (
          <div className="text-sm font-semibold text-blue-700">
            ACQUIRING COMPANY STRUCTURE (MAINTAINED)
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '350px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    // After Acquiring Company Shareholders (Y-level 1 - same as before)
    const afterControllingEntity = afterEntities.find(e => e.id === 'after-controlling-shareholder');
    if (afterControllingEntity) {
      const colors = getNodeColors('stockholder', afterControllingEntity.percentage);
      nodes.push({
        id: 'after-controlling-shareholder',
        type: 'default',
        position: { x: AFTER_X, y: beforeShareholdersY },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{afterControllingEntity.name}</div>
              <div className="text-xs text-gray-600">{afterControllingEntity.percentage}%</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '150px',
          height: '60px'
        }
      });
    }

    const afterPublicEntity = afterEntities.find(e => e.id === 'after-public-shareholders');
    if (afterPublicEntity) {
      const colors = getNodeColors('stockholder', afterPublicEntity.percentage);
      nodes.push({
        id: 'after-public-shareholders',
        type: 'default',
        position: { x: AFTER_X + 200, y: beforeShareholdersY },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{afterPublicEntity.name}</div>
              <div className="text-xs text-gray-600">{afterPublicEntity.percentage}%</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '150px',
          height: '60px'
        }
      });
    }

    // After Acquiring Company (Y-level 2 - same as before)
    const afterAcquiringEntity = afterEntities.find(e => e.id === 'after-acquiring-company');
    if (afterAcquiringEntity) {
      const colors = getNodeColors('buyer');
      nodes.push({
        id: 'after-acquiring-company',
        type: 'default',
        position: { x: AFTER_X + 100, y: beforeAcquiringCompanyY },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-sm">{afterAcquiringEntity.name}</div>
              <div className="text-xs text-gray-600">Listed Entity</div>
              {afterAcquiringEntity.description && (
                <div className="text-xs text-gray-500">{afterAcquiringEntity.description}</div>
              )}
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '180px',
          height: '80px'
        }
      });
    }

    // Target Company Section Header (After)
    nodes.push({
      id: 'after-target-section-header',
      type: 'default',
      position: { x: AFTER_X, y: START_Y + 60 + 50 + 80 + 120 },
      data: { 
        label: (
          <div className="text-sm font-semibold text-orange-700">
            TARGET COMPANY - NEW OWNERSHIP
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '350px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    // After Target Company New Shareholders (Y-level 3 - same as before)
    const afterAcquiringOwnerEntity = afterEntities.find(e => e.id === 'after-acquiring-owner');
    if (afterAcquiringOwnerEntity) {
      const colors = getNodeColors('buyer');
      nodes.push({
        id: 'after-acquiring-owner',
        type: 'default',
        position: { x: AFTER_X + 20, y: beforeTargetShareholdersY },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{afterAcquiringOwnerEntity.name}</div>
              <div className="text-xs text-gray-600">{afterAcquiringOwnerEntity.percentage}%</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '140px',
          height: '60px'
        }
      });
    }

    const remainingEntity = afterEntities.find(e => e.id === 'after-remaining-shareholders');
    if (remainingEntity) {
      const colors = getNodeColors('stockholder');
      nodes.push({
        id: 'after-remaining-shareholders',
        type: 'default',
        position: { x: AFTER_X + 180, y: beforeTargetShareholdersY },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{remainingEntity.name}</div>
              <div className="text-xs text-gray-600">{remainingEntity.percentage}%</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '140px',
          height: '60px'
        }
      });
    }

    // After Target Company (Y-level 4 - same as before)
    const afterTargetEntity = afterEntities.find(e => e.id === 'after-target-company');
    if (afterTargetEntity) {
      const colors = getNodeColors('target');
      nodes.push({
        id: 'after-target-company',
        type: 'default',
        position: { x: AFTER_X + 100, y: beforeTargetCompanyY },
        data: {
          label: (
            <div className="text-center p-3">
              <div className="font-semibold text-sm">{afterTargetEntity.name}</div>
              <div className="text-xs text-gray-600">Post-Transaction</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `3px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '160px',
          height: '70px'
        }
      });
    }

    // EDGES - Create relationships based on the data (NO PERCENTAGE LABELS ON EDGES)
    beforeRelationships.forEach((rel, index) => {
      if (nodes.find(n => n.id === rel.source) && nodes.find(n => n.id === rel.target)) {
        edges.push({
          id: `before-edge-${index}`,
          source: rel.source,
          target: rel.target,
          type: 'straight',
          style: {
            stroke: rel.type === 'ownership' ? '#2563eb' : '#f59e0b',
            strokeWidth: 2
          }
        });
      }
    });

    afterRelationships.forEach((rel, index) => {
      if (nodes.find(n => n.id === rel.source) && nodes.find(n => n.id === rel.target)) {
        edges.push({
          id: `after-edge-${index}`,
          source: rel.source,
          target: rel.target,
          type: 'straight',
          style: {
            stroke: rel.type === 'consideration' ? '#16a34a' : rel.type === 'ownership' ? '#2563eb' : '#f59e0b',
            strokeWidth: rel.type === 'consideration' ? 3 : 2
          },
          label: rel.type === 'consideration' && rel.value ? `${transactionContext?.currency} ${(rel.value / 1000000).toFixed(0)}M` : undefined,
          labelStyle: rel.type === 'consideration' ? {
            fontSize: '10px',
            fontWeight: 'bold',
            fill: '#16a34a'
          } : undefined
        });
      }
    });

    // Transaction flow arrows
    edges.push({
      id: 'transaction-flow-in',
      source: 'before-acquiring-company',
      target: 'transaction-details',
      type: 'straight',
      style: {
        stroke: '#16a34a',
        strokeWidth: 3,
        strokeDasharray: '8,4'
      },
      label: 'Initiates',
      labelStyle: {
        fontSize: '11px',
        fontWeight: 'bold',
        fill: '#16a34a'
      }
    });

    edges.push({
      id: 'transaction-flow-out',
      source: 'transaction-details',
      target: 'after-target-company',
      type: 'straight',
      style: {
        stroke: '#7c3aed',
        strokeWidth: 3,
        strokeDasharray: '8,4'
      },
      label: 'Results In',
      labelStyle: {
        fontSize: '11px',
        fontWeight: 'bold',
        fill: '#7c3aed'
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

export default CombinedTransactionFlowDiagram;
