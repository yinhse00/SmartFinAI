import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionEntity, TransactionFlow } from '@/types/transactionFlow';
import { CorporateEntity } from '@/types/dealStructuring';
import { generateEntityId, extractEntityNames } from './entityHelpers';
import { addCorporateChildren, AnyTransactionRelationship } from './corporateStructureProcessor';

// Helper function to add parent hierarchy for a given entity
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
      visited.add(parentCorpData.id); // Mark general visit to avoid re-processing this node if it appears elsewhere

      let parentEntityType = parentCorpData.type as TransactionEntity['type'];
      if (parentCorpData.type === 'issuer' && prefix === 'before') { // An issuer is often a root, consider it 'parent' type in diagram
          parentEntityType = 'parent';
      } else if (parentCorpData.type === 'issuer') { // For 'after', issuer acting as buyer could be 'buyer'
          parentEntityType = 'buyer'; // Or stick to 'parent' if it's the ultimate parent
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
        type: 'ownership', // Assuming parent link implies ownership/control
      } as AnyTransactionRelationship);

      childNodeIdForParentLink = parentEntityId;
      currentCorpParentId = parentCorpData.parentLink; // Move to the next ancestor
    } else {
      currentCorpParentId = undefined; // Stop if no parent data or already visited this path
    }
  }
};


