
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { generateEntityId, identifyAcquirer } from './entityHelpers';
import { addCorporateChildren, AnyTransactionRelationship } from './corporateStructureProcessor'; // Ensure AnyTransactionRelationship is exported or defined

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

  // 1. Target Company (now acquired)
  const targetId = generateEntityId('target', entityNames.targetCompanyName, prefix);
  entities.push({
    id: targetId,
    name: entityNames.targetCompanyName,
    type: 'target', // Still 'target' type, but its relationships define its new status
    description: 'Target Company (Post-Transaction, Acquired)',
  });
  const targetCorpEntityData = Array.from(corporateStructureMap.values()).find(ce => ce.name === entityNames.targetCompanyName);
  if (targetCorpEntityData) {
      // Add children of the target (its original subsidiaries, now part of acquirer's group via target)
      addCorporateChildren(targetCorpEntityData, targetId, entities, relationships, corporateStructureMap, prefix, visitedChildren);
  }


  // 2. Acquiring Company and its structure
  const acquirerName = entityNames.acquiringCompanyName;
  const acquirerCorpEntityData = Array.from(corporateStructureMap.values()).find(ce => ce.name === acquirerName);
  
  let acquirerId: string;
  let acquirerDiagramType: TransactionEntity['type'] = 'buyer'; // Default for acquirer

  if (acquirerCorpEntityData) {
    if (acquirerCorpEntityData.type === 'issuer') acquirerDiagramType = 'parent'; // An issuer as main acquirer node can be 'parent'
    else if (acquirerCorpEntityData.type === 'parent') acquirerDiagramType = 'parent';
    else acquirerDiagramType = 'buyer'; // Default to buyer
    
    acquirerId = generateEntityId(acquirerDiagramType, acquirerName, prefix);
    if (!entities.find(e => e.id === acquirerId)) {
      entities.push({
        id: acquirerId,
        name: acquirerName,
        type: acquirerDiagramType,
        description: `Acquiring Entity (${acquirerCorpEntityData.type} in source)`,
      });
    }
    // Add children (subsidiaries) of the Acquirer
    addCorporateChildren(acquirerCorpEntityData, acquirerId, entities, relationships, corporateStructureMap, prefix, new Set(visitedChildren));
    // Add parents (owners) of the Acquirer
    addAncestors(acquirerCorpEntityData, acquirerId, entities, relationships, corporateStructureMap, prefix, new Set(visitedAncestry));
  } else {
    // Standalone acquirer if not in corporate map but named
    acquirerId = generateEntityId('buyer', acquirerName, prefix);
    if (!entities.find(e => e.id === acquirerId)) {
      entities.push({
        id: acquirerId,
        name: acquirerName,
        type: 'buyer',
        description: 'Acquiring Entity',
      });
    }
  }

  // 3. Link Acquirer to Target
  const acquiredPercentage = results.dealEconomics?.targetPercentage || 100;
  relationships.push({
    source: acquirerId,
    target: targetId,
    type: 'ownership', // Or 'control'
    percentage: acquiredPercentage,
  });

  // 4. Handle remaining shareholders of the Target (if not 100% acquisition)
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
    });
  }
  
  // 5. Add Consideration
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
    relationships.push({
      source: acquirerId, // Consideration flows from the main acquiring entity
      target: considerationId,
      type: 'consideration',
      value: considerationAmount,
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

  console.log(`After Structure (Revamped): Entities - ${entities.length}, Relationships - ${relationships.length}`);
  entities.forEach(e => console.log(`After Entity: ${e.id} (${e.type}) Name: ${e.name}`));
  relationships.forEach(r => console.log(`After Relationship: ${r.source} -> ${r.target} (${r.type})`));
  return { entities, relationships };
};
