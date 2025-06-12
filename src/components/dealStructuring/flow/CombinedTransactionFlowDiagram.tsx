
import React, { useMemo } from 'react';
import { ReactFlow, Node, Edge, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Building2, ArrowRight, DollarSign, Users, TrendingUp } from 'lucide-react';
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

    const getNodeColor = (type: string) => {
      switch (type) {
        case 'target': return '#fef3c7'; // yellow-100
        case 'buyer': return '#dbeafe'; // blue-100
        case 'stockholder': return '#dcfce7'; // green-100
        case 'consideration': return '#fde68a'; // amber-200
        case 'subsidiary': return '#f3e8ff'; // purple-100
        default: return '#f3f4f6'; // gray-100
      }
    };

    const getNodeBorder = (type: string) => {
      switch (type) {
        case 'target': return '#f59e0b'; // yellow-600
        case 'buyer': return '#2563eb'; // blue-600
        case 'stockholder': return '#16a34a'; // green-600
        case 'consideration': return '#d97706'; // amber-600
        case 'subsidiary': return '#9333ea'; // purple-600
        default: return '#6b7280'; // gray-500
      }
    };

    // BEFORE section header
    nodes.push({
      id: 'before-header',
      type: 'default',
      position: { x: 20, y: 20 },
      data: { 
        label: (
          <div className="text-lg font-bold text-gray-700">
            BEFORE TRANSACTION
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        minWidth: '300px'
      },
      draggable: false,
      selectable: false
    });

    // ACQUIRER SECTION (Top Left)
    nodes.push({
      id: 'acquirer-header',
      type: 'default',
      position: { x: 20, y: 80 },
      data: { 
        label: (
          <div className="text-md font-semibold text-blue-700">
            ACQUIRER COMPANY
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        minWidth: '200px'
      },
      draggable: false,
      selectable: false
    });

    // Acquirer shareholders
    nodes.push({
      id: 'acquirer-shareholders',
      type: 'default',
      position: { x: 20, y: 130 },
      data: {
        label: (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5" />
            </div>
            <div className="font-semibold text-sm">Acquirer Shareholders</div>
            <div className="text-xs text-gray-600">100%</div>
          </div>
        )
      },
      style: {
        backgroundColor: getNodeColor('stockholder'),
        border: `2px solid ${getNodeBorder('stockholder')}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '140px',
        minHeight: '80px'
      }
    });

    // Acquirer company
    nodes.push({
      id: 'acquirer-company',
      type: 'default',
      position: { x: 20, y: 250 },
      data: {
        label: (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="font-semibold text-sm">Acquiring Company</div>
            <div className="text-xs text-gray-600">Buyer</div>
          </div>
        )
      },
      style: {
        backgroundColor: getNodeColor('buyer'),
        border: `2px solid ${getNodeBorder('buyer')}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '140px',
        minHeight: '80px'
      }
    });

    // TARGET SECTION (Bottom Left)
    nodes.push({
      id: 'target-header',
      type: 'default',
      position: { x: 20, y: 380 },
      data: { 
        label: (
          <div className="text-md font-semibold text-yellow-700">
            TARGET COMPANY
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        minWidth: '200px'
      },
      draggable: false,
      selectable: false
    });

    // Target shareholders
    nodes.push({
      id: 'target-shareholders',
      type: 'default',
      position: { x: 20, y: 430 },
      data: {
        label: (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5" />
            </div>
            <div className="font-semibold text-sm">Target Shareholders</div>
            <div className="text-xs text-gray-600">100%</div>
          </div>
        )
      },
      style: {
        backgroundColor: getNodeColor('stockholder'),
        border: `2px solid ${getNodeBorder('stockholder')}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '140px',
        minHeight: '80px'
      }
    });

    // Target company
    nodes.push({
      id: 'target-company',
      type: 'default',
      position: { x: 20, y: 550 },
      data: {
        label: (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="font-semibold text-sm">Target Company</div>
            <div className="text-xs text-gray-600">Listed Company</div>
          </div>
        )
      },
      style: {
        backgroundColor: getNodeColor('target'),
        border: `2px solid ${getNodeBorder('target')}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '140px',
        minHeight: '80px'
      }
    });

    // Target subsidiaries (if any)
    const targetSubsidiaries = transactionFlow.before.entities.filter(e => e.type === 'subsidiary');
    targetSubsidiaries.forEach((subsidiary, index) => {
      nodes.push({
        id: `target-subsidiary-${index}`,
        type: 'default',
        position: { x: 200, y: 550 + (index * 100) },
        data: {
          label: (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="font-semibold text-xs">{subsidiary.name}</div>
              <div className="text-xs text-gray-600">Subsidiary</div>
            </div>
          )
        },
        style: {
          backgroundColor: getNodeColor('subsidiary'),
          border: `2px solid ${getNodeBorder('subsidiary')}`,
          borderRadius: '8px',
          padding: '10px',
          minWidth: '120px',
          minHeight: '70px'
        }
      });
    });

    // TRANSACTION SECTION (Center)
    nodes.push({
      id: 'transaction-header',
      type: 'default',
      position: { x: 420, y: 20 },
      data: { 
        label: (
          <div className="text-lg font-bold text-blue-700">
            SUGGESTED DEAL STRUCTURE
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        minWidth: '250px'
      },
      draggable: false,
      selectable: false
    });

    // Share Purchase Transaction
    nodes.push({
      id: 'share-purchase',
      type: 'default',
      position: { x: 450, y: 180 },
      data: {
        label: (
          <div className="flex flex-col items-center">
            <ArrowRight className="h-8 w-8 text-blue-600 mb-2" />
            <div className="text-sm font-medium">Share Purchase</div>
            <div className="text-xs text-gray-600">70% Acquisition</div>
          </div>
        )
      },
      style: {
        backgroundColor: '#eff6ff',
        border: '2px solid #2563eb',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '120px'
      },
      draggable: false,
      selectable: false
    });

    // Cash Consideration
    nodes.push({
      id: 'cash-consideration',
      type: 'default',
      position: { x: 450, y: 300 },
      data: {
        label: (
          <div className="flex flex-col items-center">
            <DollarSign className="h-8 w-8 text-green-600 mb-2" />
            <div className="text-sm font-medium">Cash Consideration</div>
            <div className="text-xs text-gray-600">HK$1,000M</div>
          </div>
        )
      },
      style: {
        backgroundColor: '#f0fdf4',
        border: '2px solid #16a34a',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '120px'
      },
      draggable: false,
      selectable: false
    });

    // Due Diligence
    nodes.push({
      id: 'due-diligence',
      type: 'default',
      position: { x: 450, y: 420 },
      data: {
        label: (
          <div className="flex flex-col items-center">
            <TrendingUp className="h-6 w-6 text-purple-600 mb-1" />
            <div className="text-xs font-medium">Due Diligence</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
        )
      },
      style: {
        backgroundColor: '#faf5ff',
        border: '2px solid #9333ea',
        borderRadius: '8px',
        padding: '8px',
        minWidth: '100px',
        minHeight: '60px'
      },
      draggable: false,
      selectable: false
    });

    // AFTER section header
    nodes.push({
      id: 'after-header',
      type: 'default',
      position: { x: 720, y: 20 },
      data: { 
        label: (
          <div className="text-lg font-bold text-gray-700">
            AFTER TRANSACTION
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        minWidth: '300px'
      },
      draggable: false,
      selectable: false
    });

    // New Acquirer (Majority Owner)
    nodes.push({
      id: 'new-acquirer',
      type: 'default',
      position: { x: 720, y: 130 },
      data: {
        label: (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="font-semibold text-sm">Acquiring Company</div>
            <div className="text-xs text-gray-600">70% Owner</div>
          </div>
        )
      },
      style: {
        backgroundColor: getNodeColor('buyer'),
        border: `2px solid ${getNodeBorder('buyer')}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '140px',
        minHeight: '80px'
      }
    });

    // Remaining Shareholders
    nodes.push({
      id: 'remaining-shareholders',
      type: 'default',
      position: { x: 900, y: 130 },
      data: {
        label: (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5" />
            </div>
            <div className="font-semibold text-sm">Remaining Shareholders</div>
            <div className="text-xs text-gray-600">30%</div>
          </div>
        )
      },
      style: {
        backgroundColor: getNodeColor('stockholder'),
        border: `2px solid ${getNodeBorder('stockholder')}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '140px',
        minHeight: '80px'
      }
    });

    // Target Company (Now Controlled)
    nodes.push({
      id: 'controlled-target',
      type: 'default',
      position: { x: 810, y: 280 },
      data: {
        label: (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="font-semibold text-sm">Target Company</div>
            <div className="text-xs text-gray-600">Now Controlled</div>
          </div>
        )
      },
      style: {
        backgroundColor: getNodeColor('target'),
        border: `2px solid ${getNodeBorder('target')}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '140px',
        minHeight: '80px'
      }
    });

    // Target Subsidiaries (After)
    targetSubsidiaries.forEach((subsidiary, index) => {
      nodes.push({
        id: `controlled-subsidiary-${index}`,
        type: 'default',
        position: { x: 720 + (index * 180), y: 430 },
        data: {
          label: (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="font-semibold text-xs">{subsidiary.name}</div>
              <div className="text-xs text-gray-600">Subsidiary</div>
            </div>
          )
        },
        style: {
          backgroundColor: getNodeColor('subsidiary'),
          border: `2px solid ${getNodeBorder('subsidiary')}`,
          borderRadius: '8px',
          padding: '10px',
          minWidth: '120px',
          minHeight: '70px'
        }
      });
    });

    // FIXED LINES - Shareholding and Corporate Structure (BEFORE)
    // Acquirer structure
    edges.push({
      id: 'acquirer-ownership',
      source: 'acquirer-shareholders',
      target: 'acquirer-company',
      type: 'straight',
      style: {
        stroke: '#2563eb',
        strokeWidth: 2
      },
      label: '100%',
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#2563eb'
      }
    });

    // Target structure (BEFORE)
    edges.push({
      id: 'target-ownership-before',
      source: 'target-shareholders',
      target: 'target-company',
      type: 'straight',
      style: {
        stroke: '#16a34a',
        strokeWidth: 2
      },
      label: '100%',
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#16a34a'
      }
    });

    // Target subsidiaries (BEFORE)
    targetSubsidiaries.forEach((subsidiary, index) => {
      edges.push({
        id: `target-sub-before-${index}`,
        source: 'target-company',
        target: `target-subsidiary-${index}`,
        type: 'straight',
        style: {
          stroke: '#9333ea',
          strokeWidth: 2
        },
        label: `${subsidiary.percentage || 100}%`,
        labelStyle: {
          fontSize: '10px',
          fontWeight: 'bold',
          fill: '#9333ea'
        }
      });
    });

    // FIXED LINES - New Corporate Structure (AFTER)
    edges.push({
      id: 'new-acquirer-ownership',
      source: 'new-acquirer',
      target: 'controlled-target',
      type: 'straight',
      style: {
        stroke: '#2563eb',
        strokeWidth: 3
      },
      label: '70%',
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#2563eb'
      }
    });

    edges.push({
      id: 'remaining-ownership',
      source: 'remaining-shareholders',
      target: 'controlled-target',
      type: 'straight',
      style: {
        stroke: '#16a34a',
        strokeWidth: 2
      },
      label: '30%',
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#16a34a'
      }
    });

    // Controlled subsidiaries (AFTER)
    targetSubsidiaries.forEach((subsidiary, index) => {
      edges.push({
        id: `controlled-sub-${index}`,
        source: 'controlled-target',
        target: `controlled-subsidiary-${index}`,
        type: 'straight',
        style: {
          stroke: '#9333ea',
          strokeWidth: 2
        },
        label: `${subsidiary.percentage || 100}%`,
        labelStyle: {
          fontSize: '10px',
          fontWeight: 'bold',
          fill: '#9333ea'
        }
      });
    });

    // DOTTED LINES - Deal Flow Illustration
    // Acquirer to transaction
    edges.push({
      id: 'acquirer-to-deal',
      source: 'acquirer-company',
      target: 'share-purchase',
      type: 'straight',
      style: {
        stroke: '#3b82f6',
        strokeWidth: 3,
        strokeDasharray: '8,4'
      },
      label: 'Acquires 70%',
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#3b82f6'
      }
    });

    // Target shareholders to cash
    edges.push({
      id: 'target-to-cash',
      source: 'target-shareholders',
      target: 'cash-consideration',
      type: 'straight',
      style: {
        stroke: '#16a34a',
        strokeWidth: 3,
        strokeDasharray: '8,4'
      },
      label: 'Receives Payment',
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#16a34a'
      }
    });

    // Transaction to new structure
    edges.push({
      id: 'deal-to-result',
      source: 'share-purchase',
      target: 'new-acquirer',
      type: 'straight',
      style: {
        stroke: '#3b82f6',
        strokeWidth: 3,
        strokeDasharray: '8,4'
      },
      label: 'Controls Target',
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#3b82f6'
      }
    });

    return { nodes, edges };
  }, [transactionFlow]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={true}
        panOnDrag={true}
        className="bg-gray-50"
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

export default CombinedTransactionFlowDiagram;
