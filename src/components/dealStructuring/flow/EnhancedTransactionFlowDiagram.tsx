import React, { useMemo, CSSProperties } from 'react';
import { ReactFlow, Node, Edge, Background, Controls, Position, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TransactionFlow, TransactionEntity } from '@/types/transactionFlow';

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
    console.log("Processing transactionFlow in diagram:", JSON.stringify(transactionFlow, null, 2));

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const ENTITY_WIDTH = 200;
    const ENTITY_HEIGHT = 90; // Base height, can be auto
    const LEVEL_Y_SPACING = 180;
    const SIBLING_X_SPACING = ENTITY_WIDTH + 50;
    const SECTION_X_SPACING = ENTITY_WIDTH + 150;

    const BASE_Y_SHAREHOLDER = 50;
    const BASE_Y_COMPANY = BASE_Y_SHAREHOLDER + LEVEL_Y_SPACING;
    const BASE_Y_CONSIDERATION = BASE_Y_COMPANY + LEVEL_Y_SPACING;
    const BASE_Y_SUBSIDIARY = BASE_Y_COMPANY + LEVEL_Y_SPACING;


    const getNodeColors = (type: TransactionEntity['type'], isAcquirer?: boolean) => {
      switch (type) {
        case 'target':
          return {
            backgroundColor: '#fef3c7', // Light yellow
            borderColor: '#f59e0b', // Amber
            textColor: '#92400e', // Dark amber
            borderWidth: '2px'
          };
        case 'buyer':
          return {
            backgroundColor: '#dbeafe', // Light blue
            borderColor: '#2563eb', // Blue
            textColor: '#1e40af', // Dark blue
            borderWidth: '2px'
          };
        case 'stockholder':
          return isAcquirer ? {
            backgroundColor: '#ecfdf5', // Light green for acquirer-like stockholders
            borderColor: '#10b981', // Green
            textColor: '#047857', // Dark green
            borderWidth: '2px'
          } : {
            backgroundColor: '#f3f4f6', // Light gray
            borderColor: '#6b7280', // Gray
            textColor: '#374151', // Dark gray
            borderWidth: '2px'
          };
        case 'parent': // Added style for parent
             return {
                backgroundColor: '#e5e7eb', // Slightly different gray
                borderColor: '#4b5563', // Darker gray
                textColor: '#1f2937', // Very dark gray
                borderWidth: '2px'
            };
        case 'subsidiary':
           return {
            backgroundColor: '#e0f2fe', 
            borderColor: '#0ea5e9',   
            textColor: '#0c4a6e',   
            borderWidth: '1.5px'
          };
        case 'newco':
          return {
            backgroundColor: '#ede9fe', 
            borderColor: '#7c3aed', 
            textColor: '#5b21b6', 
            borderWidth: '2px'
          };
        case 'consideration':
          return {
            backgroundColor: '#f0fdf4', 
            borderColor: '#16a34a', 
            textColor: '#15803d', 
            borderWidth: '2px'
          };
        default: 
          return {
            backgroundColor: '#f3f4f6',
            borderColor: '#6b7280',
            textColor: '#374151',
            borderWidth: '2px'
          };
      }
    };

    const createEntityNode = (entity: TransactionEntity, x: number, y: number, additionalDescription?: string): Node => {
      const colors = getNodeColors(entity.type, entity.type === 'buyer' || entity.name.toLowerCase().includes('acquir')); // Simplified acquirer check
      const labelContent = (
        <div className="text-center p-2">
          <div className="font-semibold text-sm" style={{ color: colors.textColor }}>
            {entity.name}
          </div>
          <div className="text-xs text-gray-500 italic">{entity.type}</div>
          {entity.description && <div className="text-xs text-gray-600 mt-1">{entity.description}</div>}
          {additionalDescription && <div className="text-xs text-gray-600 mt-1">{additionalDescription}</div>}
          {entity.percentage !== undefined && (
            <div className="text-xs font-medium text-blue-700 mt-1">
              {entity.percentage.toFixed(1)}%
            </div>
          )}
          {entity.value !== undefined && (
            <div className="text-xs font-medium text-green-700 mt-1">
              {entity.currency || '...'} {(entity.value / 1000000).toFixed(1)}M
            </div>
          )}
        </div>
      );

      return {
        id: entity.id,
        type: 'default', 
        position: { x, y },
        data: { 
          label: labelContent,
          entityType: entity.type // Storing entityType directly in data
        },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `${colors.borderWidth} solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: `${ENTITY_WIDTH}px`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center' as const, // Fixed textAlign type
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };
    };
    
    const addSectionHeader = (id: string, label: string, x: number, y: number) => {
        newNodes.push({
            id: id,
            type: 'default', // Could be a custom type 'sectionHeaderNode'
            position: { x, y },
            data: { label: <div className="text-lg font-bold text-gray-700">{label}</div> },
            style: {
                backgroundColor: 'transparent',
                border: 'none',
                width: ENTITY_WIDTH,
                pointerEvents: 'none',
            },
            draggable: false,
            selectable: false,
        });
    };

    let currentXOffset = 50;

    // BEFORE Section
    addSectionHeader('header-before', 'BEFORE TRANSACTION', currentXOffset + (ENTITY_WIDTH / 2) , 0);
    const beforeTarget = transactionFlow.before.entities.find(e => e.type === 'target');
    // Ensure shareholders also include parents for correct positioning
    const beforeShareholdersAndParents = transactionFlow.before.entities.filter(e => e.type === 'stockholder' || e.type === 'parent');
    const beforeSubsidiaries = transactionFlow.before.entities.filter(e => e.type === 'subsidiary');


    if (beforeTarget) {
      const targetX = currentXOffset + (Math.max(0, beforeShareholdersAndParents.length - 1) * SIBLING_X_SPACING) / 2;
      newNodes.push(createEntityNode(beforeTarget, targetX, BASE_Y_COMPANY));

      beforeShareholdersAndParents.forEach((shOrParent, idx) => {
        const shX = currentXOffset + idx * SIBLING_X_SPACING;
        newNodes.push(createEntityNode(shOrParent, shX, BASE_Y_SHAREHOLDER));
      });
      
      beforeSubsidiaries.forEach((sub, idx) => {
        const parentRel = transactionFlow.before.relationships.find(r => r.target === sub.id);
        const parentEntityNode = newNodes.find(n => n.id === parentRel?.source);
        const subX = parentEntityNode ? parentEntityNode.position.x : targetX + idx * SIBLING_X_SPACING; // Fallback positioning
        newNodes.push(createEntityNode(sub, subX, BASE_Y_SUBSIDIARY + (idx * (ENTITY_HEIGHT + 30))));
      });
    }
    
    transactionFlow.before.relationships.forEach((rel, index) => {
        if (newNodes.find(n => n.id === rel.source) && newNodes.find(n => n.id === rel.target)) {
            newEdges.push({
                id: `edge-before-${rel.source}-${rel.target}-${index}`,
                source: rel.source,
                target: rel.target,
                type: 'smoothstep', 
                label: rel.percentage ? `${rel.percentage}% ${rel.type}` : rel.type,
                style: { stroke: '#525252', strokeWidth: 1.5 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#525252' }, // Fixed marker type
            });
        }
    });
    
    const beforeSectionWidth = Math.max(beforeShareholdersAndParents.length, 1) * SIBLING_X_SPACING;
    currentXOffset += beforeSectionWidth + SECTION_X_SPACING;

    // TRANSACTION Section
    addSectionHeader('header-transaction', 'TRANSACTION', currentXOffset + (ENTITY_WIDTH / 2), 0);
    if (transactionFlow.transactionContext) {
        const tc = transactionFlow.transactionContext;
        const transactionNodeId = 'node-transaction-process';
        newNodes.push({
            id: transactionNodeId,
            type: 'default',
            position: { x: currentXOffset, y: BASE_Y_COMPANY }, // Positioned at the company level
            data: {
                label: (
                    <div className="text-center p-3">
                        <div className="font-semibold text-sm text-purple-700">{tc.type}</div>
                        <div className="text-xs text-gray-600">{tc.description.split(" via ")[0]}</div>
                        {tc.amount > 0 && (
                            <div className="text-xs font-medium text-purple-600">
                                {tc.currency} {(tc.amount / 1000000).toFixed(0)}M
                            </div>
                        )}
                        <div className="text-xs text-gray-500 italic mt-1">Structure: {tc.recommendedStructure}</div>
                    </div>
                )
            },
            style: {
                backgroundColor: '#f3e8ff', 
                border: '2px dashed #8b5cf6', 
                borderRadius: '8px', 
                width: ENTITY_WIDTH,
                textAlign: 'center' as const, // Ensure textAlign is correctly typed
            }
        });
        // Edges from Before Target to Transaction & from Transaction to After Target
        // Find before target node using its generated ID
        const beforeTargetNode = newNodes.find(n => n.id === `before-target-${transactionFlow.transactionContext?.targetName.replace(/[^a-zA-Z0-9]/g, '')}`);

        if (beforeTargetNode) {
            newEdges.push({
                id: 'edge-before-to-tx',
                source: beforeTargetNode.id,
                target: transactionNodeId,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#8b5cf6', strokeWidth: 2 },
            });
        }
    }
    const transactionSectionWidth = ENTITY_WIDTH; // Assuming one node for transaction process
    currentXOffset += transactionSectionWidth + SECTION_X_SPACING;

    // AFTER Section
    addSectionHeader('header-after', 'AFTER TRANSACTION', currentXOffset + (ENTITY_WIDTH / 2), 0);
    const afterTarget = transactionFlow.after.entities.find(e => e.type === 'target');
    const afterBuyers = transactionFlow.after.entities.filter(e => e.type === 'buyer');
    const afterStockholders = transactionFlow.after.entities.filter(e => e.type === 'stockholder');
    const afterParents = transactionFlow.after.entities.filter(e => e.type === 'parent'); // Include parents
    const afterConsiderations = transactionFlow.after.entities.filter(e => e.type === 'consideration');
    const afterSubsidiaries = transactionFlow.after.entities.filter(e => e.type === 'subsidiary');

    const allAfterOwners = [...afterBuyers, ...afterStockholders, ...afterParents]; // Include parents as owners

    if (afterTarget) {
      const targetX = currentXOffset + (Math.max(0, allAfterOwners.length - 1) * SIBLING_X_SPACING) / 2;
      newNodes.push(createEntityNode(afterTarget, targetX, BASE_Y_COMPANY));

      allAfterOwners.forEach((owner, idx) => {
        const ownerX = currentXOffset + idx * SIBLING_X_SPACING;
        newNodes.push(createEntityNode(owner, ownerX, BASE_Y_SHAREHOLDER));
      });
      
      afterConsiderations.forEach((con, idx) => {
        const conX = targetX + idx * SIBLING_X_SPACING; 
        newNodes.push(createEntityNode(con, conX, BASE_Y_CONSIDERATION));
      });

      afterSubsidiaries.forEach((sub, idx) => {
        const parentRel = transactionFlow.after.relationships.find(r => r.target === sub.id);
        const parentEntityNode = newNodes.find(n => n.id === parentRel?.source);
        const subX = parentEntityNode ? parentEntityNode.position.x : targetX + idx * SIBLING_X_SPACING;
        newNodes.push(createEntityNode(sub, subX, BASE_Y_SUBSIDIARY + (idx * (ENTITY_HEIGHT + 30))));
      });

      const transactionNode = newNodes.find(n => n.id === 'node-transaction-process');
      // Ensure afterTarget.id is used from the entity pushed to newNodes
      const afterTargetNode = newNodes.find(n => n.id === afterTarget.id);
      if (transactionNode && afterTargetNode) {
          newEdges.push({
              id: 'edge-tx-to-after',
              source: transactionNode.id,
              target: afterTargetNode.id, 
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#8b5cf6', strokeWidth: 2 },
          });
      }
    }

    transactionFlow.after.relationships.forEach((rel, index) => {
        if (newNodes.find(n => n.id === rel.source) && newNodes.find(n => n.id === rel.target)) {
            const sourceNode = newNodes.find(n => n.id === rel.source);
            // const targetNode = newNodes.find(n => n.id === rel.target); // Not used currently
            let strokeColor = '#525252'; 
            // Use stored entityType from node data
            if (rel.type === 'ownership') strokeColor = sourceNode?.data?.entityType === 'buyer' ? '#2563eb' : '#525252'; 
            if (rel.type === 'consideration') strokeColor = '#16a34a';

            newEdges.push({
                id: `edge-after-${rel.source}-${rel.target}-${index}`,
                source: rel.source,
                target: rel.target,
                type: 'smoothstep',
                label: rel.percentage ? `${rel.percentage}% ${rel.type}` : (rel.value ? `${(rel.value/1000000).toFixed(0)}M ${rel.type}` : rel.type),
                style: { stroke: strokeColor, strokeWidth: rel.type === 'consideration' ? 2.5 : 1.5 },
                markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor }, // Fixed marker type
            });
        } else {
            console.warn(`Skipping edge due to missing node: source=${rel.source}, target=${rel.target}`);
        }
    });

    // Connect continuing shareholders (Before -> After)
    transactionFlow.before.entities
      .filter(e => e.type === 'stockholder')
      .forEach(beforeSH => {
        const afterSH = transactionFlow.after.entities.find(
          afterE => afterE.name === beforeSH.name && afterE.type === 'stockholder'
        );
        if (afterSH && newNodes.find(n => n.id === beforeSH.id) && newNodes.find(n => n.id === afterSH.id)) {
          newEdges.push({
            id: `edge-continuation-${beforeSH.id}-${afterSH.id}`,
            source: beforeSH.id,
            target: afterSH.id,
            type: 'straight',
            style: { stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '5 3' }, // Orange, dashed
            label: 'Continues',
            labelStyle: { fontSize: '10px', fill: '#f59e0b'},
          });
        }
      });

    console.log("Generated Diagram Nodes:", newNodes.length, "Edges:", newEdges.length);
    return { nodes: newNodes, edges: newEdges };
  }, [transactionFlow]);

  if (!transactionFlow) {
    return <div className="flex items-center justify-center h-full text-gray-500">Loading transaction flow data...</div>;
  }
  
  if (nodes.length === 0 && edges.length === 0 && transactionFlow) {
    return <div className="flex items-center justify-center h-full text-gray-500">No diagram to display. Check data processing.</div>;
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
