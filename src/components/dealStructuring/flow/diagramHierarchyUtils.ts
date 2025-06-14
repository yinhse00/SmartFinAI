
import { TransactionEntity, AnyTransactionRelationship } from "@/types/transactionFlow";

/**
 * Builds a mapping of entity ID to hierarchy depth for vertical positioning.
 * @param entities Full array of entities in the diagram section (before/after)
 * @param relationships Array of { source, target } relationships
 * @returns Map of id => depth (0=top level shareholder, 1=company etc)
 */
export function computeEntityHierarchyLevels(
  entities: TransactionEntity[],
  relationships: AnyTransactionRelationship[]
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
 * A specialized hierarchy computer for the "After" transaction view.
 * It ensures that all owners of the target company are aligned at the same vertical level,
 * and the target company is placed directly below them, without being hardcoded.
 * @param entities Full array of entities in the diagram section.
 * @param relationships Array of relationships for the section.
 * @returns Map of entity id => hierarchy depth.
 */
export function computeAfterHierarchyWithTargetLogic(
  entities: TransactionEntity[],
  relationships: AnyTransactionRelationship[]
): Map<string, number> {
  // Start with a baseline hierarchy using the generic algorithm.
  const levels = computeEntityHierarchyLevels(entities, relationships);

  const target = entities.find(e => e.type === 'target');
  if (!target) {
    return levels; // No target found, no special logic needed.
  }

  const ownershipRels = relationships.filter(r => r.type === 'ownership');
  
  // Find all direct owners of the target company.
  const targetOwners = ownershipRels
    .filter(r => r.target === target.id)
    .map(r => r.source);
  
  // If there are less than two owners, the default layout is likely fine.
  if (targetOwners.length < 2) {
    return levels;
  }

  // Find the 'highest' level (i.e., smallest level number) among all owners.
  // This establishes the baseline for alignment.
  let highestOwnerLevel = Infinity;
  targetOwners.forEach(ownerId => {
    const level = levels.get(ownerId);
    if (level !== undefined && level < highestOwnerLevel) {
      highestOwnerLevel = level;
    }
  });

  // Fallback if no owner levels could be determined.
  if (highestOwnerLevel === Infinity) {
    const buyer = entities.find(e => e.type === 'buyer' || e.type === 'parent');
    highestOwnerLevel = (buyer && levels.get(buyer.id)) ?? 0;
  }

  // --- Apply Alignment Logic ---

  // 1. Align all owners of the target to the same `highestOwnerLevel`.
  targetOwners.forEach(ownerId => levels.set(ownerId, highestOwnerLevel));
  
  // 2. Place the target one level below its owners.
  const newTargetLevel = highestOwnerLevel + 1;
  levels.set(target.id, newTargetLevel);

  // 3. Propagate level changes downwards from the target to its own children/subsidiaries.
  const queue: { id: string; level: number }[] = [{ id: target.id, level: newTargetLevel }];
  const visited = new Set<string>([target.id]);

  while(queue.length > 0) {
    const { id, level } = queue.shift()!;
    const children = relationships.filter(r => r.source === id).map(r => r.target);
    for (const childId of children) {
      if (!visited.has(childId)) {
        visited.add(childId);
        levels.set(childId, level + 1);
        queue.push({ id: childId, level: level + 1 });
      }
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
