import React from 'react'; // Added React import for JSX
import { Node, Edge, MarkerType } from '@xyflow/react';
import { TransactionFlow, TransactionEntity } from '@/types/transactionFlow';
import { createEntityNode, addSectionHeaderNode } from './nodeUtils.tsx'; // Updated import
import {
  ENTITY_WIDTH,
  ENTITY_HEIGHT,
  SIBLING_X_SPACING,
  SECTION_X_SPACING,
  BASE_Y_SHAREHOLDER,
  BASE_Y_COMPANY,
  BASE_Y_CONSIDERATION,
  BASE_Y_SUBSIDIARY,
} from './diagramLayoutUtils';

export const processTransactionFlowForDiagram = (transactionFlow: TransactionFlow): { nodes: Node[], edges: Edge[] } => {
  const newNodes: Node[] = [];
  const newEdges: Edge[] = [];
  let currentXOffset = 50;

  // Helper to add section header and update nodes array
  const addSectionHeader = (id: string, label: string, x: number, y: number) => {
      newNodes.push(addSectionHeaderNode(id, label, x, y));
  };

  // BEFORE Section
  addSectionHeader('header-before', 'BEFORE TRANSACTION', currentXOffset + (ENTITY_WIDTH / 2), 0);
  const beforeTarget = transactionFlow.before.entities.find(e => e.type === 'target');
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
              type: 'smoothstep', 
              label: rel.percentage ? `${rel.percentage}% ${rel.type}` : rel.type,
              style: { stroke: '#525252', strokeWidth: 1.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#525252' },
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
              backgroundColor: '#f3e8ff', 
              border: '2px dashed #8b5cf6', 
              borderRadius: '8px', 
              width: ENTITY_WIDTH,
              textAlign: 'center' as const,
          }
      });
      
      const beforeTargetNode = newNodes.find(n => n.data.entityType === 'target' && n.id.startsWith('before-')); // Simplified find
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
  const afterParents = transactionFlow.after.entities.filter(e => e.type === 'parent');
  const afterConsiderations = transactionFlow.after.entities.filter(e => e.type === 'consideration');
  const afterSubsidiaries = transactionFlow.after.entities.filter(e => e.type === 'subsidiary');

  const allAfterOwners = [...afterBuyers, ...afterStockholders, ...afterParents];

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
          let strokeColor = '#525252'; 
          if (rel.type === 'ownership' && sourceNode?.data?.entityType === 'buyer') strokeColor = '#2563eb';
          if (rel.type === 'consideration') strokeColor = '#16a34a';

          newEdges.push({
              id: `edge-after-${rel.source}-${rel.target}-${index}`,
              source: rel.source,
              target: rel.target,
              type: 'smoothstep',
              label: rel.percentage ? `${rel.percentage}% ${rel.type}` : (rel.value ? `${(rel.value/1000000).toFixed(0)}M ${rel.type}` : rel.type),
              style: { stroke: strokeColor, strokeWidth: rel.type === 'consideration' ? 2.5 : 1.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
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
          style: { stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '5 3' },
          label: 'Continues',
          labelStyle: { fontSize: '10px', fill: '#f59e0b'},
        });
      }
    });
  
  console.log("Generated Diagram Nodes (from processor):", newNodes.length, "Edges:", newEdges.length);
  return { nodes: newNodes, edges: newEdges };
};
