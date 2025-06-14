
// Utility to generate entity hierarchy levels based on relationships

import { TransactionEntity, TransactionFlow } from "@/types/transactionFlow";

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
 * Builds a hierarchy for the "After Transaction" section based on business entity types.
 * This overrides the generic parent-child relationship hierarchy to enforce a specific
 * visual layout (e.g., stockholders always at the top).
 *
 * @param entities The entities in the "After" section.
 * @returns A Map of entity ID to its hierarchy level.
 */
export function computeAfterTransactionHierarchy(
  entities: TransactionEntity[]
): Map<string, number> {
  const levels = new Map<string, number>();

  // Assign levels based on entity type with a clear business hierarchy
  entities.forEach((entity) => {
    switch (entity.type) {
      // Level 0: All individual shareholders and groups of shareholders
      case 'stockholder':
        levels.set(entity.id, 0);
        break;

      // Level 1: The main acquiring entities
      case 'buyer':
      case 'parent':
      case 'newco': // New holding company is often at this level
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

  return levels;
}


/**
 * Returns max hierarchy level (deepest), used for layout spacing.
 */
export function getMaxHierarchyLevel(levelMap: Map<string, number>): number {
  return Math.max(...Array.from(levelMap.values()));
}
