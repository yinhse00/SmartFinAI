import { CorporateEntity } from '@/types/dealStructuring';
import { TransactionEntity, TransactionFlow, OwnershipRelationship, AnyTransactionRelationship } from '@/types/transactionFlow';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { generateEntityId } from './entityHelpers';

export const processCorporateStructure = (
  corporateStructureData?: AnalysisResults['corporateStructure']
): Map<string, CorporateEntity & { children?: string[], parentLink?: string }> => {
  const structureMap = new Map<string, CorporateEntity & { children?: string[], parentLink?: string }>();
  
  if (!corporateStructureData || !corporateStructureData.entities) {
    console.log('No corporate structure data or entities provided for processing.');
    return structureMap;
  }

  corporateStructureData.entities.forEach(entity => {
    structureMap.set(entity.id, { ...entity, children: [] });
  });

  if (corporateStructureData.relationships) {
    corporateStructureData.relationships.forEach(rel => {
      const parent = structureMap.get(rel.parent);
      const child = structureMap.get(rel.child);
      if (parent) {
        parent.children = parent.children || []; // Ensure children array exists
        parent.children.push(rel.child);
      }
      if (child) {
        child.parentLink = rel.parent;
      }
    });
  }
  
  console.log('Processed Corporate Structure Map:', structureMap);
  return structureMap;
};

export const addCorporateChildren = (
  parentCorpEntity: CorporateEntity & { children?: string[], parentLink?: string },
  parentElementId: string,
  entities: TransactionEntity[],
  relationships: AnyTransactionRelationship[],
  corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>,
  prefix: string,
  visited: Set<string>
): void => {
  if (!parentCorpEntity.children || visited.has(parentCorpEntity.id)) {
    return;
  }
  visited.add(parentCorpEntity.id);

  parentCorpEntity.children.forEach(childId => {
    const childCorpEntity = corporateStructureMap.get(childId);
    if (childCorpEntity && !visited.has(childCorpEntity.id + '-childOf-' + parentCorpEntity.id)) {
      visited.add(childCorpEntity.id + '-childOf-' + parentCorpEntity.id);

      let finalChildEntityType: TransactionEntity['type'];

      if (childCorpEntity.type === 'issuer') {
        finalChildEntityType = 'subsidiary'; // Or 'parent' if it's contextually a holding of the issuer. Defaulting to subsidiary.
      } else {
        finalChildEntityType = childCorpEntity.type;
      }
      
      const childEntityIdInDiagram = generateEntityId(finalChildEntityType, childCorpEntity.name, prefix);
      
      if (!entities.find(e => e.id === childEntityIdInDiagram)) {
        entities.push({
          id: childEntityIdInDiagram,
          name: childCorpEntity.name,
          type: finalChildEntityType, 
          description: `${childCorpEntity.type} of ${parentCorpEntity.name}`, 
        });
      }
      relationships.push({
        source: parentElementId,
        target: childEntityIdInDiagram,
        type: 'control', 
      } as AnyTransactionRelationship); 
      
      // Recursively add children of this child. Pass the same visited set to avoid re-processing within this branch.
      addCorporateChildren(childCorpEntity, childEntityIdInDiagram, entities, relationships, corporateStructureMap, prefix, visited);
    }
  });
};

export const addAncestors = (
  corpEntity: CorporateEntity & { parentLink?: string },
  entityIdInDiagram: string,
  entities: TransactionEntity[],
  relationships: AnyTransactionRelationship[],
  corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>,
  prefix: string,
  visited: Set<string>
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
       // In 'after' structure, if an 'issuer' is an ancestor of the buyer, it's likely a 'parent'
      if (parentCorpData.type === 'issuer') parentEntityType = 'parent';
      
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
      } as OwnershipRelationship);
      childNodeIdForParentLink = parentEntityId;
      currentCorpParentId = parentCorpData.parentLink;
    } else {
      currentCorpParentId = undefined;
    }
  }
};
