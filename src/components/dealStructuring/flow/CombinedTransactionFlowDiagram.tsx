
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
      position: { x: 50, y: 20 },
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
        minWidth: '200px'
      },
      draggable: false,
      selectable: false
    });

    // BEFORE entities - shareholders and company structure
    transactionFlow.before.entities.forEach((entity, index) => {
      nodes.push({
        id: entity.id,
        type: 'default',
        position: {
          x: 50 + (index % 2) * 180,
          y: 80 + Math.floor(index / 2) * 100
        },
        data: {
          label: (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {entity.type === 'target' && <Building2 className="h-5 w-5" />}
                {entity.type === 'buyer' && <Building2 className="h-5 w-5" />}
                {entity.type === 'stockholder' && <Users className="h-5 w-5" />}
                {entity.type === 'subsidiary' && <Building2 className="h-4 w-4" />}
              </div>
              <div className="font-semibold text-sm">{entity.name}</div>
              {entity.percentage && (
                <div className="text-xs text-gray-600">{entity.percentage.toFixed(1)}%</div>
              )}
              {entity.value && (
                <div className="text-xs text-gray-600">HK${entity.value}M</div>
              )}
            </div>
          )
        },
        style: {
          backgroundColor: getNodeColor(entity.type),
          border: `2px solid ${getNodeBorder(entity.type)}`,
          borderRadius: '8px',
          padding: '12px',
          minWidth: '140px',
          minHeight: '80px'
        }
      });
    });

    // TRANSACTION section - center arrows and details
    nodes.push({
      id: 'transaction-header',
      type: 'default',
      position: { x: 420, y: 20 },
      data: { 
        label: (
          <div className="text-lg font-bold text-blue-700">
            TRANSACTION
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        minWidth: '160px'
      },
      draggable: false,
      selectable: false
    });

    // Main transaction arrow
    nodes.push({
      id: 'main-transaction',
      type: 'default',
      position: { x: 420, y: 80 },
      data: {
        label: (
          <div className="flex flex-col items-center">
            <ArrowRight className="h-12 w-12 text-blue-600 mb-2" />
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

    // Cash consideration
    nodes.push({
      id: 'cash-consideration',
      type: 'default',
      position: { x: 420, y: 180 },
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

    // Due diligence step
    nodes.push({
      id: 'due-diligence',
      type: 'default',
      position: { x: 420, y: 280 },
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
      position: { x: 620, y: 20 },
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
        minWidth: '200px'
      },
      draggable: false,
      selectable: false
    });

    // AFTER entities - new shareholding and structure
    transactionFlow.after.entities.forEach((entity, index) => {
      nodes.push({
        id: entity.id,
        type: 'default',
        position: {
          x: 620 + (index % 2) * 180,
          y: 80 + Math.floor(index / 2) * 100
        },
        data: {
          label: (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {entity.type === 'target' && <Building2 className="h-5 w-5" />}
                {entity.type === 'buyer' && <Building2 className="h-5 w-5" />}
                {entity.type === 'stockholder' && <Users className="h-5 w-5" />}
                {entity.type === 'consideration' && <DollarSign className="h-5 w-5" />}
                {entity.type === 'subsidiary' && <Building2 className="h-4 w-4" />}
              </div>
              <div className="font-semibold text-sm">{entity.name}</div>
              {entity.percentage && (
                <div className="text-xs text-gray-600">{entity.percentage.toFixed(1)}%</div>
              )}
              {entity.value && (
                <div className="text-xs text-gray-600">HK${entity.value}M</div>
              )}
            </div>
          )
        },
        style: {
          backgroundColor: getNodeColor(entity.type),
          border: `2px solid ${getNodeBorder(entity.type)}`,
          borderRadius: '8px',
          padding: '12px',
          minWidth: '140px',
          minHeight: '80px'
        }
      });
    });

    // Create edges for relationships
    const createEdges = (relationships: any[], offsetX: number = 0) => {
      relationships.forEach((rel, index) => {
        const getEdgeColor = (type: string) => {
          switch (type) {
            case 'ownership': return '#2563eb'; // blue-600
            case 'consideration': return '#d97706'; // amber-600
            case 'control': return '#dc2626'; // red-600
            case 'subsidiary': return '#9333ea'; // purple-600
            default: return '#6b7280'; // gray-500
          }
        };

        edges.push({
          id: `edge-${offsetX}-${index}`,
          source: rel.source,
          target: rel.target,
          type: 'smoothstep',
          style: {
            stroke: getEdgeColor(rel.type),
            strokeWidth: rel.type === 'consideration' ? 3 : 2,
            strokeDasharray: rel.type === 'consideration' ? '5,5' : 'none'
          },
          label: rel.percentage ? `${rel.percentage}%` : rel.value ? `HK$${rel.value}M` : '',
          labelStyle: {
            fontSize: '12px',
            fontWeight: 'bold',
            fill: getEdgeColor(rel.type)
          }
        });
      });
    };

    // Add edges for before and after relationships
    createEdges(transactionFlow.before.relationships, 0);
    createEdges(transactionFlow.after.relationships, 1000);

    // Add transaction flow edges (from before to after through transaction)
    edges.push({
      id: 'transaction-flow-1',
      source: 'before-stockholder-1',
      target: 'main-transaction',
      type: 'smoothstep',
      style: {
        stroke: '#2563eb',
        strokeWidth: 3,
        strokeDasharray: '8,4'
      },
      label: 'Sells 70%',
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#2563eb'
      }
    });

    edges.push({
      id: 'transaction-flow-2',
      source: 'main-transaction',
      target: 'after-buyer-1',
      type: 'smoothstep',
      style: {
        stroke: '#2563eb',
        strokeWidth: 3,
        strokeDasharray: '8,4'
      },
      label: 'Acquires 70%',
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#2563eb'
      }
    });

    edges.push({
      id: 'cash-flow',
      source: 'cash-consideration',
      target: 'after-consideration-1',
      type: 'smoothstep',
      style: {
        stroke: '#16a34a',
        strokeWidth: 3,
        strokeDasharray: '5,5'
      },
      label: 'Payment',
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        fill: '#16a34a'
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
        zoomOnScroll={false}
        panOnDrag={false}
        className="bg-gray-50"
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

export default CombinedTransactionFlowDiagram;
