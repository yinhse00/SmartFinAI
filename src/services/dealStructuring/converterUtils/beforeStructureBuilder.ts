import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { generateEntityId } from './entityHelpers';
import { addCorporateChildren } from './corporateStructureProcessor';

export const buildBeforeStructure = (
  results: AnalysisResults,
  entityNames: { targetCompanyName: string; acquiringCompanyName: string },
  corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>
): TransactionFlow['before'] => {
  const entities: TransactionEntity[] = [];
  const relationships: TransactionFlow['before']['relationships'] = [];
  const prefix = 'before';

  const targetId = generateEntityId('target', entityNames.targetCompanyName, prefix);
  entities.push({
    id: targetId,
    name: entityNames.targetCompanyName,
    type: 'target',
    description: 'Target Company (Pre-Transaction)',
  });

  if (results.shareholding?.before && results.shareholding.before.length > 0) {
    results.shareholding.before.forEach((holder) => {
      const shareholderId = generateEntityId('stockholder', holder.name, prefix);
      if (!entities.find(e => e.id === shareholderId)) {
        entities.push({
          id: shareholderId,
          name: holder.name,
          type: 'stockholder',
          percentage: holder.percentage,
          description: `${holder.percentage}% Shareholder`,
        });
      }
      relationships.push({
        source: shareholderId,
        target: targetId,
        type: 'ownership',
        percentage: holder.percentage,
      });
    });
  } else {
    const genericShareholderId = generateEntityId('stockholder', 'ExistingShareholders', prefix);
    entities.push({
      id: genericShareholderId,
      name: 'Existing Shareholders',
      type: 'stockholder',
      percentage: 100,
      description: '100% collective ownership',
    });
    relationships.push({
      source: genericShareholderId,
      target: targetId,
      type: 'ownership',
      percentage: 100,
    });
  }

  const acquirerCorpEntityFromMap = Array.from(corporateStructureMap.values()).find(
    ce => ce.name === entityNames.acquiringCompanyName
  );

  if (acquirerCorpEntityFromMap) {
    let acquirerEntityType = acquirerCorpEntityFromMap.type as TransactionEntity['type'];
    if (acquirerCorpEntityFromMap.type === 'issuer') {
      acquirerEntityType = 'parent'; // Assuming an issuer acting as acquirer root is a parent-like entity
    }
    const acquirerRootId = generateEntityId(acquirerEntityType, acquirerCorpEntityFromMap.name, prefix);
     if (!entities.find(e => e.id === acquirerRootId)) {
       entities.push({
         id: acquirerRootId,
         name: acquirerCorpEntityFromMap.name,
         type: acquirerEntityType,
         description: `Acquiring Entity Root (${acquirerCorpEntityFromMap.type})`, // Original type in description
       });
    }
    addCorporateChildren(acquirerCorpEntityFromMap, acquirerRootId, entities, relationships, corporateStructureMap, prefix, new Set());
  }

  const targetCorpEntity = Array.from(corporateStructureMap.values()).find(ce => ce.name === entityNames.targetCompanyName && ce.type === 'target');
  if (targetCorpEntity) {
    addCorporateChildren(targetCorpEntity, targetId, entities, relationships, corporateStructureMap, prefix, new Set());
    
    let currentCorpParentId = targetCorpEntity.parentLink;
    let childNodeIdForParentLink = targetId; 
    while(currentCorpParentId) {
        const parentCorpData = corporateStructureMap.get(currentCorpParentId);
        if (parentCorpData) {
            let parentEntityType = parentCorpData.type as TransactionEntity['type'];
            if (parentCorpData.type === 'issuer') {
                parentEntityType = 'parent'; // Or 'subsidiary' if context implies
            }
            const parentEntityId = generateEntityId(parentEntityType, parentCorpData.name, prefix);
             if (!entities.find(e => e.id === parentEntityId)) {
                entities.push({
                    id: parentEntityId,
                    name: parentCorpData.name,
                    type: parentEntityType, 
                    description: `${parentCorpData.type} of ${entities.find(e=>e.id === childNodeIdForParentLink)?.name || 'child'}`,
                });
            }
            relationships.push({
                source: parentEntityId,
                target: childNodeIdForParentLink, 
                type: 'ownership', 
            });
            childNodeIdForParentLink = parentEntityId; 
            currentCorpParentId = parentCorpData.parentLink;
        } else {
            currentCorpParentId = undefined;
        }
    }
  }

  console.log(`Before Structure: Entities - ${entities.length}, Relationships - ${relationships.length}`);
  return { entities, relationships };
};
