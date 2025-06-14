
import React from 'react';
import { Node, Edge, MarkerType } from '@xyflow/react';
import { TransactionFlow, TransactionEntity, AnyTransactionRelationship, OwnershipRelationship, ConsiderationRelationship } from '@/types/transactionFlow';
import { createEntityNode, addSectionHeaderNode } from './nodeUtils';
import {
  ENTITY_WIDTH,
  SIBLING_X_SPACING,
  SECTION_X_SPACING,
  LEVEL_Y_SPACING
} from './diagramLayoutUtils';
import { computeEntityHierarchyLevels, computeAfterTransactionHierarchy, getMaxHierarchyLevel } from './diagramHierarchyUtils';

/**
 * Given an entity hierarchy, calculate the Y position based on level, with buffers.
 * @param level Hierarchy depth (0=top/shareholder, 1=company, etc.)
 */
function getYPositionForLevel(level: number): number {
  return 30 + level * LEVEL_Y_SPACING;
}

/**
 * Calculates the layout for a single section (e.g., "Before" or "After")
 * to ensure nodes are centered and do not overlap.
 */
const calculateSectionLayout = (
  entities: TransactionEntity[],
  levels: Map<string, number>,
  startX: number
): { nodes: Node[], sectionWidth: number } => {
  const groupByLevel: Record<number, TransactionEntity[]> = {};
  entities.forEach(e => {
    const lvl = levels.get(e.id) ?? 0;
    if (!groupByLevel[lvl]) groupByLevel[lvl] = [];
    groupByLevel[lvl].push(e);
  });
  
  const maxLevel = getMaxHierarchyLevel(levels);
  const levelLayouts: { nodes: TransactionEntity[]; width: number }[] = [];
  let sectionWidth = 0;

  for (let i = 0; i <= maxLevel; i++) {
    const nodesAtLevel = groupByLevel[i] || [];
    const width = nodesAtLevel.length > 0
      ? ((nodesAtLevel.length - 1) * SIBLING_X_SPACING) + ENTITY_WIDTH
      : 0;
    levelLayouts.push({ nodes: nodesAtLevel, width });
    sectionWidth = Math.max(sectionWidth, width);
  }

  const newNodes: Node[] = [];
  for (let lvl = 0; lvl <= maxLevel; lvl++) {
    const { nodes: nodesAtLevel, width: levelWidth } = levelLayouts[lvl];
    if (nodesAtLevel.length === 0) continue;

    const levelStartX = startX + (sectionWidth / 2) - (levelWidth / 2);
    nodesAtLevel.forEach((entity, idx) => {
      const x = levelStartX + idx * SIBLING_X_SPACING;
      const y = getYPositionForLevel(lvl);
      newNodes.push(createEntityNode(entity, x, y));
    });
  }

  return { nodes: newNodes, sectionWidth };
};

