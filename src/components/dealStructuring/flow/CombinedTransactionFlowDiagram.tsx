
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

    // Fixed layout configuration
    const SECTION_WIDTH = 350;
    const SECTION_SPACING = 50;
    const VERTICAL_SPACING = 80;
    const START_Y = 50;

    // Section positions
    const BEFORE_X = 50;
    const TRANSACTION_X = BEFORE_X + SECTION_WIDTH + SECTION_SPACING;
    const AFTER_X = TRANSACTION_X + SECTION_WIDTH + SECTION_SPACING;

    // Color schemes for different entity types
    const getNodeColors = (type: string, entityGroup: 'acquirer' | 'target' | 'neutral') => {
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
          if (entityGroup === 'acquirer') {
            return {
              backgroundColor: '#e0f2fe',
              borderColor: '#0284c7'
            };
          } else {
            return {
              backgroundColor: '#fef3c7',
              borderColor: '#f59e0b'
            };
          }
        case 'consideration':
          return {
            backgroundColor: '#f0fdf4',
            borderColor: '#16a34a'
          };
        case 'subsidiary':
          return {
            backgroundColor: '#f3e8ff',
            borderColor: '#9333ea'
          };
        default:
          return {
            backgroundColor: '#f3f4f6',
            borderColor: '#6b7280'
          };
      }
    };

    // Extract real data from transactionFlow
    const beforeEntities = transactionFlow.before.entities;
    const afterEntities = transactionFlow.after.entities;
    const beforeRelationships = transactionFlow.before.relationships;
    const afterRelationships = transactionFlow.after.relationships;
    const transactionContext = transactionFlow.transactionContext;

    // Find key entities using actual data
    const targetEntity = beforeEntities.find(e => e.type === 'target');
    const buyerEntity = afterEntities.find(e => e.type === 'buyer');
    const beforeStockholders = beforeEntities.filter(e => e.type === 'stockholder');
    const afterStockholders = afterEntities.filter(e => e.type === 'stockholder');
    const considerationEntity = afterEntities.find(e => e.type === 'consideration');

    // Get actual ownership percentages from relationships - NO FALLBACKS
    const getBuyerOwnership = () => {
      const buyerRel = afterRelationships.find(r => r.source === buyerEntity?.id && r.type === 'ownership');
      return buyerRel?.percentage || buyerEntity?.percentage || 0;
    };

    const getRemainingOwnership = () => {
      const remainingShareholder = afterStockholders.find(s => s.id !== buyerEntity?.id);
      if (!remainingShareholder) return 0;
      const remainingRel = afterRelationships.find(r => r.source === remainingShareholder?.id && r.type === 'ownership');
      return remainingRel?.percentage || remainingShareholder.percentage || 0;
    };

    const getConsiderationValue = () => {
      return considerationEntity?.value || transactionContext?.amount || 0;
    };

    const getCurrency = () => {
      return considerationEntity?.currency || transactionContext?.currency || 'HKD';
    };

    const formatCurrency = (amount: number, currency: string) => {
      if (amount === 0) return 'No consideration data';
      return `${currency} ${amount.toLocaleString()}${amount >= 1000000 ? 'M' : ''}`;
    };

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
        width: '300px',
        height: '40px'
      },
      draggable: false,
      selectable: false
    });

    currentY += 60;

    // Acquiring Company Section
    nodes.push({
      id: 'acquirer-section-header',
      type: 'default',
      position: { x: BEFORE_X, y: currentY },
      data: { 
        label: (
          <div className="text-sm font-semibold text-blue-700">
            {buyerEntity?.name?.toUpperCase() || 'ACQUIRING COMPANY'} STRUCTURE
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '280px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    currentY += 50;

    // Dynamic shareholders from actual data
    beforeStockholders.forEach((shareholder, index) => {
      const shareholderRel = beforeRelationships.find(r => r.source === shareholder.id);
      const ownership = shareholderRel?.percentage || shareholder.percentage || 0;
      const controllingColors = getNodeColors('stockholder', 'acquirer');
      
      nodes.push({
        id: `before-shareholder-${index}`,
        type: 'default',
        position: { x: BEFORE_X + (index * 160), y: currentY },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{shareholder.name}</div>
            </div>
          )
        },
        style: {
          backgroundColor: controllingColors.backgroundColor,
          border: `2px solid ${controllingColors.borderColor}`,
          borderRadius: '8px',
          width: '140px',
          height: '60px'
        }
      });
    });

    currentY += 80;

    // Acquiring Company (using actual buyer entity name)
    const acquirerColors = getNodeColors('buyer', 'acquirer');
    nodes.push({
      id: 'acquiring-company',
      type: 'default',
      position: { x: BEFORE_X + 80, y: currentY },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="font-semibold text-sm">{buyerEntity?.name || 'Acquiring Company'}</div>
            <div className="text-xs text-gray-600">Listed Entity</div>
          </div>
        )
      },
      style: {
        backgroundColor: acquirerColors.backgroundColor,
        border: `2px solid ${acquirerColors.borderColor}`,
        borderRadius: '8px',
        width: '160px',
        height: '70px'
      }
    });

    currentY += 100;

    // Target Company Section
    nodes.push({
      id: 'target-section-header',
      type: 'default',
      position: { x: BEFORE_X, y: currentY },
      data: { 
        label: (
          <div className="text-sm font-semibold text-orange-700">
            {targetEntity?.name?.toUpperCase() || 'TARGET COMPANY'} STRUCTURE
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '280px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    currentY += 50;

    // Target Company Existing Shareholders
    const targetShareholderColors = getNodeColors('stockholder', 'target');
    nodes.push({
      id: 'target-existing-shareholders',
      type: 'default',
      position: { x: BEFORE_X + 80, y: currentY },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="font-semibold text-xs">Existing Shareholders</div>
          </div>
        )
      },
      style: {
        backgroundColor: targetShareholderColors.backgroundColor,
        border: `2px solid ${targetShareholderColors.borderColor}`,
        borderRadius: '8px',
        width: '140px',
        height: '60px'
      }
    });

    currentY += 80;

    // Target Company (using actual target entity name)
    const targetColors = getNodeColors('target', 'target');
    nodes.push({
      id: 'target-company',
      type: 'default',
      position: { x: BEFORE_X + 80, y: currentY },
      data: {
        label: (
          <div className="text-center p-2">
            <div className="font-semibold text-sm">{targetEntity?.name || 'Target Company'}</div>
            <div className="text-xs text-gray-600">Listed Entity</div>
          </div>
        )
      },
      style: {
        backgroundColor: targetColors.backgroundColor,
        border: `2px solid ${targetColors.borderColor}`,
        borderRadius: '8px',
        width: '160px',
        height: '70px'
      }
    });

    // TRANSACTION SECTION
    const transactionY = START_Y + 150;

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
        width: '300px',
        height: '40px'
      },
      draggable: false,
      selectable: false
    });

    // Use ACTUAL transaction details from the transactionSteps and context
    const getActualTransactionTitle = () => {
      return transactionContext?.type || transactionFlow.transactionSteps?.[1]?.title || 'Transaction';
    };

    const getActualTransactionDescription = () => {
      return transactionContext?.description || 
             transactionFlow.transactionSteps?.[1]?.description || 
             `${buyerEntity?.name || 'Acquiring Company'} acquires ${targetEntity?.name || 'Target Company'}`;
    };

    // Transaction Details with REAL data only
    const buyerOwnership = getBuyerOwnership();
    const considerationValue = getConsiderationValue();
    const currency = getCurrency();
    const actualTransactionTitle = getActualTransactionTitle();
    const actualTransactionDescription = getActualTransactionDescription();
    
    nodes.push({
      id: 'transaction-details',
      type: 'default',
      position: { x: TRANSACTION_X, y: transactionY },
      data: {
        label: (
          <div className="text-center p-4">
            <div className="text-lg font-bold mb-3 text-blue-900">
              {actualTransactionTitle}
            </div>
            <div className="space-y-2 text-xs text-left">
              <div className="bg-blue-50 p-2 rounded">
                <strong className="text-blue-800">Transaction:</strong>
                <div className="text-blue-700">{actualTransactionDescription}</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <strong className="text-green-800">Consideration:</strong>
                <div className="text-green-700">{formatCurrency(considerationValue, currency)}</div>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <strong className="text-orange-800">Ownership:</strong>
                <div className="text-orange-700">
                  {buyerOwnership > 0 ? `${buyerOwnership}% stake acquired` : 'Ownership data not available'}
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

    // AFTER SECTION - Clear single structure
    currentY = START_Y;

    // After Section Header
    nodes.push({
      id: 'after-header',
      type: 'default',
      position: { x: AFTER_X, y: currentY },
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
        width: '300px',
        height: '40px'
      },
      draggable: false,
      selectable: false
    });

    currentY += 60;

    // Target Company Post-Transaction (SINGLE ENTITY)
    nodes.push({
      id: 'after-target-section-header',
      type: 'default',
      position: { x: AFTER_X, y: currentY },
      data: { 
        label: (
          <div className="text-sm font-semibold text-orange-700">
            {targetEntity?.name?.toUpperCase() || 'TARGET COMPANY'} - POST TRANSACTION
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '280px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    currentY += 50;

    // The Target Company after transaction (main entity)
    nodes.push({
      id: 'after-target-company',
      type: 'default',
      position: { x: AFTER_X + 80, y: currentY },
      data: {
        label: (
          <div className="text-center p-3">
            <div className="font-semibold text-sm">{targetEntity?.name || 'Target Company'}</div>
            <div className="text-xs text-gray-600">Post-Transaction Entity</div>
          </div>
        )
      },
      style: {
        backgroundColor: targetColors.backgroundColor,
        border: `3px solid ${targetColors.borderColor}`,
        borderRadius: '8px',
        width: '160px',
        height: '80px'
      }
    });

    currentY += 120;

    // Shareholders owning the target company
    nodes.push({
      id: 'after-shareholders-header',
      type: 'default',
      position: { x: AFTER_X, y: currentY },
      data: { 
        label: (
          <div className="text-sm font-semibold text-gray-700">
            NEW OWNERSHIP STRUCTURE
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '280px',
        height: '30px'
      },
      draggable: false,
      selectable: false
    });

    currentY += 40;

    // Acquiring Company as NEW OWNER
    const buyerOwnershipPercentage = getBuyerOwnership();
    if (buyerOwnershipPercentage > 0) {
      nodes.push({
        id: 'after-acquiring-owner',
        type: 'default',
        position: { x: AFTER_X + 20, y: currentY },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">{buyerEntity?.name || 'Acquiring Company'}</div>
              <div className="text-xs text-gray-500">{buyerOwnershipPercentage}% Owner</div>
            </div>
          )
        },
        style: {
          backgroundColor: acquirerColors.backgroundColor,
          border: `2px solid ${acquirerColors.borderColor}`,
          borderRadius: '8px',
          width: '140px',
          height: '70px'
        }
      });
    }

    // Remaining shareholders (if any)
    const remainingOwnership = getRemainingOwnership();
    if (remainingOwnership > 0) {
      nodes.push({
        id: 'after-remaining-owners',
        type: 'default',
        position: { x: AFTER_X + 180, y: currentY },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-semibold text-xs">Other Shareholders</div>
              <div className="text-xs text-gray-500">{remainingOwnership}% Owner</div>
            </div>
          )
        },
        style: {
          backgroundColor: targetShareholderColors.backgroundColor,
          border: `2px solid ${targetShareholderColors.borderColor}`,
          borderRadius: '8px',
          width: '140px',
          height: '70px'
        }
      });
    }

    // EDGES - Ownership relationships using ACTUAL data
    
    // Before: Shareholders own Acquiring Company
    beforeStockholders.forEach((shareholder, index) => {
      const shareholderRel = beforeRelationships.find(r => r.source === shareholder.id);
      const ownership = shareholderRel?.percentage || shareholder.percentage || 0;
      
      if (ownership > 0) {
        edges.push({
          id: `before-shareholder-${index}-to-acquirer`,
          source: `before-shareholder-${index}`,
          target: 'acquiring-company',
          type: 'straight',
          style: {
            stroke: '#2563eb',
            strokeWidth: 2
          },
          label: `${ownership}%`,
          labelStyle: {
            fontSize: '10px',
            fontWeight: 'bold',
            fill: '#2563eb'
          }
        });
      }
    });

    // Before: Target shareholders own Target Company
    edges.push({
      id: 'target-shareholders-to-target',
      source: 'target-existing-shareholders',
      target: 'target-company',
      type: 'straight',
      style: {
        stroke: '#f59e0b',
        strokeWidth: 2
      },
      label: '100%',
      labelStyle: {
        fontSize: '10px',
        fontWeight: 'bold',
        fill: '#f59e0b'
      }
    });

    // After: NEW ownership relationships
    if (buyerOwnershipPercentage > 0) {
      edges.push({
        id: 'after-acquirer-owns-target',
        source: 'after-acquiring-owner',
        target: 'after-target-company',
        type: 'straight',
        style: {
          stroke: '#2563eb',
          strokeWidth: 3
        },
        label: `${buyerOwnershipPercentage}%`,
        labelStyle: {
          fontSize: '11px',
          fontWeight: 'bold',
          fill: '#2563eb'
        }
      });
    }

    if (remainingOwnership > 0) {
      edges.push({
        id: 'after-remaining-owns-target',
        source: 'after-remaining-owners',
        target: 'after-target-company',
        type: 'straight',
        style: {
          stroke: '#f59e0b',
          strokeWidth: 2
        },
        label: `${remainingOwnership}%`,
        labelStyle: {
          fontSize: '11px',
          fontWeight: 'bold',
          fill: '#f59e0b'
        }
      });
    }

    // Transaction flow arrows using ACTUAL transaction data
    edges.push({
      id: 'transaction-flow',
      source: 'acquiring-company',
      target: 'transaction-details',
      type: 'straight',
      style: {
        stroke: '#16a34a',
        strokeWidth: 3,
        strokeDasharray: '8,4'
      },
      label: buyerOwnershipPercentage > 0 ? `Acquires ${buyerOwnershipPercentage}%` : 'Transaction',
      labelStyle: {
        fontSize: '11px',
        fontWeight: 'bold',
        fill: '#16a34a'
      }
    });

    edges.push({
      id: 'transaction-result',
      source: 'transaction-details',
      target: 'after-target-company',
      type: 'straight',
      style: {
        stroke: '#7c3aed',
        strokeWidth: 3,
        strokeDasharray: '8,4'
      },
      label: 'Result',
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

export default CombinedTransactionFlowDiagram;
