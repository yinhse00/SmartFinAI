
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
 * Returns max hierarchy level (deepest), used for layout spacing.
 */
export function getMaxHierarchyLevel(levelMap: Map<string, number>): number {
  return Math.max(...Array.from(levelMap.values()));
}
