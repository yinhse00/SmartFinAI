import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow, ConsiderationRelationship, OwnershipRelationship, AnyTransactionRelationship } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { generateEntityId } from './entityHelpers';
import { addCorporateChildren } from './corporateStructureProcessor';

const addAncestors = (
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


export const buildAfterStructure = (
  results: AnalysisResults,
  entityNames: { targetCompanyName: string; acquiringCompanyName: string },
  corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>,
  considerationAmount: number
): TransactionFlow['after'] => {
  const entities: TransactionEntity[] = [];
  const relationships: TransactionFlow['after']['relationships'] = [];
  const prefix = 'after';
  const visitedAncestry = new Set<string>();
  const visitedChildren = new Set<string>();

  const acquirerName = entityNames.acquiringCompanyName;
  const acquirerCorpEntityData = Array.from(corporateStructureMap.values()).find(ce => ce.name === acquirerName);
  let acquirerId: string;
  let acquirerDiagramType: TransactionEntity['type'] = 'buyer';

  if (acquirerCorpEntityData) {
    acquirerDiagramType = acquirerCorpEntityData.type === 'issuer' || acquirerCorpEntityData.type === 'parent' ? 'parent' : 'buyer';
    acquirerId = generateEntityId(acquirerDiagramType, acquirerName, prefix);
  } else {
    acquirerId = generateEntityId('buyer', acquirerName, prefix);
  }

  // Add acquirer entity
  if (!entities.find(e => e.id === acquirerId)) {
    entities.push({
      id: acquirerId,
      name: acquirerName,
      type: acquirerDiagramType,
      description: `Acquiring Entity${acquirerCorpEntityData ? ` (${acquirerCorpEntityData.type} in source)` : ''}`,
    });
  }

  const paymentStructure = results.structure?.majorTerms?.paymentStructure;
  const stockPaymentPercentage = paymentStructure?.stockPercentage || 0;
  const purchasePrice = results.dealEconomics?.purchasePrice || considerationAmount || 0;

  // Handle Acquirer's Shareholders (Original shareholders before new equity issuance for target)
  const acquirerOriginalShareholders = results.shareholdingChanges?.before || results.shareholding?.after || [];

  if (acquirerOriginalShareholders.length > 0) {
    acquirerOriginalShareholders.forEach((holder) => {
      if (holder.name.toLowerCase() !== acquirerName.toLowerCase() && holder.name.toLowerCase() !== entityNames.targetCompanyName.toLowerCase()) {
        const shareholderId = generateEntityId('stockholder', holder.name, prefix);
        let description = `${holder.percentage}% Shareholder of ${acquirerName} (pre-new equity for target)`;
        if (stockPaymentPercentage > 0) {
          description += ` (Note: Subject to dilution from new equity issuance to target sellers.)`;
        }
        
        if (!entities.find(e => e.id === shareholderId)) {
          entities.push({
            id: shareholderId,
            name: holder.name,
            type: 'stockholder',
            percentage: holder.percentage,
            description: description,
          });
        }
        relationships.push({
          source: shareholderId,
          target: acquirerId,
          type: 'ownership',
          percentage: holder.percentage,
        } as OwnershipRelationship);
      }
    });
  }

  if (stockPaymentPercentage > 0 && purchasePrice > 0) {
    console.log(`Stock consideration payment detected: ${stockPaymentPercentage}% of deal value.`);
    const stockRecipientName = `Target Sellers (Equity Recipient in ${acquirerName})`;
    const stockRecipientId = generateEntityId('stockholder', stockRecipientName, prefix);
    if (!entities.find(e => e.id === stockRecipientId)) {
      entities.push({
        id: stockRecipientId,
        name: stockRecipientName,
        type: 'stockholder',
        description: `Former target shareholders who received ${stockPaymentPercentage}% of deal consideration in ${acquirerName} stock.`,
      });
    }
    relationships.push({
      source: stockRecipientId,
      target: acquirerId,
      type: 'ownership',
      label: `${stockPaymentPercentage}% of consideration as stock`,
    } as OwnershipRelationship);
  }
  
  if (acquirerCorpEntityData) {
    addCorporateChildren(acquirerCorpEntityData, acquirerId, entities, relationships, corporateStructureMap, prefix, new Set(visitedChildren));
    addAncestors(acquirerCorpEntityData, acquirerId, entities, relationships, corporateStructureMap, prefix, new Set(visitedAncestry));
  }

  const targetId = generateEntityId('target', entityNames.targetCompanyName, prefix);
  if (!entities.find(e => e.id === targetId)) {
    entities.push({
      id: targetId,
      name: entityNames.targetCompanyName,
      type: 'target', 
      description: 'Target Company (Post-Transaction, Acquired)',
    });
  }
  const targetCorpEntityData = Array.from(corporateStructureMap.values()).find(ce => ce.name === entityNames.targetCompanyName);
  if (targetCorpEntityData) {
      addCorporateChildren(targetCorpEntityData, targetId, entities, relationships, corporateStructureMap, prefix, visitedChildren);
  }

  const acquiredPercentage = results.dealEconomics?.targetPercentage || 100;
  relationships.push({
    source: acquirerId,
    target: targetId,
    type: 'ownership',
    percentage: acquiredPercentage,
  } as OwnershipRelationship);

  if (acquiredPercentage < 100) {
    const remainingOriginalShareholderId = generateEntityId('stockholder', `Remaining Shareholders of ${entityNames.targetCompanyName}`, prefix);
    if (!entities.find(e => e.id === remainingOriginalShareholderId)) {
      entities.push({
        id: remainingOriginalShareholderId,
        name: `Remaining Original Shareholders of ${entityNames.targetCompanyName}`,
        type: 'stockholder',
        percentage: 100 - acquiredPercentage,
        description: `${100 - acquiredPercentage}% continuing ownership in Target`,
      });
    }
    relationships.push({
      source: remainingOriginalShareholderId,
      target: targetId,
      type: 'ownership',
      percentage: 100 - acquiredPercentage,
    } as OwnershipRelationship);
  }
  
  let cashConsiderationAmount = considerationAmount;
  if (stockPaymentPercentage > 0 && stockPaymentPercentage < 100 && purchasePrice > 0) {
    cashConsiderationAmount = purchasePrice * ((100 - stockPaymentPercentage) / 100);
  } else if (stockPaymentPercentage === 100) {
    cashConsiderationAmount = 0; // All stock
  }

  if (cashConsiderationAmount > 0) {
    const considerationNodeName = stockPaymentPercentage > 0 && stockPaymentPercentage < 100 ? 
      `Cash Payment (${(cashConsiderationAmount / 1000000).toFixed(0)}M)` :
      `Payment (${(cashConsiderationAmount / 1000000).toFixed(0)}M)`;
    const considerationId = generateEntityId('consideration', considerationNodeName, prefix);
    
    if (!entities.find(e => e.id === considerationId)) {
      entities.push({
        id: considerationId,
        name: `${results.dealEconomics?.currency || 'HKD'} ${(cashConsiderationAmount / 1000000).toFixed(0)}M`,
        type: 'consideration',
        value: cashConsiderationAmount,
        currency: results.dealEconomics?.currency || 'HKD',
        description: stockPaymentPercentage > 0 && stockPaymentPercentage < 100 ? 'Cash portion of Transaction Consideration' : 'Transaction Consideration',
      });
    }
    relationships.push({
      source: acquirerId, 
      target: considerationId,
      type: 'consideration',
      value: cashConsiderationAmount,
    } as ConsiderationRelationship);
  }
  
  console.log(`After Structure (Revamped for Stock Consideration): Entities - ${entities.length}, Relationships - ${relationships.length}`);
  entities.forEach(e => console.log(`After Entity (Stock Consideration Logic): ${e.id} (${e.type}) Name: ${e.name} Desc: ${e.description}`));
  relationships.forEach(r => {
    let labelContent = r.label || '';
    if (r.type === 'ownership' && (r as OwnershipRelationship).percentage !== undefined) {
        labelContent += ` ${(r as OwnershipRelationship).percentage}%`;
    } else if ((r.type === 'consideration' || r.type === 'funding') && (r as ConsiderationRelationship).value !== undefined) {
        labelContent += ` ${(r as ConsiderationRelationship).value}`;
    }
    console.log(`After Relationship (Stock Consideration Logic): ${r.source} -> ${r.target} (${r.type}) Label: ${labelContent}`);
  });
  
  return { entities, relationships };
};
