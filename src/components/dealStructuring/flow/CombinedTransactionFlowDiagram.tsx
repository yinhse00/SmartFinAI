import React, { useMemo } from 'react';
import { ReactFlow, Node, Edge, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TransactionFlow, OwnershipRelationship, ConsiderationRelationship } from '@/types/transactionFlow';

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

    const nodesArr: Node[] = [];
    const edgesArr: Edge[] = [];

    const SECTION_WIDTH = 400;
    const SECTION_SPACING = 80;
    const VERTICAL_SPACING = 80;
    const START_Y = 50;

    const BEFORE_X = 50;
    const TRANSACTION_X = BEFORE_X + SECTION_WIDTH + SECTION_SPACING;
    const AFTER_X = TRANSACTION_X + SECTION_WIDTH + SECTION_SPACING;

    const SECTION_HEADER_Y = START_Y;
    const ACQUIRING_HEADER_Y = START_Y + 60;
    const CONTROLLING_SHAREHOLDER_Y = START_Y + 110;
    const ACQUIRING_COMPANY_Y = START_Y + 190;
    const TARGET_HEADER_Y = START_Y + 310;
    const TARGET_SHAREHOLDERS_Y = START_Y + 360;
    const TARGET_COMPANY_Y = START_Y + 440;

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

    // Helper function to format consideration amount correctly
    const formatConsiderationAmount = (amount: number, currency: string): string => {
      console.log('Formatting amount:', amount, 'Currency:', currency);
      
      if (amount >= 1000000000) {
        const billions = (amount / 1000000000).toFixed(1);
        return `${currency} ${billions}B`;
      } else if (amount >= 1000000) {
        const millions = Math.round(amount / 1000000);
        return `${currency} ${millions}M`;
      } else if (amount >= 1000) {
        const thousands = Math.round(amount / 1000);
        return `${currency} ${thousands}K`;
      } else {
        return `${currency} ${amount}`;
      }
    };

    const beforeEntities = transactionFlow.before.entities;
    const afterEntities = transactionFlow.after.entities;
    const beforeRelationships = transactionFlow.before.relationships;
    const afterRelationships = transactionFlow.after.relationships;
    const transactionContext = transactionFlow.transactionContext;

    // BEFORE SECTION NODES
    nodesArr.push({
      id: 'before-header',
      type: 'default',
      position: { x: BEFORE_X, y: SECTION_HEADER_Y },
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

    nodesArr.push({
      id: 'acquiring-section-header',
      type: 'default',
      position: { x: BEFORE_X, y: ACQUIRING_HEADER_Y },
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

    const controllingEntity = beforeEntities.find(e => e.id === 'before-controlling-shareholder');
    if (controllingEntity) {
      const colors = getNodeColors('stockholder');
      nodesArr.push({
        id: 'before-controlling-shareholder',
        type: 'default',
        position: { x: BEFORE_X, y: CONTROLLING_SHAREHOLDER_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{controllingEntity.name}</div>
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

    const publicEntity = beforeEntities.find(e => e.id === 'before-public-shareholders');
    if (publicEntity) {
      const colors = getNodeColors('stockholder');
      nodesArr.push({
        id: 'before-public-shareholders',
        type: 'default',
        position: { x: BEFORE_X + 200, y: CONTROLLING_SHAREHOLDER_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{publicEntity.name}</div>
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

    const acquiringEntity = beforeEntities.find(e => e.id === 'before-acquiring-company');
    if (acquiringEntity) {
      const colors = getNodeColors('buyer');
      nodesArr.push({
        id: 'before-acquiring-company',
        type: 'default',
        position: { x: BEFORE_X + 100, y: ACQUIRING_COMPANY_Y },
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

    nodesArr.push({
      id: 'target-section-header',
      type: 'default',
      position: { x: BEFORE_X, y: TARGET_HEADER_Y },
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

    const targetShareholdersEntity = beforeEntities.find(e => e.id === 'before-target-shareholders');
    if (targetShareholdersEntity) {
      const colors = getNodeColors('stockholder');
      nodesArr.push({
        id: 'before-target-shareholders',
        type: 'default',
        position: { x: BEFORE_X + 100, y: TARGET_SHAREHOLDERS_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{targetShareholdersEntity.name}</div>
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

    const targetEntity = beforeEntities.find(e => e.id === 'before-target-company');
    if (targetEntity) {
      const colors = getNodeColors('target');
      nodesArr.push({
        id: 'before-target-company',
        type: 'default',
        position: { x: BEFORE_X + 100, y: TARGET_COMPANY_Y },
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

    // TRANSACTION SECTION NODES
    const transactionY = START_Y + 200;
    nodesArr.push({
      id: 'transaction-header',
      type: 'default',
      position: { x: TRANSACTION_X, y: SECTION_HEADER_Y },
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

    // Fixed transaction details with proper separation
    const ownershipPercentage = afterRelationships.find(r => 
      r.source.includes('acquiring') && 
      (r.type === 'ownership' || r.type === 'control') && 
      (r as OwnershipRelationship).percentage !== undefined
    )?.percentage;

    nodesArr.push({
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
                <strong className="text-blue-800">Type:</strong>
                <div className="text-blue-700">
                  {ownershipPercentage ? `${ownershipPercentage}% ${(transactionContext?.type || 'Acquisition').toLowerCase()}` : transactionContext?.type || 'Acquisition'}
                </div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <strong className="text-green-800">Consideration:</strong>
                <div className="text-green-700">
                  {formatConsiderationAmount(transactionContext?.amount || 0, transactionContext?.currency || 'HKD')}
                </div>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <strong className="text-orange-800">Structure:</strong>
                <div className="text-orange-700">
                  {transactionContext?.recommendedStructure || 'Standard Structure'}
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

    // AFTER SECTION NODES
    nodesArr.push({
      id: 'after-header',
      type: 'default',
      position: { x: AFTER_X, y: SECTION_HEADER_Y },
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

    nodesArr.push({
      id: 'after-acquiring-header',
      type: 'default',
      position: { x: AFTER_X, y: ACQUIRING_HEADER_Y },
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

    const afterControllingEntity = afterEntities.find(e => e.id === 'after-controlling-shareholder');
    if (afterControllingEntity) {
      const colors = getNodeColors('stockholder');
      nodesArr.push({
        id: 'after-controlling-shareholder',
        type: 'default',
        position: { x: AFTER_X, y: CONTROLLING_SHAREHOLDER_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{afterControllingEntity.name}</div>
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

    const afterPublicEntity = afterEntities.find(e => e.id === 'after-public-shareholders');
    if (afterPublicEntity) {
      const colors = getNodeColors('stockholder');
      nodesArr.push({
        id: 'after-public-shareholders',
        type: 'default',
        position: { x: AFTER_X + 180, y: CONTROLLING_SHAREHOLDER_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{afterPublicEntity.name}</div>
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

    const afterAcquiringEntity = afterEntities.find(e => e.id === 'after-acquiring-company');
    if (afterAcquiringEntity) {
      const colors = getNodeColors('buyer');
      nodesArr.push({
        id: 'after-acquiring-company',
        type: 'default',
        position: { x: AFTER_X + 90, y: ACQUIRING_COMPANY_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-sm">{afterAcquiringEntity.name}</div>
              <div className="text-xs text-gray-600">Listed Entity</div>
            </div>
          )
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `2px solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: '160px',
          height: '80px'
        }
      });
    }

    nodesArr.push({
      id: 'after-target-header',
      type: 'default',
      position: { x: AFTER_X, y: TARGET_HEADER_Y },
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

    const remainingEntity = afterEntities.find(e => e.id === 'after-remaining-shareholders');
    if (remainingEntity) {
      const colors = getNodeColors('stockholder');
      nodesArr.push({
        id: 'after-remaining-shareholders',
        type: 'default',
        position: { x: AFTER_X + 180, y: TARGET_SHAREHOLDERS_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{remainingEntity.name}</div>
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

    if (afterAcquiringEntity) {
      const colors = getNodeColors('buyer');
      nodesArr.push({
        id: 'after-acquiring-as-shareholder',
        type: 'default',
        position: { x: AFTER_X, y: TARGET_SHAREHOLDERS_Y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{afterAcquiringEntity.name}</div>
              <div className="text-xs text-gray-500">New Owner</div>
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

    const afterTargetEntity = afterEntities.find(e => e.id === 'after-target-company');
    if (afterTargetEntity) {
      const colors = getNodeColors('target');
      nodesArr.push({
        id: 'after-target-company',
        type: 'default',
        position: { x: AFTER_X + 90, y: TARGET_COMPANY_Y },
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
          height: '80px'
        }
      });
    }

    // EDGES
    beforeRelationships.forEach((rel, index) => {
      if (nodesArr.find(n => n.id === rel.source) && nodesArr.find(n => n.id === rel.target)) {
        let labelText = '';
        if ((rel.type === 'ownership' || rel.type === 'control') && (rel as OwnershipRelationship).percentage !== undefined) {
          labelText = `${(rel as OwnershipRelationship).percentage}%`;
        }

        edgesArr.push({
          id: `before-edge-${index}`,
          source: rel.source,
          target: rel.target,
          type: 'straight',
          style: {
            stroke: rel.type === 'ownership' ? '#2563eb' : '#f59e0b',
            strokeWidth: 2
          },
          label: labelText,
          labelStyle: {
            fontSize: '11px',
            fontWeight: 'bold',
            fill: rel.type === 'ownership' ? '#2563eb' : '#f59e0b',
            backgroundColor: 'white',
            padding: '2px 4px',
            borderRadius: '3px'
          }
        });
      }
    });

    afterRelationships.forEach((rel, index) => {
      if (rel.source === 'after-acquiring-company' && rel.target === 'after-target-company' && (rel.type === 'ownership' || rel.type === 'control')) {
        const percentage = (rel as OwnershipRelationship).percentage;
        edgesArr.push({
          id: `after-target-ownership-${index}`,
          source: 'after-acquiring-as-shareholder',
          target: 'after-target-company',
          type: 'straight',
          style: {
            stroke: '#2563eb',
            strokeWidth: 2
          },
          label: percentage !== undefined ? `${percentage}%` : '',
          labelStyle: {
            fontSize: '11px',
            fontWeight: 'bold',
            fill: '#2563eb',
            backgroundColor: 'white',
            padding: '2px 4px',
            borderRadius: '3px'
          }
        });
        return;
      }
      
      if (nodesArr.find(n => n.id === rel.source) && nodesArr.find(n => n.id === rel.target)) {
        let labelText = '';
        if ((rel.type === 'ownership' || rel.type === 'control') && (rel as OwnershipRelationship).percentage !== undefined) {
          labelText = `${(rel as OwnershipRelationship).percentage}%`;
        } else if ((rel.type === 'consideration' || rel.type === 'funding') && (rel as ConsiderationRelationship).value !== undefined) {
          labelText = formatConsiderationAmount((rel as ConsiderationRelationship).value || 0, transactionContext?.currency || 'HKD');
        }

        edgesArr.push({
          id: `after-edge-${index}`,
          source: rel.source,
          target: rel.target,
          type: 'straight',
          style: {
            stroke: rel.type === 'consideration' ? '#16a34a' : (rel.type === 'ownership' || rel.type === 'control') ? '#2563eb' : '#f59e0b',
            strokeWidth: rel.type === 'consideration' ? 3 : 2
          },
          label: labelText,
          labelStyle: {
            fontSize: '11px',
            fontWeight: 'bold',
            fill: rel.type === 'consideration' ? '#16a34a' : (rel.type === 'ownership' || rel.type === 'control') ? '#2563eb' : '#f59e0b',
            backgroundColor: 'white',
            padding: '2px 4px',
            borderRadius: '3px'
          }
        });
      }
    });

    // Transaction flow arrows
    edgesArr.push({
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
        fill: '#16a34a',
        backgroundColor: 'white',
        padding: '2px 4px',
        borderRadius: '3px'
      }
    });

    edgesArr.push({
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
        fill: '#7c3aed',
        backgroundColor: 'white',
        padding: '2px 4px',
        borderRadius: '3px'
      }
    });

    return { nodes: nodesArr, edges: edgesArr };
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
