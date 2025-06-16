
import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TransactionFlow, TransactionFlowScenario } from '@/types/transactionFlow';
import { processTransactionFlowForDiagram } from './diagramDataProcessor.tsx';

interface EnhancedTransactionFlowDiagramProps {
  transactionFlow?: TransactionFlow;
}

const EnhancedTransactionFlowDiagram: React.FC<EnhancedTransactionFlowDiagramProps> = ({
  transactionFlow
}) => {
  const diagramData = useMemo(() => {
    if (!transactionFlow) {
      console.log("Transaction flow data is undefined in diagram.");
      return { hasMultipleScenarios: false, diagrams: [] };
    }
    
    console.log("Processing transactionFlow in diagram:", JSON.stringify(transactionFlow, null, 2));
    
    // Check if after section has multiple scenarios
    const hasMultipleScenarios = Array.isArray(transactionFlow.after);
    
    if (hasMultipleScenarios) {
      // Process each scenario separately
      const scenarios = transactionFlow.after as TransactionFlowScenario[];
      const diagrams = scenarios.map(scenario => {
        const modifiedFlow = {
          ...transactionFlow,
          after: scenario.scenario
        };
        const processed = processTransactionFlowForDiagram(modifiedFlow);
        return {
          ...processed,
          scenarioName: scenario.scenarioName,
          scenarioDescription: scenario.scenarioDescription
        };
      });
      
      return { hasMultipleScenarios: true, diagrams };
    } else {
      // Single scenario - process normally
      const processed = processTransactionFlowForDiagram(transactionFlow);
      return { 
        hasMultipleScenarios: false, 
        diagrams: [{ ...processed, scenarioName: 'After Transaction' }] 
      };
    }
  }, [transactionFlow]);

  if (!transactionFlow) {
    return <div className="flex items-center justify-center h-full text-gray-500">Loading transaction flow data...</div>;
  }
  
  if (diagramData.diagrams.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">No diagram elements to display. Verify transaction data or processing logic.</div>;
  }

  // For multiple scenarios, display them vertically with labels
  if (diagramData.hasMultipleScenarios) {
    return (
      <div className="h-full w-full space-y-4">
        {diagramData.diagrams.map((diagram, index) => (
          <div key={index} className="h-1/2 border rounded-md">
            <div className="bg-gray-50 px-3 py-1 border-b text-sm font-medium text-gray-700">
              {diagram.scenarioName}
              {diagram.scenarioDescription && (
                <span className="ml-2 text-xs text-gray-500">- {diagram.scenarioDescription}</span>
              )}
            </div>
            <div className="h-[calc(100%-2rem)]">
              <ReactFlow
                nodes={diagram.nodes}
                edges={diagram.edges}
                fitView
                nodesDraggable={true} 
                nodesConnectable={false}
                elementsSelectable={true}
                zoomOnScroll={true}
                panOnDrag={true}
                className="bg-white"
                defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
                minZoom={0.2}
                maxZoom={2}
                attributionPosition="bottom-left"
              >
                <Background color="#e2e8f0" gap={24} size={1.5} />
                <Controls showInteractive={true} />
              </ReactFlow>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Single scenario display
  const diagram = diagramData.diagrams[0];
  return (
    <div className="h-full w-full relative border rounded-md">
      <ReactFlow
        nodes={diagram.nodes}
        edges={diagram.edges}
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