export const processTransactionFlowForDiagram = (transactionFlow: TransactionFlow): { nodes: Node[], edges: Edge[] } => {
  const newNodes: Node[] = [];
  const newEdges: Edge[] = [];
  let currentXOffset = 50;

  console.log('=== DIAGRAM PROCESSOR DEBUG START ===');
  console.log('TransactionFlow input:', JSON.stringify(transactionFlow, null, 2));

  // Helper to add section header and update nodes array
  const addSectionHeader = (id: string, label: string, x: number, y: number, width: number) => {
      newNodes.push(addSectionHeaderNode(id, label, x, y));
  };

  // BEFORE Section
  const beforeEntities = transactionFlow.before.entities;
  const beforeLevels = computeEntityHierarchyLevels(beforeEntities, transactionFlow.before.relationships);
  
  console.log('BEFORE Section Processing:');
  console.log('- Entities count:', beforeEntities.length);
  console.log('- Relationships count:', transactionFlow.before.relationships.length);
  console.log('- Hierarchy levels:', Array.from(beforeLevels.entries()));
  
  const { nodes: beforeNodes, sectionWidth: beforeSectionWidth } = calculateSectionLayout(beforeEntities, beforeLevels, currentXOffset);
  addSectionHeader('header-before', 'BEFORE TRANSACTION', currentXOffset + beforeSectionWidth / 2 - ENTITY_WIDTH / 2, 0, beforeSectionWidth);
  newNodes.push(...beforeNodes);

  console.log('BEFORE nodes created:', beforeNodes.length);

  // Edges for BEFORE section
  transactionFlow.before.relationships.forEach((rel, index) => {
    const sourceExists = newNodes.find(n => n.id === rel.source);
    const targetExists = newNodes.find(n => n.id === rel.target);
    
    console.log(`BEFORE Relationship ${index}: ${rel.source} -> ${rel.target} (${rel.type})`);
    console.log(`  Source exists: ${!!sourceExists}, Target exists: ${!!targetExists}`);
    
    if (sourceExists && targetExists) {
      let edgeLabel: string | React.ReactNode = rel.label || rel.type;
      if ((rel.type === 'ownership' || rel.type === 'control') && (rel as OwnershipRelationship).percentage !== undefined) {
        edgeLabel = `${(rel as OwnershipRelationship).percentage?.toFixed(1)}%`;
      } else if (rel.type === 'consideration' || rel.type === 'funding') {
        edgeLabel = rel.type; // Value is shown on the node itself
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
      console.log(`  ✓ Edge created successfully`);
    } else {
      console.log(`  ✗ Edge NOT created - missing node(s)`);
    }
  });

  currentXOffset += beforeSectionWidth + SECTION_X_SPACING;

  // TRANSACTION Section
  addSectionHeader('header-transaction', 'TRANSACTION', currentXOffset, 0, ENTITY_WIDTH);
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
  const afterEntities = transactionFlow.after.entities;
  const afterLevels = computeAfterTransactionHierarchy(afterEntities);
  
  console.log('AFTER Section Processing:');
  console.log('- Entities count:', afterEntities.length);
  console.log('- Relationships count:', transactionFlow.after.relationships.length);
  console.log('- Hierarchy levels:', Array.from(afterLevels.entries()));
  
  afterEntities.forEach((entity, idx) => {
    console.log(`  Entity ${idx}: ${entity.id} (${entity.type}) - ${entity.name} - Level: ${afterLevels.get(entity.id)}`);
    if (entity.percentage) console.log(`    Percentage: ${entity.percentage}%`);
  });
  
  const { nodes: afterNodes, sectionWidth: afterSectionWidth } = calculateSectionLayout(afterEntities, afterLevels, currentXOffset);
  addSectionHeader('header-after', 'AFTER TRANSACTION', currentXOffset + afterSectionWidth / 2 - ENTITY_WIDTH / 2, 0, afterSectionWidth);
  newNodes.push(...afterNodes);

  console.log('AFTER nodes created:', afterNodes.length);

  // Edges for AFTER section
  transactionFlow.after.relationships.forEach((rel, index) => {
      const sourceExists = newNodes.find(n => n.id === rel.source);
      const targetExists = newNodes.find(n => n.id === rel.target);
      
      console.log(`AFTER Relationship ${index}: ${rel.source} -> ${rel.target} (${rel.type})`);
      console.log(`  Source exists: ${!!sourceExists}, Target exists: ${!!targetExists}`);
      if ((rel as OwnershipRelationship).percentage) {
        console.log(`  Percentage: ${(rel as OwnershipRelationship).percentage}%`);
      }
      
      if (sourceExists && targetExists) {
          const sourceNode = newNodes.find(n => n.id === rel.source);
          let strokeColor = '#525252'; 
          if (rel.type === 'ownership' && sourceNode?.data?.entityType === 'buyer')
            strokeColor = '#2563eb';
          if (rel.type === 'consideration')
            strokeColor = '#16a34a';

          let edgeLabel: string | React.ReactNode = rel.label || rel.type;
          if ((rel.type === 'ownership' || rel.type === 'control') && (rel as OwnershipRelationship).percentage !== undefined) {
            edgeLabel = `${(rel as OwnershipRelationship).percentage?.toFixed(1)}%`;
          } else if (rel.type === 'consideration' || rel.type === 'funding') {
            edgeLabel = rel.type; // Value is shown on the node itself
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
          console.log(`  ✓ Edge created successfully with label: ${edgeLabel}`);
      } else {
          console.log(`  ✗ Edge NOT created - missing node(s)`);
          if (!sourceExists) console.log(`    Missing source node: ${rel.source}`);
          if (!targetExists) console.log(`    Missing target node: ${rel.target}`);
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
        console.log(`Continuation edge created: ${beforeSH.name}`);
      }
    });

  console.log('=== FINAL DIAGRAM SUMMARY ===');
  console.log(`Total nodes: ${newNodes.length}`);
  console.log(`Total edges: ${newEdges.length}`);
  console.log('=== DIAGRAM PROCESSOR DEBUG END ===');

  return { nodes: newNodes, edges: newEdges };
};
