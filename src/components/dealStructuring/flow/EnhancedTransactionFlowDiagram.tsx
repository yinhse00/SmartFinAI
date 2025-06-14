import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TransactionFlow } from '@/types/transactionFlow';
import { processTransactionFlowForDiagram } from './diagramDataProcessor.tsx';

interface EnhancedTransactionFlowDiagramProps {
  transactionFlow?: TransactionFlow;
}

const EnhancedTransactionFlowDiagram: React.FC<EnhancedTransactionFlowDiagramProps> = ({
  transactionFlow
}) => {
  const { nodes, edges } = useMemo(() => {
    if (!transactionFlow) {
      console.log("Transaction flow data is undefined in diagram.");
      return { nodes: [], edges: [] };
    }
    console.log("Processing transactionFlow in diagram (refactored component):", JSON.stringify(transactionFlow, null, 2));
    return processTransactionFlowForDiagram(transactionFlow);
  }, [transactionFlow]);

  if (!transactionFlow) {
    return <div className="flex items-center justify-center h-full text-gray-500">Loading transaction flow data...</div>;
  }
  
  if (nodes.length === 0 && edges.length === 0 && transactionFlow) {
    // This condition implies transactionFlow is present, but processing resulted in no nodes/edges.
    // It might indicate an issue with the data itself or the processing logic if data is expected.
    return <div className="flex items-center justify-center h-full text-gray-500">No diagram elements to display. Verify transaction data or processing logic.</div>;
  }

  return (
    <div className="h-full w-full relative border rounded-md">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={true} 
        nodesConnectable={false}
        elementsSelectable={true}
        zoomOnScroll={true}
        panOnDrag={true}
        className="bg-white"
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background color="#e2e8f0" gap={24} size={1.5} />
        <Controls showInteractive={true} />
      </ReactFlow>
    </div>
  );
};

export default EnhancedTransactionFlowDiagram;
