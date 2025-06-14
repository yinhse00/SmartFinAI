import { CorporateEntity } from '@/types/dealStructuring';
import { TransactionEntity, TransactionFlow } from '@/types/transactionFlow';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { generateEntityId } from './entityHelpers';

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
      let finalChildEntityType: TransactionEntity['type'];

      // childCorpEntity.type can be 'parent', 'subsidiary', 'target', or 'issuer'.
      // We need to map it to a valid TransactionEntity['type'].
      if (childCorpEntity.type === 'issuer') {
        // 'issuer' is not a valid TransactionEntity['type'], so map it.
        // 'subsidiary' is used here as per the previous logic's intent.
        // Depending on context, 'parent' could also be a valid mapping.
        finalChildEntityType = 'subsidiary';
      } else {
        // If childCorpEntity.type is 'parent', 'subsidiary', or 'target',
        // these are already valid TransactionEntity['type']s.
        finalChildEntityType = childCorpEntity.type;
      }
      
      const childEntityId = generateEntityId(finalChildEntityType, childCorpEntity.name, prefix);
      
      if (!entities.find(e => e.id === childEntityId)) {
        entities.push({
          id: childEntityId,
          name: childCorpEntity.name,
          type: finalChildEntityType, // Use the correctly mapped type
          description: `${childCorpEntity.type} of ${parentCorpEntity.name}`, // Original type in description
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
