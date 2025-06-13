
import React, { useMemo } from 'react';
import { ReactFlow, Node, Edge, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { EnhancedTransactionFlow } from '@/types/enhancedTransactionFlow';
import { intelligentLayoutEngine } from '@/services/dealStructuring/intelligentLayoutEngine';
import EnhancedTransactionNode from './EnhancedTransactionNode';
import EnhancedTransactionEdge from './EnhancedTransactionEdge';

interface EnhancedTransactionFlowDiagramProps {
  transactionFlow: EnhancedTransactionFlow;
}

const nodeTypes = {
  enhanced: EnhancedTransactionNode,
};

const edgeTypes = {
  enhanced: EnhancedTransactionEdge,
};

const EnhancedTransactionFlowDiagram: React.FC<EnhancedTransactionFlowDiagramProps> = ({
  transactionFlow
}) => {
  const { nodes, edges, optimalZoom } = useMemo(() => {
    const layout = intelligentLayoutEngine.generateLayout(
      transactionFlow.before.entities,
      transactionFlow.before.relationships,
      transactionFlow.after.entities,
      transactionFlow.after.relationships
    );

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Add clean section headers
    nodes.push({
      id: 'before-header',
      type: 'default',
      position: { x: layout.sections.before.x, y: layout.sections.before.y },
      data: { 
        label: (
          <div className="text-lg font-semibold text-gray-700 text-center">
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

    nodes.push({
      id: 'after-header',
      type: 'default',
      position: { x: layout.sections.after.x, y: layout.sections.after.y },
      data: { 
        label: (
          <div className="text-lg font-semibold text-gray-700 text-center">
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

    // Add before entities
    transactionFlow.before.entities.forEach((entity) => {
      const position = layout.entityPositions.get(entity.id);
      if (position) {
        nodes.push({
          id: entity.id,
          type: 'enhanced',
          position,
          data: {
            entity,
            phase: 'before' as const,
            hierarchyLevel: layout.hierarchyLevels.get(entity.id) || 0
          },
          draggable: true,
          selectable: true
        });
      }
    });

    // Add after entities
    transactionFlow.after.entities.forEach((entity) => {
      const position = layout.entityPositions.get(entity.id);
      if (position) {
        nodes.push({
          id: entity.id,
          type: 'enhanced',
          position,
          data: {
            entity,
            phase: 'after' as const,
            hierarchyLevel: layout.hierarchyLevels.get(entity.id) || 0
          },
          draggable: true,
          selectable: true
        });
      }
    });

    // Add before relationships (solid ownership lines)
    transactionFlow.before.relationships.forEach((relationship) => {
      if (nodes.find(n => n.id === relationship.source) && nodes.find(n => n.id === relationship.target)) {
        edges.push({
          id: `before-${relationship.id}`,
          source: relationship.source,
          target: relationship.target,
          type: 'enhanced',
          data: { relationship },
          animated: false
        });
      }
    });

    // Add after relationships (ownership and transaction terms)
    transactionFlow.after.relationships.forEach((relationship) => {
      if (nodes.find(n => n.id === relationship.source) && nodes.find(n => n.id === relationship.target)) {
        edges.push({
          id: `after-${relationship.id}`,
          source: relationship.source,
          target: relationship.target,
          type: 'enhanced',
          data: { relationship },
          animated: relationship.type === 'consideration'
        });
      }
    });

    const optimalZoom = intelligentLayoutEngine.calculateOptimalZoom(layout.entityPositions);

    return { nodes, edges, optimalZoom };
  }, [transactionFlow]);

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        zoomOnScroll={true}
        panOnDrag={true}
        className="bg-white"
        defaultViewport={{ x: 0, y: 0, zoom: optimalZoom }}
        minZoom={0.4}
        maxZoom={1.5}
      >
        <Background color="#f1f5f9" gap={25} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Validation Status Overlay */}
      {!transactionFlow.validationResults.isValid && (
        <div className="absolute top-4 right-4 bg-yellow-50 border border-yellow-300 text-yellow-800 px-3 py-2 rounded-lg text-sm max-w-xs">
          <div className="font-medium">Data Validation Warnings:</div>
          <ul className="list-disc ml-4 mt-1 text-xs">
            {transactionFlow.validationResults.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Clean Legend */}
      <div className="absolute bottom-4 left-4 bg-white border border-gray-200 rounded-lg p-3 text-xs shadow-sm">
        <div className="font-medium mb-2 text-gray-700">Legend:</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-gray-800"></div>
            <span className="text-gray-600">Ownership (%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-red-600" style={{ borderBottom: '2px dotted' }}></div>
            <span className="text-gray-600">Transaction Terms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTransactionFlowDiagram;
