
import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TransactionFlow } from '@/types/transactionFlow';
import { createBeforeStructureNodes } from './sections/BeforeStructureNodes';
import { createTransactionSectionNodes } from './sections/TransactionSectionNodes';
import { createAfterStructureNodes } from './sections/AfterStructureNodes';
import { createEdges } from './sections/EdgeBuilder';

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

    const beforeEntities = transactionFlow.before.entities;
    const afterEntities = transactionFlow.after.entities;
    const beforeRelationships = transactionFlow.before.relationships;
    const afterRelationships = transactionFlow.after.relationships;
    const transactionContext = transactionFlow.transactionContext;

    // Build all nodes from different sections
    const beforeNodes = createBeforeStructureNodes(beforeEntities);
    const transactionNodes = createTransactionSectionNodes(transactionContext);
    const afterNodes = createAfterStructureNodes(afterEntities);
    
    const allNodes = [...beforeNodes, ...transactionNodes, ...afterNodes];

    // Build all edges
    const allEdges = createEdges(
      beforeRelationships,
      afterRelationships,
      allNodes,
      transactionContext
    );

    return { nodes: allNodes, edges: allEdges };
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
