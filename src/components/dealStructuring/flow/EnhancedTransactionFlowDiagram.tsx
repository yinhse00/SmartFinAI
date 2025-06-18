
import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TransactionFlow } from '@/types/transactionFlow';
import { processTransactionFlowForDiagram } from './diagramDataProcessor';
import { ExtractedUserInputs } from '@/services/dealStructuring/enhancedAiAnalysisService';

interface EnhancedTransactionFlowDiagramProps {
  transactionFlow: TransactionFlow;
  userInputs?: ExtractedUserInputs;
}

const EnhancedTransactionFlowDiagram: React.FC<EnhancedTransactionFlowDiagramProps> = ({ 
  transactionFlow,
  userInputs 
}) => {
  console.log('=== ENHANCED TRANSACTION FLOW DIAGRAM ===');
  console.log('UserInputs received in diagram:', userInputs);
  
  const { nodes: processedNodes, edges: processedEdges } = useMemo(() => {
    console.log('Processing transaction flow for diagram with user input validation...');
    return processTransactionFlowForDiagram(transactionFlow, userInputs);
  }, [transactionFlow, userInputs]);

  const [nodes, setNodes, onNodesChange] = useNodesState(processedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(processedEdges);

  // Update nodes and edges when processed data changes
  React.useEffect(() => {
    setNodes(processedNodes);
    setEdges(processedEdges);
  }, [processedNodes, processedEdges, setNodes, setEdges]);

  const onInit = useCallback(() => {
    console.log('ReactFlow initialized');
  }, []);

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        fitView
        fitViewOptions={{
          padding: 0.1,
          includeHiddenNodes: false,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
      
      {userInputs?.amount && (
        <div className="absolute top-2 right-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
          Using User Input: {userInputs.currency || 'HKD'} {(userInputs.amount / 1000000).toFixed(0)}M
        </div>
      )}
    </div>
  );
};

export default EnhancedTransactionFlowDiagram;
