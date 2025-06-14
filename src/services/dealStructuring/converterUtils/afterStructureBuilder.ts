import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { generateEntityId, identifyAcquirer } from './entityHelpers';
import { addCorporateChildren, AnyTransactionRelationship } from './corporateStructureProcessor'; 

// Re-define or import addAncestors if it's not globally available from beforeStructureBuilder
// For simplicity, assuming it might be needed here too.
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
      } as AnyTransactionRelationship);

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
  const stockConsiderationValue = purchasePrice * (stockPaymentPercentage / 100);

  // Handle Acquirer's Shareholders
  // If stock payment is involved, original shareholders are potentially diluted,
  // and new shareholders (recipients of stock) may be created.
  if (results.shareholding?.before && results.shareholding.before.length > 0) {
    results.shareholding.before.forEach((holder) => {
      // Assuming results.shareholding.before contains shareholders of the acquirer entity.
      // This is a simplification; ideally, we'd have a clear list of acquirer's pre-deal shareholders.
      // For this example, we'll filter out the target and acquirer themselves if they appear in this list.
      if (holder.name.toLowerCase() !== acquirerName.toLowerCase() && holder.name.toLowerCase() !== entityNames.targetCompanyName.toLowerCase()) {
        const shareholderId = generateEntityId('stockholder', holder.name, prefix);
        let description = `${holder.percentage}% Continuing Shareholder of ${acquirerName}`;
        if (stockPaymentPercentage > 0) {
          description += ` (Note: Original percentage shown; actual may be diluted due to stock issuance. Precise dilution calculation requires pre-deal acquirer valuation.)`;
        }
        
        if (!entities.find(e => e.id === shareholderId)) {
          entities.push({
            id: shareholderId,
            name: holder.name,
            type: 'stockholder',
            percentage: holder.percentage, // Displaying original percentage
            description: description,
          });
        }
        relationships.push({
          source: shareholderId,
          target: acquirerId,
          type: 'ownership',
          percentage: holder.percentage, // Displaying original percentage
        });
      }
    });
  }

  if (stockPaymentPercentage > 0 && stockConsiderationValue > 0) {
    console.log(`Stock consideration detected: ${stockConsiderationValue}. Adding entity for stock recipients.`);
    const stockRecipientName = `Target Sellers (Equity Recipient)`;
    const stockRecipientId = generateEntityId('stockholder', stockRecipientName, prefix);
    if (!entities.find(e => e.id === stockRecipientId)) {
      entities.push({
        id: stockRecipientId,
        name: stockRecipientName,
        type: 'stockholder',
        // Percentage of acquirer owned by these new shareholders is complex to calculate without acquirer's pre-deal valuation.
        // For diagrammatic purposes, we show them as linked. Their actual % ownership of the acquirer is not easily determined here.
        description: `Represents former target shareholders who received ${stockPaymentPercentage}% of consideration in ${acquirerName} stock. Actual % ownership of ${acquirerName} depends on relative valuations.`,
      });
    }
    relationships.push({
      source: stockRecipientId,
      target: acquirerId,
      type: 'ownership', // They now own part of the acquirer
      // Percentage label for this edge would ideally be calculated.
      // e.g., (stockConsiderationValue / (AcquirerPreDealValuation + stockConsiderationValue)) * 100
      // Since AcquirerPreDealValuation is unknown, we cannot set an accurate percentage here.
      label: `Received ${stockPaymentPercentage}% of consideration as stock`,
    });
  }
  
  // Add children (subsidiaries) of the Acquirer
  if (acquirerCorpEntityData) {
    addCorporateChildren(acquirerCorpEntityData, acquirerId, entities, relationships, corporateStructureMap, prefix, new Set(visitedChildren));
    // Add parents (owners) of the Acquirer - this should now reflect the potentially new structure
    addAncestors(acquirerCorpEntityData, acquirerId, entities, relationships, corporateStructureMap, prefix, new Set(visitedAncestry));
  }


  // 2. Target Company (now acquired)
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

  // 3. Link Acquirer to Target
  const acquiredPercentage = results.dealEconomics?.targetPercentage || 100;
  relationships.push({
    source: acquirerId,
    target: targetId,
    type: 'ownership',
    percentage: acquiredPercentage,
  });

  // 4. Handle remaining shareholders of the Target (if not 100% acquisition AND no stock swap for them)
  // This logic might need to be smarter if target shareholders received acquirer stock.
  // For now, this handles cases where a portion of target remains independently owned.
  if (acquiredPercentage < 100) {
    // Only add remaining shareholders of target if they didn't become acquirer's shareholders via stock swap.
    // This is a complex interaction. If stockConsiderationValue > 0, it's assumed Target Sellers got Acquirer stock.
    // So, they wouldn't also be "Remaining Original Shareholders of Target" in the same way.
    // This block might be redundant if stock swap covers all selling shareholders.
    // For simplicity, if stock payment is made, we assume it covers the sellers,
    // and any remaining % is a distinct group.
    
    // A more robust way would be to check if the `stockRecipientName` entity already represents these.
    // For now, we'll keep it, but it could lead to double representation if not careful.
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
    });
  }
  
  // 5. Add Consideration entity (cash portion, or total if no stock breakdown)
  let cashConsiderationAmount = considerationAmount;
  if (stockPaymentPercentage > 0 && stockPaymentPercentage < 100) {
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
    });
  }
  
  // Remove direct shareholders of Target from `results.shareholding.after` if they are now shareholders of the Acquirer
  // The current model assumes `results.shareholding.after` shows direct shareholders of the TARGET.
  // If "Listed Company" (acquirerId) buys 100%, then `results.shareholding.after` should ideally show "Listed Company" 100%.
  // The owners of "Listed Company" are handled by addAncestors for the acquirer.
  // The old logic iterated results.shareholding.after:
  /*
    if (results.shareholding?.after && results.shareholding.after.length > 0) {
        results.shareholding.after.forEach((holder) => {
            // THIS LOGIC IS PROBLEMATIC if holder is "Shareholder A" but acquirer is "Listed Company"
            // It would incorrectly link "Shareholder A" directly to Target.
            // We need to ensure that only the true new owner (Listed Company) or remaining minority shareholders of Target are processed here.
            const isTheActualAcquirerEntity = holder.name === acquirerName; // Check if this shareholder IS the acquirer itself

            if (isTheActualAcquirerEntity) {
                // This is handled by the Acquirer -> Target link already. Avoid duplication.
            } else { // This must be a remaining minority shareholder of the Target.
                const stockholderId = generateEntityId('stockholder', holder.name, prefix);
                if (!entities.find(e => e.id === stockholderId)) {
                    entities.push({
                        id: stockholderId,
                        name: holder.name,
                        type: 'stockholder',
                        percentage: holder.percentage,
                        description: `${holder.percentage}% Continuing Shareholder in Target`,
                    });
                }
                relationships.push({
                    source: stockholderId,
                    target: targetId,
                    type: 'ownership',
                    percentage: holder.percentage,
                });
            }
        });
    }
  */
  // The primary link Acquirer -> Target with percentage, and the 'Remaining Shareholders' logic above,
  // should cover the ownership of the target post-acquisition.
  // We trust `addAncestors` for the Acquirer to correctly show its own shareholder structure.

  console.log(`After Structure (Revamped for Stock Consideration): Entities - ${entities.length}, Relationships - ${relationships.length}`);
  entities.forEach(e => console.log(`After Entity (Stock Consideration Logic): ${e.id} (${e.type}) Name: ${e.name} Desc: ${e.description}`));
  relationships.forEach(r => console.log(`After Relationship (Stock Consideration Logic): ${r.source} -> ${r.target} (${r.type}) Label: ${r.label || r.percentage || r.value}`));
  
  return { entities, relationships };
};
