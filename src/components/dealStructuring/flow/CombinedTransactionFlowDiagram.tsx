
import React, { useMemo } from 'react';
import { ReactFlow, Node, Edge, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TransactionFlow } from '@/types/transactionFlow';
import { NodeFactory } from './factories/NodeFactory';
import { EdgeFactory } from './factories/EdgeFactory';
import { BeforeSectionBuilder } from './builders/BeforeSectionBuilder';
import { TransactionSectionBuilder } from './builders/TransactionSectionBuilder';
import { AfterSectionBuilder } from './builders/AfterSectionBuilder';
import { EdgeBuilder } from './builders/EdgeBuilder';

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

    console.log('Building diagram with transaction data:', transactionFlow);

    // Initialize factories with transaction data
    const nodeFactory = new NodeFactory();
    const edgeFactory = new EdgeFactory(transactionFlow);

    // Initialize builders with transaction data
    const beforeBuilder = new BeforeSectionBuilder(nodeFactory);
    const transactionBuilder = new TransactionSectionBuilder(nodeFactory);
    const afterBuilder = new AfterSectionBuilder(nodeFactory);
    const edgeBuilder = new EdgeBuilder(edgeFactory, transactionFlow);

    // Build all nodes
    const allNodes: Node[] = [
      ...beforeBuilder.buildBeforeSection(),
      ...transactionBuilder.buildTransactionSection(),
      ...afterBuilder.buildAfterSection()
    ];

    // Build all edges with dynamic data
    const allEdges: Edge[] = edgeBuilder.buildAllEdges();

    console.log('Generated nodes:', allNodes.length);
    console.log('Generated edges:', allEdges.length);

    return { nodes: allNodes, edges: allEdges };
  }, [transactionFlow]);

  if (!transactionFlow) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-500">
        <p>No transaction data available</p>
      </div>
    );
  }

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
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
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
