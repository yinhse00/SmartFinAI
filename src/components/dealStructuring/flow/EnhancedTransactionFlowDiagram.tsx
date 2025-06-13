
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

    // Add section headers
    nodes.push({
      id: 'before-header',
      type: 'default',
      position: { x: layout.sections.before.x, y: layout.sections.before.y },
      data: { 
        label: (
          <div className="text-lg font-bold text-gray-800 text-center">
            BEFORE TRANSACTION
            <div className="text-sm font-normal text-gray-600 mt-1">
              Current Structure
            </div>
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '350px',
        height: '50px'
      },
      draggable: false,
      selectable: false
    });

    nodes.push({
      id: 'transaction-header',
      type: 'default',
      position: { x: layout.sections.transaction.x, y: layout.sections.transaction.y },
      data: { 
        label: (
          <div className="text-lg font-bold text-blue-800 text-center">
            TRANSACTION
            <div className="text-sm font-normal text-blue-600 mt-1">
              {transactionFlow.transactionType}
            </div>
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '350px',
        height: '50px'
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
          <div className="text-lg font-bold text-gray-800 text-center">
            AFTER TRANSACTION
            <div className="text-sm font-normal text-gray-600 mt-1">
              Resulting Structure
            </div>
          </div>
        )
      },
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        width: '350px',
        height: '50px'
      },
      draggable: false,
      selectable: false
    });

    // Add transaction summary
    nodes.push({
      id: 'transaction-summary',
      type: 'default',
      position: layout.entityPositions.get('transaction-summary') || { x: 500, y: 250 },
      data: {
        label: (
          <div className="text-center p-4">
            <div className="text-lg font-bold mb-3 text-blue-900">
              {transactionFlow.title}
            </div>
            <div className="space-y-2 text-sm text-left">
              <div className="bg-blue-50 p-2 rounded">
                <strong className="text-blue-800">Type:</strong>
                <div className="text-blue-700">{transactionFlow.transactionType}</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <strong className="text-green-800">Consideration:</strong>
                <div className="text-green-700">
                  {transactionFlow.keyMetrics.currency} {(transactionFlow.keyMetrics.totalConsideration / 1000000).toFixed(0)}M
                </div>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <strong className="text-orange-800">Stake:</strong>
                <div className="text-orange-700">
                  {transactionFlow.keyMetrics.acquisitionPercentage.toFixed(1)}%
                </div>
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <strong className="text-purple-800">Control:</strong>
                <div className="text-purple-700">
                  {transactionFlow.keyMetrics.controlChange ? 'Change in Control' : 'No Control Change'}
                </div>
              </div>
            </div>
          </div>
        )
      },
      style: {
        backgroundColor: '#f8fafc',
        border: '3px solid #2563eb',
        borderRadius: '12px',
        width: '300px',
        height: '220px'
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

    // Add before relationships
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

    // Add after relationships
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

    // Add transaction flow connections
    const beforeMainEntity = transactionFlow.before.entities.find(e => e.type === 'buyer');
    const afterMainEntity = transactionFlow.after.entities.find(e => e.type === 'buyer');
    
    if (beforeMainEntity && afterMainEntity) {
      edges.push({
        id: 'transaction-flow',
        source: beforeMainEntity.id,
        target: 'transaction-summary',
        type: 'enhanced',
        data: {
          relationship: {
            id: 'transaction-initiation',
            source: beforeMainEntity.id,
            target: 'transaction-summary',
            type: 'consideration',
            terms: 'Initiates Transaction',
            isPreTransaction: false,
            isPostTransaction: true
          }
        },
        style: { strokeDasharray: '8,4' },
        animated: true
      });

      edges.push({
        id: 'transaction-result',
        source: 'transaction-summary',
        target: afterMainEntity.id,
        type: 'enhanced',
        data: {
          relationship: {
            id: 'transaction-completion',
            source: 'transaction-summary',
            target: afterMainEntity.id,
            type: 'consideration',
            terms: 'Results In',
            isPreTransaction: false,
            isPostTransaction: true
          }
        },
        style: { strokeDasharray: '8,4' },
        animated: true
      });
    }

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
        className="bg-gray-50"
        defaultViewport={{ x: 0, y: 0, zoom: optimalZoom }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background color="#e5e7eb" gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Validation Status Overlay */}
      {!transactionFlow.validationResults.isValid && (
        <div className="absolute top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded-lg text-sm">
          <div className="font-semibold">Data Validation Warnings:</div>
          <ul className="list-disc ml-4 mt-1">
            {transactionFlow.validationResults.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white border border-gray-200 rounded-lg p-3 text-xs shadow-lg">
        <div className="font-semibold mb-2">Legend:</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span>Ownership (solid)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-yellow-500" style={{ borderBottom: '2px dashed' }}></div>
            <span>Consideration (dashed)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500" style={{ borderBottom: '2px dashed' }}></div>
            <span>Control (dashed)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-500" style={{ borderBottom: '2px dotted' }}></div>
            <span>Voting (dotted)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTransactionFlowDiagram;
