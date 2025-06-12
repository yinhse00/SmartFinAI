
import React, { useMemo } from 'react';
import { ReactFlow, Node, Edge, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Building2, ArrowRight, DollarSign, Users } from 'lucide-react';
import { TransactionFlow } from '@/types/transactionFlow';

interface CombinedTransactionFlowDiagramProps {
  transactionFlow?: TransactionFlow;
  showBefore: boolean;
}

const CombinedTransactionFlowDiagram: React.FC<CombinedTransactionFlowDiagramProps> = ({
  transactionFlow,
  showBefore
}) => {
  const { nodes, edges } = useMemo(() => {
    if (!transactionFlow) {
      return { nodes: [], edges: [] };
    }

    const currentFlow = showBefore ? transactionFlow.before : transactionFlow.after;
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Create nodes for entities
    currentFlow.entities.forEach((entity, index) => {
      const getNodeColor = (type: string) => {
        switch (type) {
          case 'target': return '#fef3c7'; // yellow-100
          case 'buyer': return '#dbeafe'; // blue-100
          case 'stockholder': return '#dcfce7'; // green-100
          case 'consideration': return '#fde68a'; // amber-200
          default: return '#f3f4f6'; // gray-100
        }
      };

      const getNodeBorder = (type: string) => {
        switch (type) {
          case 'target': return '#f59e0b'; // yellow-600
          case 'buyer': return '#2563eb'; // blue-600
          case 'stockholder': return '#16a34a'; // green-600
          case 'consideration': return '#d97706'; // amber-600
          default: return '#6b7280'; // gray-500
        }
      };

      nodes.push({
        id: entity.id,
        type: 'default',
        position: {
          x: showBefore ? 
            (index % 2 === 0 ? 50 : 250) : 
            (index % 2 === 0 ? 450 : 650),
          y: 100 + (Math.floor(index / 2) * 120)
        },
        data: {
          label: (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {entity.type === 'target' && <Building2 className="h-5 w-5" />}
                {entity.type === 'buyer' && <Building2 className="h-5 w-5" />}
                {entity.type === 'stockholder' && <Users className="h-5 w-5" />}
                {entity.type === 'consideration' && <DollarSign className="h-5 w-5" />}
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
          minWidth: '120px',
          minHeight: '80px'
        }
      });
    });

    // Create edges for relationships
    currentFlow.relationships.forEach((rel, index) => {
      const getEdgeColor = (type: string) => {
        switch (type) {
          case 'ownership': return '#2563eb'; // blue-600
          case 'consideration': return '#d97706'; // amber-600
          case 'control': return '#dc2626'; // red-600
          default: return '#6b7280'; // gray-500
        }
      };

      edges.push({
        id: `edge-${index}`,
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

    // Add divider and labels if showing comparison
    if (!showBefore) {
      // Add BEFORE label
      nodes.push({
        id: 'before-label',
        type: 'default',
        position: { x: 50, y: 20 },
        data: { label: 'BEFORE' },
        style: {
          backgroundColor: 'transparent',
          border: 'none',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#374151'
        },
        draggable: false,
        selectable: false
      });

      // Add AFTER label
      nodes.push({
        id: 'after-label',
        type: 'default',
        position: { x: 450, y: 20 },
        data: { label: 'AFTER' },
        style: {
          backgroundColor: 'transparent',
          border: 'none',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#374151'
        },
        draggable: false,
        selectable: false
      });

      // Add transaction arrow
      nodes.push({
        id: 'transaction-arrow',
        type: 'default',
        position: { x: 320, y: 200 },
        data: {
          label: (
            <div className="flex flex-col items-center">
              <ArrowRight className="h-8 w-8 text-blue-600 mb-2" />
              <div className="text-xs font-medium">TRANSACTION</div>
            </div>
          )
        },
        style: {
          backgroundColor: 'transparent',
          border: 'none'
        },
        draggable: false,
        selectable: false
      });
    }

    return { nodes, edges };
  }, [transactionFlow, showBefore]);

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
