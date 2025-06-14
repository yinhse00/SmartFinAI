import { CorporateEntity } from '@/types/dealStructuring';
import { TransactionEntity, TransactionFlow } from '@/types/transactionFlow';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults'; // Added for type
import { generateEntityId } from './entityHelpers';

export type AnyTransactionRelationship = TransactionFlow['before']['relationships'][0] | TransactionFlow['after']['relationships'][0];

export const processCorporateStructure = (
  corporateStructureData?: AnalysisResults['corporateStructure'] // Corrected parameter type
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
  parentCorpEntity: CorporateEntity & { children?: string[] },
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
    if (childCorpEntity) {
      // Ensure childCorpEntity.type is a valid TransactionEntity['type']
      // Mapping 'issuer' to 'subsidiary' or another valid type if necessary
      let childEntityType = childCorpEntity.type as TransactionEntity['type'];
      if (childCorpEntity.type === 'issuer') { // 'issuer' is not in TransactionEntity['type']
          // Decide on a mapping. 'subsidiary' seems reasonable, or 'parent' if it's a holding co.
          // For now, let's map to 'subsidiary' if it's a child.
          // Or, more generically, use 'parent' if it can act as one, otherwise 'subsidiary'.
          // This mapping depends on the context which is not fully available here.
          // A safer bet might be to ensure 'issuer' is added to TransactionEntityType or handled by caller.
          // The original code did `acquirerCorpEntityFromMap.type as TransactionEntity['type']`
          // which could lead to runtime errors if `acquirerCorpEntityFromMap.type` was 'issuer'.
          // Let's be explicit:
          if (childEntityType === 'issuer') childEntityType = 'subsidiary'; // Default mapping for now
      }


      const childEntityId = generateEntityId(childEntityType, childCorpEntity.name, prefix);
      
      if (!entities.find(e => e.id === childEntityId)) {
        entities.push({
          id: childEntityId,
          name: childCorpEntity.name,
          type: childEntityType, // Use the mapped type
          description: `${childCorpEntity.type} of ${parentCorpEntity.name}`, // Original type for description
        });
      }
      relationships.push({
        source: parentElementId,
        target: childEntityId,
        type: 'control', // Or 'subsidiary' depending on context
      } as AnyTransactionRelationship); // Cast to ensure compatibility, 'control' is common
      // Recursively add children of this child
      addCorporateChildren(childCorpEntity, childEntityId, entities, relationships, corporateStructureMap, prefix, visited);
    }
  });
};
