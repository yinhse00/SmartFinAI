import React, { useMemo } from 'react';
import { ReactFlow, Node, Edge, Background, Controls, Position } from '@xyflow/react';
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
    const ENTITY_HEIGHT = 90;
    const LEVEL_Y_SPACING = 180; // Vertical space between levels (shareholders, company, consideration)
    const SIBLING_X_SPACING = ENTITY_WIDTH + 50; // Horizontal space between sibling entities on the same level
    const SECTION_X_SPACING = ENTITY_WIDTH + 150; // Horizontal space between Before, Transaction, After sections

    const BASE_Y_SHAREHOLDER = 50;
    const BASE_Y_COMPANY = BASE_Y_SHAREHOLDER + LEVEL_Y_SPACING;
    const BASE_Y_CONSIDERATION = BASE_Y_COMPANY + LEVEL_Y_SPACING;
    const BASE_Y_SUBSIDIARY = BASE_Y_COMPANY + LEVEL_Y_SPACING;


    const getNodeColors = (type: string, isAcquirer?: boolean) => {
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
          return isAcquirer ? { // This case might be redundant if 'buyer' type is consistently used
            backgroundColor: '#ecfdf5', // Light green
            borderColor: '#10b981', // Green
            textColor: '#047857', // Dark green
            borderWidth: '2px'
          } : {
            backgroundColor: '#f3f4f6', // Light gray
            borderColor: '#6b7280', // Gray
            textColor: '#374151', // Dark gray
            borderWidth: '2px'
          };
        case 'subsidiary':
           return {
            backgroundColor: '#e0f2fe', // Lighter blue than buyer
            borderColor: '#0ea5e9',   // Sky blue
            textColor: '#0c4a6e',   // Darker sky blue
            borderWidth: '1.5px'
          };
        case 'newco':
          return {
            backgroundColor: '#ede9fe', // Light purple
            borderColor: '#7c3aed', // Purple
            textColor: '#5b21b6', // Dark purple
            borderWidth: '2px'
          };
        case 'consideration':
          return {
            backgroundColor: '#f0fdf4', // Very light green
            borderColor: '#16a34a', // Strong green
            textColor: '#15803d', // Dark green
            borderWidth: '2px'
          };
        default: // For any other types or fallbacks
          return {
            backgroundColor: '#f3f4f6',
            borderColor: '#6b7280',
            textColor: '#374151',
            borderWidth: '2px'
          };
      }
    };

    const createEntityNode = (entity: TransactionEntity, x: number, y: number, additionalDescription?: string) => {
      const colors = getNodeColors(entity.type, entity.type === 'buyer');
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
        type: 'default', // Using default nodes for simplicity, can be custom
        position: { x, y },
        data: { label: labelContent },
        style: {
          backgroundColor: colors.backgroundColor,
          border: `${colors.borderWidth} solid ${colors.borderColor}`,
          borderRadius: '8px',
          width: `${ENTITY_WIDTH}px`,
          // height: `${ENTITY_HEIGHT}px`, // Auto-height based on content
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center',
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
    const beforeShareholders = transactionFlow.before.entities.filter(e => e.type === 'stockholder' || e.type === 'parent'); // include parent as potential holder
    const beforeSubsidiaries = transactionFlow.before.entities.filter(e => e.type === 'subsidiary');


    if (beforeTarget) {
      const targetX = currentXOffset + (Math.max(0, beforeShareholders.length - 1) * SIBLING_X_SPACING) / 2;
      newNodes.push(createEntityNode(beforeTarget, targetX, BASE_Y_COMPANY));

      beforeShareholders.forEach((sh, idx) => {
        const shX = currentXOffset + idx * SIBLING_X_SPACING;
        newNodes.push(createEntityNode(sh, shX, BASE_Y_SHAREHOLDER));
      });
      
      beforeSubsidiaries.forEach((sub, idx) => {
        // Position subsidiaries below the target or their respective parent
        const parentNode = transactionFlow.before.relationships.find(r => r.target === sub.id);
        const parentEntityNode = newNodes.find(n => n.id === parentNode?.source);
        const subX = parentEntityNode ? parentEntityNode.position.x : targetX + idx * SIBLING_X_SPACING;
        newNodes.push(createEntityNode(sub, subX, BASE_Y_SUBSIDIARY + (idx * (ENTITY_HEIGHT + 30))));
      });
    }
    
    transactionFlow.before.relationships.forEach((rel, index) => {
        if (newNodes.find(n => n.id === rel.source) && newNodes.find(n => n.id === rel.target)) {
            newEdges.push({
                id: `edge-before-${rel.source}-${rel.target}-${index}`,
                source: rel.source,
                target: rel.target,
                type: 'smoothstep', // or 'straight'
                label: rel.percentage ? `${rel.percentage}% ${rel.type}` : rel.type,
                style: { stroke: '#525252', strokeWidth: 1.5 },
                markerEnd: { type: 'arrowclosed', color: '#525252' },
            });
        }
    });
    
    const beforeSectionWidth = Math.max(beforeShareholders.length, 1) * SIBLING_X_SPACING;
    currentXOffset += beforeSectionWidth + SECTION_X_SPACING;

    // TRANSACTION Section
    addSectionHeader('header-transaction', 'TRANSACTION', currentXOffset + (ENTITY_WIDTH / 2), 0);
    if (transactionFlow.transactionContext) {
        const tc = transactionFlow.transactionContext;
        const transactionNodeId = 'node-transaction-process';
        newNodes.push({
            id: transactionNodeId,
            type: 'default',
            position: { x: currentXOffset, y: BASE_Y_COMPANY },
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
                backgroundColor: '#f3e8ff', border: '2px dashed #8b5cf6', borderRadius: '8px', width: ENTITY_WIDTH,
            }
        });
        // Edges from Before Target to Transaction & from Transaction to After Target
        const beforeTargetNode = newNodes.find(n => n.id.startsWith('before-target-'));
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
    const transactionSectionWidth = ENTITY_WIDTH;
    currentXOffset += transactionSectionWidth + SECTION_X_SPACING;

    // AFTER Section
    addSectionHeader('header-after', 'AFTER TRANSACTION', currentXOffset + (ENTITY_WIDTH / 2), 0);
    const afterTarget = transactionFlow.after.entities.find(e => e.type === 'target');
    const afterBuyers = transactionFlow.after.entities.filter(e => e.type === 'buyer');
    const afterStockholders = transactionFlow.after.entities.filter(e => e.type === 'stockholder');
    const afterConsiderations = transactionFlow.after.entities.filter(e => e.type === 'consideration');
    const afterSubsidiaries = transactionFlow.after.entities.filter(e => e.type === 'subsidiary');

    const allAfterOwners = [...afterBuyers, ...afterStockholders];

    if (afterTarget) {
      const targetX = currentXOffset + (Math.max(0, allAfterOwners.length - 1) * SIBLING_X_SPACING) / 2;
      newNodes.push(createEntityNode(afterTarget, targetX, BASE_Y_COMPANY));

      allAfterOwners.forEach((owner, idx) => {
        const ownerX = currentXOffset + idx * SIBLING_X_SPACING;
        newNodes.push(createEntityNode(owner, ownerX, BASE_Y_SHAREHOLDER));
      });
      
      afterConsiderations.forEach((con, idx) => {
        const conX = targetX + idx * SIBLING_X_SPACING; // Align with target or slightly offset
        newNodes.push(createEntityNode(con, conX, BASE_Y_CONSIDERATION));
      });

      afterSubsidiaries.forEach((sub, idx) => {
        const parentNode = transactionFlow.after.relationships.find(r => r.target === sub.id);
        const parentEntityNode = newNodes.find(n => n.id === parentNode?.source);
        const subX = parentEntityNode ? parentEntityNode.position.x : targetX + idx * SIBLING_X_SPACING;
        newNodes.push(createEntityNode(sub, subX, BASE_Y_SUBSIDIARY + (idx * (ENTITY_HEIGHT + 30))));
      });

      // Edge from Transaction to After Target
      const transactionNode = newNodes.find(n => n.id === 'node-transaction-process');
      if (transactionNode) {
          newEdges.push({
              id: 'edge-tx-to-after',
              source: transactionNode.id,
              target: afterTarget.id, // ID of the after-target node
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#8b5cf6', strokeWidth: 2 },
          });
      }
    }

    transactionFlow.after.relationships.forEach((rel, index) => {
        if (newNodes.find(n => n.id === rel.source) && newNodes.find(n => n.id === rel.target)) {
            const sourceNode = newNodes.find(n => n.id === rel.source);
            const targetNode = newNodes.find(n => n.id === rel.target);
            let strokeColor = '#525252'; // Default
            if (rel.type === 'ownership') strokeColor = sourceNode?.data?.label?.props?.children[1]?.props?.children === 'buyer' ? '#2563eb' : '#525252'; // Blue for buyer ownership
            if (rel.type === 'consideration') strokeColor = '#16a34a'; // Green for consideration

            newEdges.push({
                id: `edge-after-${rel.source}-${rel.target}-${index}`,
                source: rel.source,
                target: rel.target,
                type: 'smoothstep',
                label: rel.percentage ? `${rel.percentage}% ${rel.type}` : (rel.value ? `${(rel.value/1000000).toFixed(0)}M ${rel.type}` : rel.type),
                style: { stroke: strokeColor, strokeWidth: rel.type === 'consideration' ? 2.5 : 1.5 },
                markerEnd: { type: 'arrowclosed', color: strokeColor },
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
        nodesDraggable={true} // Allow dragging for manual adjustments if needed
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
