import { CorporateEntity } from '@/types/dealStructuring';
import { TransactionEntity, TransactionFlow } from '@/types/transactionFlow';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { generateEntityId } from './entityHelpers';

// Ensure this type is exported
export type AnyTransactionRelationship = TransactionFlow['before']['relationships'][0] | TransactionFlow['after']['relationships'][0];

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
