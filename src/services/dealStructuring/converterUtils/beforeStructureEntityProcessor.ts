
import { TransactionEntity, AnyTransactionRelationship } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { EntityNames, generateEntityId } from './entityHelpers';
import { addCorporateChildren } from './corporateStructureProcessor';

type CorporateStructureMap = Map<string, CorporateEntity & { children?: string[], parentLink?: string }>;

// Helper function to add parent hierarchy for a given entity
export const addAncestors = (
  corpEntity: CorporateEntity & { parentLink?: string },
  entityIdInDiagram: string,
  entities: TransactionEntity[],
  relationships: AnyTransactionRelationship[],
  corporateStructureMap: CorporateStructureMap,
  prefix: string,
  visited: Set<string>,
  entitySide: 'acquirer' | 'target'
): void => {
  if (!corpEntity.parentLink || visited.has(corpEntity.id + '-ancestors')) {
    return;
  }
  visited.add(corpEntity.id + '-ancestors');

  let currentCorpParentId = corpEntity.parentLink;
  let childNodeIdForParentLink = entityIdInDiagram;

  while (currentCorpParentId) {
    const parentCorpData = corporateStructureMap.get(currentCorpParentId);
    if (parentCorpData && !visited.has(parentCorpData.id)) {
      visited.add(parentCorpData.id);

      let parentEntityType = parentCorpData.type as TransactionEntity['type'];
      if (parentCorpData.type === 'issuer' && prefix === 'before') {
          parentEntityType = 'parent';
      } else if (parentCorpData.type === 'issuer') {
          parentEntityType = 'buyer';
      }

      const parentEntityId = generateEntityId(parentEntityType, parentCorpData.name, prefix);
      if (!entities.find(e => e.id === parentEntityId)) {
        entities.push({
          id: parentEntityId,
          name: parentCorpData.name,
          type: parentEntityType,
          description: `${parentCorpData.type} of ${entities.find(e => e.id === childNodeIdForParentLink)?.name || corpEntity.name}`,
        });
      }
      relationships.push({
        source: parentEntityId,
        target: childNodeIdForParentLink,
        type: 'ownership',
      } as AnyTransactionRelationship);

      childNodeIdForParentLink = parentEntityId;
      currentCorpParentId = parentCorpData.parentLink;
    } else {
      currentCorpParentId = undefined;
    }
  }
};

export const createAcquirerEntity = (
  entityNames: EntityNames,
  corporateStructureMap: CorporateStructureMap,
  prefix: string,
  entities: TransactionEntity[],
  relationships: AnyTransactionRelationship[],
  acquirerVisitedAncestry: Set<string>,
  acquirerVisitedChildren: Set<string>,
  acquirerEntityIds: Set<string>
): string => {
  const acquirerCorpEntityData = Array.from(corporateStructureMap.values()).find(
    ce => ce.name === entityNames.acquiringCompanyName && (ce.type === 'issuer' || ce.type === 'parent')
  );

  let acquirerRootId: string;
  let acquirerDiagramType: TransactionEntity['type'] = 'parent';

  if (acquirerCorpEntityData) {
    acquirerDiagramType = (entityNames.isAcquirerListed || acquirerCorpEntityData.type === 'issuer') ? 'parent' : 'buyer';
    acquirerRootId = generateEntityId(acquirerDiagramType, acquirerCorpEntityData.name, prefix);
    acquirerEntityIds.add(acquirerRootId);

    if (!entities.find(e => e.id === acquirerRootId)) {
      entities.push({
        id: acquirerRootId,
        name: acquirerCorpEntityData.name,
        type: acquirerDiagramType,
        description: `Acquiring Company Root (${acquirerCorpEntityData.type} in CS)`,
      });
    }
    
    addAncestors(acquirerCorpEntityData, acquirerRootId, entities, relationships, corporateStructureMap, prefix, acquirerVisitedAncestry, 'acquirer');
    addCorporateChildren(acquirerCorpEntityData, acquirerRootId, entities, relationships, corporateStructureMap, prefix, acquirerVisitedChildren);

    // Track all acquirer-related entities
    entities.forEach(e => {
      if (e.id.includes(acquirerCorpEntityData.name.toLowerCase().replace(/\s+/g, '-')) || 
          e.description?.includes(acquirerCorpEntityData.name)) {
        acquirerEntityIds.add(e.id);
      }
    });

  } else if (entityNames.acquiringCompanyName && entityNames.acquiringCompanyName !== 'Acquiring Company') {
    acquirerDiagramType = entityNames.isAcquirerListed ? 'parent' : 'buyer';
    acquirerRootId = generateEntityId(acquirerDiagramType, entityNames.acquiringCompanyName, prefix);
    acquirerEntityIds.add(acquirerRootId);
    
    if (!entities.find(e => e.id === acquirerRootId)) {
      entities.push({
        id: acquirerRootId,
        name: entityNames.acquiringCompanyName,
        type: acquirerDiagramType,
        description: 'Acquiring Company (not in CS map)',
      });
    }
  } else {
    acquirerRootId = generateEntityId('buyer', 'Acquiring Company', prefix);
    acquirerEntityIds.add(acquirerRootId);
    if (!entities.find(e => e.id === acquirerRootId)) {
      entities.push({
        id: acquirerRootId,
        name: 'Acquiring Company',
        type: 'buyer',
        description: 'Default Acquiring Company',
      });
    }
  }

  return acquirerRootId;
};

export const createTargetEntity = (
  entityNames: EntityNames,
  corporateStructureMap: CorporateStructureMap,
  prefix: string,
  entities: TransactionEntity[],
  relationships: AnyTransactionRelationship[],
  targetVisitedAncestry: Set<string>,
  targetVisitedChildren: Set<string>,
  targetEntityIds: Set<string>
): string => {
  const targetCorpEntityData = Array.from(corporateStructureMap.values()).find(
    ce => ce.name === entityNames.targetCompanyName && ce.type === 'target'
  );

  const targetId = generateEntityId('target', entityNames.targetCompanyName, prefix);
  targetEntityIds.add(targetId);
  
  if (!entities.find(e => e.id === targetId)) {
    entities.push({
      id: targetId,
      name: entityNames.targetCompanyName,
      type: 'target',
      description: 'Target Company (Pre-Transaction)',
    });
  }

  if (targetCorpEntityData) {
    addAncestors(targetCorpEntityData, targetId, entities, relationships, corporateStructureMap, prefix, targetVisitedAncestry, 'target');
    addCorporateChildren(targetCorpEntityData, targetId, entities, relationships, corporateStructureMap, prefix, targetVisitedChildren);
    
    // Track target-related entities
    entities.forEach(e => {
      if (e.id.includes(entityNames.targetCompanyName.toLowerCase().replace(/\s+/g, '-')) || 
          e.description?.includes(entityNames.targetCompanyName)) {
        targetEntityIds.add(e.id);
      }
    });
  }

  return targetId;
};
