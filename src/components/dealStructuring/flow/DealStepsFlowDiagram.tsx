
import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TransactionFlowNode from './TransactionFlowNode';
import TransactionFlowEdge from './TransactionFlowEdge';
import { TransactionFlow, OwnershipRelationship, AnyTransactionRelationship } from '@/types/transactionFlow'; // Added AnyTransactionRelationship

const nodeTypes = {
  transactionNode: TransactionFlowNode,
};

const edgeTypes = {
  transactionEdge: TransactionFlowEdge,
};

interface DealStepsFlowDiagramProps {
  transactionFlow?: TransactionFlow;
  showBefore?: boolean;
}

const DealStepsFlowDiagram: React.FC<DealStepsFlowDiagramProps> = ({
  transactionFlow,
  showBefore = true,
}) => {
  const { nodes, edges } = useMemo(() => {
    if (!transactionFlow) {
      return { nodes: [], edges: [] };
    }

    const currentState = showBefore ? transactionFlow.before : transactionFlow.after;
    
    // Create nodes from entities
    const flowNodes: Node[] = currentState.entities.map((entity, index) => ({
      id: entity.id,
      type: 'transactionNode',
      position: { 
        x: (index % 3) * 200 + 100, 
        y: Math.floor(index / 3) * 150 + 100 
      },
      data: {
        label: entity.name,
        entityType: entity.type,
        value: entity.value,
        percentage: entity.percentage,
        description: entity.description,
      },
    }));

    // Create edges from relationships
    const flowEdges: Edge[] = currentState.relationships.map((rel: AnyTransactionRelationship, index: number) => {
      let percentageData: number | undefined = undefined;
      if (rel.type === 'ownership' || rel.type === 'control') {
        percentageData = (rel as OwnershipRelationship).percentage;
      }

      return {
        id: `edge-${index}`,
        source: rel.source,
        target: rel.target,
        type: 'transactionEdge',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        data: {
          type: rel.type,
          percentage: percentageData,
          value: 'value' in rel ? rel.value : undefined,
        },
      };
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [transactionFlow, showBefore]);

  if (!transactionFlow) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="font-medium">Transaction Flow Diagram</p>
          <p className="text-sm">Flow diagram will be generated based on transaction analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="top-right"
        style={{ backgroundColor: '#f8fafc' }}
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.data?.entityType) {
              case 'target': return '#ef4444';
              case 'buyer': return '#3b82f6';
              case 'stockholder': return '#10b981';
              case 'consideration': return '#eab308';
              default: return '#6b7280';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default DealStepsFlowDiagram;

