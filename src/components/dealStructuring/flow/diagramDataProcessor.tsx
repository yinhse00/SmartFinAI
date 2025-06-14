import React from 'react';
import { Node, Edge, MarkerType } from '@xyflow/react';
import { TransactionFlow, TransactionEntity, AnyTransactionRelationship, OwnershipRelationship, ConsiderationRelationship } from '@/types/transactionFlow';
import { createEntityNode, addSectionHeaderNode } from './nodeUtils';
import {
  ENTITY_WIDTH,
  ENTITY_HEIGHT,
  SIBLING_X_SPACING,
  SECTION_X_SPACING,
  LEVEL_Y_SPACING
} from './diagramLayoutUtils';
import { computeEntityHierarchyLevels, getMaxHierarchyLevel } from './diagramHierarchyUtils';

/**
 * Given an entity hierarchy, calculate the Y position based on level, with buffers.
 * @param level Hierarchy depth (0=top/shareholder, 1=company, etc.)
 */
function getYPositionForLevel(level: number): number {
  return 30 + level * LEVEL_Y_SPACING;
}

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
  const beforeEntities = transactionFlow.before.entities;
  const beforeRelationships = transactionFlow.before.relationships;

  // Compute hierarchy for "before"
  const beforeLevels = computeEntityHierarchyLevels(beforeEntities, beforeRelationships);

  // Group entities by their hierarchy (so we can space x-axis efficiently per layer)
  const beforeGroupByLevel: Record<number, TransactionEntity[]> = {};
  beforeEntities.forEach((e) => {
    const lvl = beforeLevels.get(e.id) ?? 0;
    if (!beforeGroupByLevel[lvl]) beforeGroupByLevel[lvl] = [];
    beforeGroupByLevel[lvl].push(e);
  });
  const beforeMaxLevel = getMaxHierarchyLevel(beforeLevels);

  // Place nodes per level vertically
  let beforeXStart = currentXOffset;
  let beforeSectionWidth = 0;

  for (let lvl = 0; lvl <= beforeMaxLevel; lvl++) {
    const nodesAtLevel = beforeGroupByLevel[lvl] || [];
    const levelStartX = beforeXStart + ((Math.max(0, nodesAtLevel.length - 1) * SIBLING_X_SPACING) / 2);
    nodesAtLevel.forEach((entity, idx) => {
      const x = beforeXStart + idx * SIBLING_X_SPACING;
      const y = getYPositionForLevel(lvl);
      newNodes.push(createEntityNode(entity, x, y));
    });
    beforeSectionWidth = Math.max(beforeSectionWidth, nodesAtLevel.length * SIBLING_X_SPACING + ENTITY_WIDTH);
  }

  // Edges for BEFORE section
  transactionFlow.before.relationships.forEach((rel, index) => {
    if (newNodes.find(n => n.id === rel.source) && newNodes.find(n => n.id === rel.target)) {
      let edgeLabel = rel.label || rel.type;
      if ((rel.type === 'ownership' || rel.type === 'control') && (rel as OwnershipRelationship).percentage !== undefined) {
        edgeLabel = `${(rel as OwnershipRelationship).percentage}% ${rel.type}`;
      } else if ((rel.type === 'consideration' || rel.type === 'funding') && (rel as ConsiderationRelationship).value !== undefined) {
         // Assuming value might be large, format if needed, or just show type if no value
         edgeLabel = `${rel.type}`; // Or format value: `${(rel as ConsiderationRelationship).value} ${rel.type}`
      }

      newEdges.push({
        id: `edge-before-${rel.source}-${rel.target}-${index}`,
        source: rel.source,
        target: rel.target,
        type: 'smoothstep',
        label: edgeLabel,
        style: { stroke: '#525252', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#525252' },
      });
    }
  });

  currentXOffset += beforeSectionWidth + SECTION_X_SPACING;

  // TRANSACTION Section
  addSectionHeader('header-transaction', 'TRANSACTION', currentXOffset + (ENTITY_WIDTH / 2), 0);
  if (transactionFlow.transactionContext) {
      const tc = transactionFlow.transactionContext;
      const transactionNodeId = 'node-transaction-process';
      newNodes.push({
          id: transactionNodeId,
          type: 'default',
          position: { x: currentXOffset, y: getYPositionForLevel(1) },
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

      // Add edge from BEFORE target (or company node at lowest level) to transaction node
      // (try to find deepest node of type 'target' if exists)
      const beforeTarget = beforeEntities.find(e => e.type === 'target');
      if (beforeTarget) {
          newEdges.push({
              id: 'edge-before-to-tx',
              source: beforeTarget.id,
              target: transactionNodeId,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#8b5cf6', strokeWidth: 2 },
          });
      }
  }
  currentXOffset += ENTITY_WIDTH + SECTION_X_SPACING;

  // AFTER Section
  addSectionHeader('header-after', 'AFTER TRANSACTION', currentXOffset + (ENTITY_WIDTH / 2), 0);
  const afterEntities = transactionFlow.after.entities;
  const afterRelationships = transactionFlow.after.relationships;

  // Compute hierarchy for "after"
  const afterLevels = computeEntityHierarchyLevels(afterEntities, afterRelationships);

  // Group entities by their hierarchy
  const afterGroupByLevel: Record<number, TransactionEntity[]> = {};
  afterEntities.forEach((e) => {
    const lvl = afterLevels.get(e.id) ?? 0;
    if (!afterGroupByLevel[lvl]) afterGroupByLevel[lvl] = [];
    afterGroupByLevel[lvl].push(e);
  });
  const afterMaxLevel = getMaxHierarchyLevel(afterLevels);

  // Place nodes per level vertically in "after"
  let afterXStart = currentXOffset;
  let afterSectionWidth = 0;
  for (let lvl = 0; lvl <= afterMaxLevel; lvl++) {
    const nodesAtLevel = afterGroupByLevel[lvl] || [];
    nodesAtLevel.forEach((entity, idx) => {
      const x = afterXStart + idx * SIBLING_X_SPACING;
      const y = getYPositionForLevel(lvl);
      newNodes.push(createEntityNode(entity, x, y));
    });
    afterSectionWidth = Math.max(afterSectionWidth, nodesAtLevel.length * SIBLING_X_SPACING + ENTITY_WIDTH);
  }

  // Edges for AFTER section
  transactionFlow.after.relationships.forEach((rel, index) => {
      if (newNodes.find(n => n.id === rel.source) && newNodes.find(n => n.id === rel.target)) {
          const sourceNode = newNodes.find(n => n.id === rel.source);
          let strokeColor = '#525252'; 
          if (rel.type === 'ownership' && sourceNode?.data?.entityType === 'buyer')
            strokeColor = '#2563eb';
          if (rel.type === 'consideration')
            strokeColor = '#16a34a';

          let edgeLabel = rel.label || rel.type;
          if ((rel.type === 'ownership' || rel.type === 'control') && (rel as OwnershipRelationship).percentage !== undefined) {
            edgeLabel = `${(rel as OwnershipRelationship).percentage}% ${rel.type}`;
          } else if ((rel.type === 'consideration' || rel.type === 'funding') && (rel as ConsiderationRelationship).value !== undefined) {
            edgeLabel = `${((rel as ConsiderationRelationship).value || 0)/1000000}M ${rel.type}`;
          }
          
          newEdges.push({
              id: `edge-after-${rel.source}-${rel.target}-${index}`,
              source: rel.source,
              target: rel.target,
              type: 'smoothstep',
              label: edgeLabel,
              style: { stroke: strokeColor, strokeWidth: rel.type === 'consideration' ? 2.5 : 1.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
          });
      }
  });

  // Connect continuing shareholders (Before -> After) if entity id & name matches and both are "stockholder"
  beforeEntities
    .filter(e => e.type === 'stockholder')
    .forEach(beforeSH => {
      const afterSH = afterEntities.find(
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
          labelStyle: { fontSize: '10px', fill: '#f59e0b' },
        });
      }
    });

  return { nodes: newNodes, edges: newEdges };
};
