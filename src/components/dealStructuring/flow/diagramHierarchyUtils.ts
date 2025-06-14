// Utility to generate entity hierarchy levels based on relationships

import { TransactionEntity, TransactionFlow, AnyTransactionRelationship } from "@/types/transactionFlow";

/**
 * Builds a mapping of entity ID to hierarchy depth for vertical positioning.
 * @param entities Full array of entities in the diagram section (before/after)
 * @param relationships Array of { source, target } relationships
 * @returns Map of id => depth (0=top level shareholder, 1=company etc)
 */
export function computeEntityHierarchyLevels(
  entities: TransactionEntity[],
  relationships: { source: string; target: string }[]
): Map<string, number> {
  // Build an adjacency list: child -> parent(s), because we want to traverse upwards to roots
  const parentMap = new Map<string, string[]>();
  relationships.forEach((rel) => {
    if (!parentMap.has(rel.target)) parentMap.set(rel.target, []);
    parentMap.get(rel.target)!.push(rel.source);
  });

  // Find all "roots" (entities that are not a target in any relationship, i.e. no parent)
  const entityIds = entities.map((e) => e.id);
  const allTargets = new Set(relationships.map((r) => r.target));
  const roots = entityIds.filter((id) => !allTargets.has(id));
  // Typically, shareholders without parents are roots

  // Breadth-first traversal to assign depths from roots (shareholders) "downwards"
  const levels = new Map<string, number>();
  const visited = new Set<string>();
  type QueueEntry = { id: string; level: number };
  const queue: QueueEntry[] = roots.map((id) => ({ id, level: 0 }));

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (visited.has(id)) continue;
    levels.set(id, level);
    visited.add(id);

    // Find all children (where this id is parent/source)
    const children = relationships
      .filter((r) => r.source === id)
      .map((r) => r.target);
    for (const childId of children) {
      queue.push({ id: childId, level: level + 1 });
    }
  }

  // Make sure all entities have a depth, assign "orphans" to bottom
  for (const id of entityIds) {
    if (!levels.has(id)) {
      // Orphan: give it max + 1 or 0 if no entities
      levels.set(id, (Math.max(-1, ...Array.from(levels.values())) + 1));
    }
  }

  return levels;
}

/**
 * Builds a hierarchy for the "After Transaction" section based on business entity types
 * and their ownership relationships. This overrides the generic parent-child relationship 
 * hierarchy to enforce a specific visual layout where stockholders are placed directly 
 * above the entities they own, preventing visually confusing "skipping" of levels.
 *
 * @param entities The entities in the "After" section.
 * @param relationships The relationships in the "After" section.
 * @returns A Map of entity ID to its hierarchy level.
 */
export function computeAfterTransactionHierarchy(
  entities: TransactionEntity[],
  relationships: AnyTransactionRelationship[]
): Map<string, number> {
  const levels = new Map<string, number>();
  const stockholderEntities = entities.filter(e => e.type === 'stockholder');
  const otherEntities = entities.filter(e => e.type !== 'stockholder');

  // 1. Assign base levels for all non-stockholder entities to establish the main corporate structure
  otherEntities.forEach((entity) => {
    switch (entity.type) {
      // Level 1: The main acquiring entities
      case 'buyer':
      case 'parent':
      case 'newco':
        levels.set(entity.id, 1);
        break;

      // Level 2: The company that was acquired
      case 'target':
        levels.set(entity.id, 2);
        break;

      // Level 3: Entities receiving payment or subsidiaries of the target
      case 'consideration':
      case 'subsidiary':
        levels.set(entity.id, 3);
        break;

      // Default/fallback for any other types
      default:
        if (!levels.has(entity.id)) {
          levels.set(entity.id, 4); // Put unknown types at the bottom
        }
        break;
    }
  });

  // 2. Position stockholders dynamically based on the level of the entities they own
  stockholderEntities.forEach((stockholder) => {
    const ownerships = relationships.filter(
      rel => rel.source === stockholder.id && rel.type === 'ownership'
    );

    if (ownerships.length > 0) {
      const potentialLevels = ownerships.map(ownership => {
        const targetLevel = levels.get(ownership.target);
        // Place stockholder 1 level above the entity it owns.
        return targetLevel !== undefined ? targetLevel - 1 : -1;
      }).filter(level => level >= 0); // Ignore invalid levels

      if (potentialLevels.length > 0) {
        // If a stockholder owns entities at different levels (e.g., a level-1 parent
        // and a level-2 target), place it above the HIGHEST entity it owns in the hierarchy
        // (i.e., the one with the lowest level number).
        // Math.min achieves this: min(level 0, level 1) = level 0.
        levels.set(stockholder.id, Math.min(...potentialLevels));
      } else {
        // Fallback for stockholders with malformed ownerships
        levels.set(stockholder.id, 0);
      }
    } else {
      // If a stockholder owns nothing (e.g., only received cash), place at the top.
      levels.set(stockholder.id, 0);
    }
  });

  // Final validation pass to ensure every single entity has a level assigned.
  entities.forEach(entity => {
      if (!levels.has(entity.id)) {
          console.warn(`[computeAfterTransactionHierarchy] Entity ${entity.id} ('${entity.name}') was not assigned a level, defaulting to 5.`);
          levels.set(entity.id, 5);
      }
  });

  return levels;
}


/**
 * Returns max hierarchy level (deepest), used for layout spacing.
 */
export function getMaxHierarchyLevel(levelMap: Map<string, number>): number {
  return Math.max(...Array.from(levelMap.values()));
}
