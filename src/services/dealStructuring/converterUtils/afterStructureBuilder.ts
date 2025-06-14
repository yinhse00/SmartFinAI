
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { generateEntityId, identifyAcquirer } from './entityHelpers';
import { addCorporateChildren } from './corporateStructureProcessor';

export const buildAfterStructure = (
  results: AnalysisResults,
  entityNames: { targetCompanyName: string; acquiringCompanyName: string },
  corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>,
  considerationAmount: number
): TransactionFlow['after'] => {
  const entities: TransactionEntity[] = [];
  const relationships: TransactionFlow['after']['relationships'] = [];
  const prefix = 'after';

  const targetId = generateEntityId('target', entityNames.targetCompanyName, prefix);
  entities.push({
    id: targetId,
    name: entityNames.targetCompanyName,
    type: 'target',
    description: 'Target Company (Post-Transaction)',
  });

  if (results.shareholding?.after && results.shareholding.after.length > 0) {
    results.shareholding.after.forEach((holder) => {
      const isAcquirer = identifyAcquirer(holder, results, entityNames.acquiringCompanyName);
      const entityType = isAcquirer ? 'buyer' : 'stockholder';
      const shareholderId = generateEntityId(entityType, holder.name, prefix);

      if (!entities.find(e => e.id === shareholderId)) {
        entities.push({
          id: shareholderId,
          name: holder.name,
          type: entityType,
          percentage: holder.percentage,
          description: `${holder.percentage}% ${isAcquirer ? 'New Owner' : 'Continuing Shareholder'}`,
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
    const acquirerId = generateEntityId('buyer', entityNames.acquiringCompanyName, prefix);
    const acquiredPercentage = results.dealEconomics?.targetPercentage || 100;

    if (!entities.find(e => e.id === acquirerId)) {
      entities.push({
        id: acquirerId,
        name: entityNames.acquiringCompanyName,
        type: 'buyer',
        percentage: acquiredPercentage,
        description: `${acquiredPercentage}% New Owner`,
      });
    }
    relationships.push({
      source: acquirerId,
      target: targetId,
      type: 'ownership',
      percentage: acquiredPercentage,
    });

    if (acquiredPercentage < 100) {
      const remainingShareholderId = generateEntityId('stockholder', 'RemainingShareholders', prefix);
      if (!entities.find(e => e.id === remainingShareholderId)) {
        entities.push({
          id: remainingShareholderId,
          name: "Remaining Original Shareholders",
          type: "stockholder",
          percentage: 100 - acquiredPercentage,
          description: `${100 - acquiredPercentage}% ownership`
        });
      }
      relationships.push({
        source: remainingShareholderId,
        target: targetId,
        type: "ownership",
        percentage: 100 - acquiredPercentage
      });
    }
  }

  const acquirerCorpEntityFromMap = Array.from(corporateStructureMap.values()).find(ce => ce.name === entityNames.acquiringCompanyName);
  const acquirerEntityNode = entities.find(e => e.name === entityNames.acquiringCompanyName && e.type === 'buyer');

  if (acquirerCorpEntityFromMap && acquirerEntityNode) {
    addCorporateChildren(acquirerCorpEntityFromMap, acquirerEntityNode.id, entities, relationships, corporateStructureMap, prefix, new Set());
  }

  if (considerationAmount > 0) {
    const considerationId = generateEntityId('consideration', `Payment-${(considerationAmount / 1000000).toFixed(0)}M`, prefix);
    entities.push({
      id: considerationId,
      name: `${results.dealEconomics?.currency || 'HKD'} ${(considerationAmount / 1000000).toFixed(0)}M`,
      type: 'consideration',
      value: considerationAmount,
      currency: results.dealEconomics?.currency || 'HKD',
      description: 'Transaction Consideration',
    });

    const mainBuyer = entities.find(e => e.type === 'buyer');
    if (mainBuyer) {
      relationships.push({
        source: mainBuyer.id,
        target: considerationId,
        type: 'consideration',
        value: considerationAmount,
      });
    }
  }

  console.log(`After Structure: Entities - ${entities.length}, Relationships - ${relationships.length}`);
  return { entities, relationships };
};