export const buildBeforeStructure = (
  results: AnalysisResults,
  corporateStructureMap: Map<string, CorporateEntity & { children?: string[], parentLink?: string }>
): TransactionFlow['before'] => {
  const entities: TransactionEntity[] = [];
  const relationships: TransactionFlow['before']['relationships'] = [];
  const prefix = 'before';
  const visitedAncestry = new Set<string>();
  const visitedChildren = new Set<string>();

  const entityNames = extractEntityNames(results); // Contains targetCompanyName, acquiringCompanyName, and isAcquirerListed

  // 1. Process Acquirer Company (Listed Company) and its shareholders first
  const acquirerCorpEntityData = Array.from(corporateStructureMap.values()).find(
    ce => ce.name === entityNames.acquiringCompanyName && (ce.type === 'issuer' || ce.type === 'parent')
  );

  let acquirerRootId: string;
  let acquirerDiagramType: TransactionEntity['type'] = 'parent'; // Default for a corporate acquirer

  if (acquirerCorpEntityData) {
    acquirerDiagramType = (acquirerCorpEntityData.type === 'issuer' || entityNames.isAcquirerListed) ? 'parent' : 'buyer';
    acquirerRootId = generateEntityId(acquirerDiagramType, acquirerCorpEntityData.name, prefix);

    if (!entities.find(e => e.id === acquirerRootId)) {
      entities.push({
        id: acquirerRootId,
        name: acquirerCorpEntityData.name,
        type: acquirerDiagramType,
        description: `Acquiring Company Root (${acquirerCorpEntityData.type} in CS)`,
      });
    }
    // Add ancestors (shareholders of Acquirer) if not detailed in shareholding.before specifically for acquirer
    // This part is tricky because shareholding.before is typically for the *Target*.
    // If the acquirer (Listed Co) has its own shareholders defined in corporate structure, addAncestors might pick them up.
    // For now, we assume `results.shareholding.before` is about the Target.
    // If `results.shareholding.before` actually contains shareholders of "Listed Company", this logic needs adjustment.
    // Current assumption: ListedCo's shareholders are not in `results.shareholding.before` directly.
    // They would be parent links in `corporateStructureMap`.
    addAncestors(acquirerCorpEntityData, acquirerRootId, entities, relationships, corporateStructureMap, prefix, visitedAncestry);
    addCorporateChildren(acquirerCorpEntityData, acquirerRootId, entities, relationships, corporateStructureMap, prefix, visitedChildren);

  } else if (entityNames.acquiringCompanyName && entityNames.acquiringCompanyName !== 'Acquiring Company') {
    // Acquirer is named but not in corporate structure map (e.g. "Listed Company" is just a name from input)
    acquirerDiagramType = entityNames.isAcquirerListed ? 'parent' : 'buyer';
    acquirerRootId = generateEntityId(acquirerDiagramType, entityNames.acquiringCompanyName, prefix);
    if (!entities.find(e => e.id === acquirerRootId)) {
      entities.push({
        id: acquirerRootId,
        name: entityNames.acquiringCompanyName,
        type: acquirerDiagramType,
        description: 'Acquiring Company (not in CS map)',
      });
    }
    // No corporate children/ancestors to add if not in map.
    // We might need to add generic shareholders for the acquirer if shareholding data for it exists
    // or if it's known to be listed, implying public shareholders.
    // For now, this path creates a standalone acquirer.
    // If shareholding results.before includes shareholders of this named acquirer:
    const acquirerShareholders = results.shareholding?.before?.filter(sh => sh.name.includes(entityNames.acquiringCompanyName)); // Basic check
    if (acquirerShareholders && acquirerShareholders.length > 0) {
        acquirerShareholders.forEach(holder => {
            const shareholderId = generateEntityId('stockholder', holder.name, prefix);
            if(!entities.find(e => e.id === shareholderId)) {
                entities.push({
                    id: shareholderId,
                    name: holder.name,
                    type: 'stockholder',
                    percentage: holder.percentage,
                    description: `${holder.percentage}% Shareholder of ${entityNames.acquiringCompanyName}`
                });
            }
            relationships.push({
                source: shareholderId,
                target: acquirerRootId,
                type: 'ownership',
                percentage: holder.percentage
            });
        });
    } else if (entityNames.isAcquirerListed) {
        const genericAcquirerShareholderId = generateEntityId('stockholder', `Public Shareholders of ${entityNames.acquiringCompanyName}`, prefix);
        if(!entities.find(e => e.id === genericAcquirerShareholderId)) {
            entities.push({
                id: genericAcquirerShareholderId,
                name: `Public Shareholders of ${entityNames.acquiringCompanyName}`,
                type: 'stockholder',
                percentage: 100, // Collective
                description: `Public shareholders of ${entityNames.acquiringCompanyName}`
            });
        }
        relationships.push({
            source: genericAcquirerShareholderId,
            target: acquirerRootId,
            type: 'ownership',
            percentage: 100
        });
    }


  } else {
    // Fallback if no specific acquirer name (should ideally not happen if entityNames is well-defined)
    acquirerRootId = generateEntityId('buyer', 'Acquiring Company', prefix);
    if (!entities.find(e => e.id === acquirerRootId)) {
      entities.push({
        id: acquirerRootId,
        name: 'Acquiring Company',
        type: 'buyer',
        description: 'Default Acquiring Company',
      });
    }
  }


  // 2. Process Target Company and its structure
  const targetCorpEntityData = Array.from(corporateStructureMap.values()).find(
    ce => ce.name === entityNames.targetCompanyName && ce.type === 'target' // More specific match for target
  );

  const targetId = generateEntityId('target', entityNames.targetCompanyName, prefix);
  if (!entities.find(e => e.id === targetId)) {
    entities.push({
      id: targetId,
      name: entityNames.targetCompanyName,
      type: 'target',
      description: 'Target Company (Pre-Transaction)',
    });
  }

  // Add Target's direct shareholders from `results.shareholding.before`
  // Filter out the Acquirer itself if it's listed as a pre-transaction shareholder of the target
  // (which is unusual unless it's a partial stake increase scenario)
  if (results.shareholding?.before && results.shareholding.before.length > 0) {
    results.shareholding.before
      .filter(holder => holder.name !== entityNames.acquiringCompanyName) // Exclude acquirer from target's shareholders list if present
      .forEach((holder) => {
        const shareholderId = generateEntityId('stockholder', holder.name, prefix);
        if (!entities.find(e => e.id === shareholderId)) {
          entities.push({
            id: shareholderId,
            name: holder.name,
            type: 'stockholder',
            percentage: holder.percentage,
            description: `${holder.percentage}% Shareholder of ${entityNames.targetCompanyName}`,
          });
        }
        relationships.push({
          source: shareholderId,
          target: targetId,
          type: 'ownership',
          percentage: holder.percentage,
        });
      });
  } else if (targetCorpEntityData && !targetCorpEntityData.parentLink && !results.corporateStructure?.relationships.some(r => r.child === targetCorpEntityData?.id)) {
    // Add generic shareholders for Target if no specific ones and no parent in CS
    const genericShareholderId = generateEntityId('stockholder', `Existing Shareholders of ${entityNames.targetCompanyName}`, prefix);
    if (!entities.find(e => e.id === genericShareholderId)) {
      entities.push({
        id: genericShareholderId,
        name: `Existing Shareholders of ${entityNames.targetCompanyName}`,
        type: 'stockholder',
        percentage: 100,
        description: '100% collective ownership',
      });
    }
    relationships.push({
      source: genericShareholderId,
      target: targetId,
      type: 'ownership',
      percentage: 100,
    });
  }


  if (targetCorpEntityData) {
    // Add children (subsidiaries) of the Target
    addCorporateChildren(targetCorpEntityData, targetId, entities, relationships, corporateStructureMap, prefix, new Set(visitedChildren));
    // Add parents (owners) of the Target *other than the main acquirer which is handled separately*
    // The addAncestors logic needs to be careful not to re-add the Acquirer if it's already a parent in CS.
    // However, in "before", the Target is independent. If it has other parents in CS, they should be shown.
    addAncestors(targetCorpEntityData, targetId, entities, relationships, corporateStructureMap, prefix, new Set(visitedAncestry));
  }

  console.log(`Before Structure (Corrected Acquirer Logic): Entities - ${entities.length}, Relationships - ${relationships.length}`);
  entities.forEach(e => console.log(`Before Entity: ${e.id} (${e.type}) Name: ${e.name}`));
  relationships.forEach(r => console.log(`Before Relationship: ${r.source} -> ${r.target} (${r.type})`));

  return { entities, relationships };
};
